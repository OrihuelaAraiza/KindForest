"""Exercise the public atlas against an ephemeral local HTTP server."""

import shutil
import threading
import unittest
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

from playwright.sync_api import expect, sync_playwright


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


class AtlasTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        site = Path(__file__).resolve().parents[1] / "docs"
        handler = partial(QuietHandler, directory=str(site))
        server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        cls.addClassCleanup(server.server_close)
        cls.addClassCleanup(server.shutdown)
        cls.root = f"http://127.0.0.1:{server.server_port}"
        runtime = sync_playwright().start()
        cls.addClassCleanup(runtime.stop)
        cls.browser = runtime.chromium.launch(executable_path=shutil.which("chromium"))
        cls.addClassCleanup(cls.browser.close)

    def test_audience_selection_and_privacy(self):
        for width in (320, 390, 1280):
            with self.subTest(width=width):
                page = self.browser.new_page(viewport={"width": width, "height": 900})
                self.addCleanup(page.close)
                requests, errors = [], []
                page.on("request", lambda req: requests.append(req.url))
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(self.root)
                page.get_by_role("searchbox").fill("hematologia")
                expect(page.locator(".card")).to_have_count(1)
                page.get_by_role("button", name="Hematología clínica").click()
                page.get_by_text("Añadir a mi selección").click()
                page.keyboard.press("Escape")
                expect(page.locator(".card-link")).to_be_focused()
                page.get_by_text("Pacientes y cuidadores", exact=True).click()
                page.get_by_role("button", name="Apoyos en México").click()
                expect(page.locator(".card")).to_have_count(3)
                page.get_by_role("button", name="Mi selección").click()
                expect(page.get_by_text("Hematología clínica", exact=True)).to_be_visible()
                page.keyboard.press("Escape")
                page.go_back()
                expect(page.locator("h1")).to_contain_text("Oncología")
                page.go_forward()
                expect(page.locator("h1")).to_contain_text("Tu próxima")
                page.reload()
                expect(page.locator("#saved-count")).to_have_text("0")
                self.assertTrue(page.evaluate("document.documentElement.scrollWidth <= innerWidth"))
                self.assertEqual(page.evaluate("localStorage.length + sessionStorage.length"), 0)
                self.assertTrue(all(urlsplit(req).netloc == urlsplit(self.root).netloc for req in requests))
                self.assertEqual(errors, [])

    def test_trial_filters_and_print_selection(self):
        page = self.browser.new_page()
        self.addCleanup(page.close)
        page.goto(self.root + "/?vista=pacientes")
        page.get_by_role("button", name="Explorar ensayos clínicos").click()
        page.get_by_label("Ubicación del estudio").select_option("Mexico")
        page.get_by_label("Solo estudios en reclutamiento").check()
        link = urlsplit(page.get_by_text("Ver estudios en el registro").get_attribute("href"))
        self.assertEqual((link.scheme, link.netloc, link.path), ("https", "clinicaltrials.gov", "/search"))
        self.assertEqual(parse_qs(link.query), {"cond": ["Cancer"], "country": ["Mexico"], "aggFilters": ["status:rec"]})
        page.keyboard.press("Escape")
        page.get_by_text("Abrir lista").click()
        expect(page.get_by_text("Imprimir selección")).to_be_disabled()
        page.get_by_role("checkbox").nth(1).check()
        expect(page.get_by_text("Imprimir selección")).to_be_enabled()
        page.emulate_media(media="print")
        expect(page.locator(".check-row").nth(1)).to_be_visible()
        expect(page.locator(".check-row").nth(0)).to_be_hidden()
        expect(page.locator("#main")).to_be_hidden()

    def test_case_workflows(self):
        page = self.browser.new_page(viewport={"width": 390, "height": 844}, accept_downloads=True)
        self.addCleanup(page.close)
        page.goto(self.root)
        dialog = page.get_by_role("dialog")
        def open_tool(name):
            if dialog.is_visible():
                page.keyboard.press("Escape")
            page.get_by_role("button", name="Todo", exact=True).click()
            page.locator(".tool-card").filter(has=page.get_by_text(name, exact=True)).click()

        open_tool("Pacientes de práctica")
        dialog.get_by_text("Crear caso ficticio").click()
        expect(dialog.get_by_label("Caso de práctica")).to_have_value("4")
        dialog.get_by_label("Detalle ficticio opcional", exact=False).fill("Prueba de seguimiento")
        dialog.get_by_text("Registrar nota", exact=True).click()
        expect(dialog.get_by_text("Se revisaron las preguntas del caso. Prueba de seguimiento")).to_be_visible()
        open_tool("Agenda y recepción")
        dialog.get_by_label("Hora", exact=True).fill("15:15")
        dialog.get_by_text("Programar cita").click()
        dialog.get_by_text("Confirmar", exact=True).click()
        dialog.get_by_text("Registrar llegada").click()
        dialog.get_by_text("Marcar atendida").click()
        expect(dialog.get_by_text("Consulta de orientación · Atendida")).to_be_visible()
        with page.expect_download() as calendar:
            dialog.get_by_text("Añadir a calendario").click()
        exported = calendar.value.path().read_text()
        self.assertIn("BEGIN:VCALENDAR", exported)
        self.assertIn("T151500", exported)
        open_tool("Interconsulta")
        dialog.get_by_label("Pregunta sobre el caso ficticio").fill("Revisar el informe de práctica")
        with page.expect_download() as referral:
            dialog.get_by_text("Descargar interconsulta").click()
        self.assertIn("Revisar el informe de práctica", referral.value.path().read_text())
        open_tool("Hospital y camas")
        dialog.get_by_text("Ingresar aquí").first.click()
        dialog.get_by_text("Trasladar aquí").last.click()
        expect(dialog.locator(".desk-row").last).to_contain_text("Caso 4")
        dialog.get_by_text("Dar de alta").click()
        expect(dialog.get_by_text("Disponible",exact=True)).to_have_count(4)
        open_tool("Diario de síntomas")
        dialog.get_by_label("Aspecto a registrar").select_option("Cansancio")
        dialog.get_by_text("Añadir al diario").click()
        open_tool("Pendientes y alertas")
        dialog.get_by_text("Marcar revisado").click()
        expect(dialog.get_by_text("No hay reportes pendientes",exact=False)).to_be_visible()
        open_tool("Resumen para compartir")
        dialog.get_by_text("Notas",exact=True).click()
        with page.expect_download() as download:
            dialog.get_by_text("Descargar resumen").click()
        text = download.value.path().read_text()
        self.assertIn("Prueba de seguimiento", text)
        self.assertNotIn("Cansancio", text)
        open_tool("Guías de práctica")
        dialog.get_by_label("Filtrar por nombre").fill("ESMO")
        first = dialog.locator(".reference-entry").first
        title = first.locator("h3").inner_text()
        first.get_by_text("Guardar ficha").click()
        dialog.get_by_text("Solo mis guardados").click()
        expect(dialog.locator(".reference-entry")).to_have_count(1)
        expect(dialog.locator(".reference-entry h3")).to_have_text(title)
        open_tool("Cotizador de atención")
        dialog.get_by_label("Precio unitario en MXN").fill("120.25")
        dialog.get_by_label("Cantidad",exact=True).fill("3")
        dialog.get_by_text("Agregar concepto").click()
        expect(dialog.get_by_text("Total estimado",exact=False)).to_contain_text("360.75")

    def test_command_palette(self):
        page = self.browser.new_page(viewport={"width": 1280, "height": 900})
        self.addCleanup(page.close)
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(self.root)
        palette = page.locator("#palette")
        page.keyboard.press("Control+k")
        expect(palette).to_be_visible()
        expect(page.get_by_role("combobox")).to_be_focused()
        # Literal matches rank above fuzzy look-alikes.
        page.keyboard.type("citas")
        expect(page.get_by_role("option").first).to_contain_text("Agenda y recepción")
        expect(page.get_by_role("combobox")).to_have_attribute("aria-activedescendant", "pal-0")
        page.keyboard.press("Enter")
        expect(palette).to_be_hidden()
        expect(page.locator("#panel-title")).to_have_text("Agenda y recepción")
        page.keyboard.press("Escape")
        # Directory entries open their reference list already filtered.
        page.keyboard.press("/")
        page.keyboard.type("ESMO 2027")
        page.keyboard.press("Enter")
        expect(page.locator("#panel-title")).to_have_text("Mis congresos")
        expect(page.get_by_label("Filtrar por nombre")).to_have_value("ESMO 2027")
        expect(page.locator(".reference-entry h3").first).to_have_text("ESMO 2027")
        page.keyboard.press("Escape")
        # Arrow keys move the active option and wrap around.
        page.get_by_role("button", name="Buscar", exact=True).click()
        options = page.get_by_role("option")
        expect(options.first).to_have_attribute("aria-selected", "true")
        page.keyboard.press("ArrowUp")
        expect(options.last).to_have_attribute("aria-selected", "true")
        page.keyboard.press("ArrowDown")
        expect(options.first).to_contain_text("Cambiar a la vista de pacientes")
        page.keyboard.press("Enter")
        expect(page.locator("h1")).to_contain_text("Tu próxima")
        self.assertIn("vista=pacientes", page.url)
        # Unknown terms explain how to continue instead of showing nothing.
        page.keyboard.press("Control+k")
        page.keyboard.type("zzqxw")
        expect(palette.get_by_text("Sin coincidencias", exact=False)).to_be_visible()
        page.keyboard.press("Escape")
        expect(palette).to_be_hidden()
        self.assertEqual(errors, [])

    def test_theme_bookmarks_and_live_figures(self):
        context = self.browser.new_context(viewport={"width": 390, "height": 844}, color_scheme="dark")
        self.addCleanup(context.close)
        page = context.new_page()
        page.goto(self.root)
        html = page.locator("html")
        # The system preference applies first; the visitor can override it for the session.
        expect(html).to_have_attribute("data-theme", "dark")
        page.get_by_role("button", name="Lectura y acceso").click()
        page.get_by_role("button", name="Claro", exact=True).click()
        expect(html).to_have_attribute("data-theme", "light")
        expect(page.get_by_role("button", name="Claro", exact=True)).to_have_attribute("aria-pressed", "true")
        page.keyboard.press("Escape")
        # Hero figures come from the data, per audience.
        expect(page.locator('[data-stat="tools"]')).to_have_text("48")
        expect(page.locator('[data-stat="congresses"]')).to_have_text("14")
        # Saving from a card updates the counter, the card and the open record.
        card = page.locator(".card").filter(has_text="Hematología clínica")
        mark = card.get_by_role("button", name="Guardar")
        mark.click()
        expect(mark).to_have_attribute("aria-pressed", "true")
        expect(card).to_have_class("card is-saved")
        expect(page.locator("#saved-count")).to_have_text("1")
        expect(page.locator("#announce")).to_have_text("Recurso añadido a mi selección.")
        card.get_by_role("button", name="Hematología clínica").click()
        page.get_by_text("Quitar de mi selección").click()
        page.keyboard.press("Escape")
        expect(mark).to_have_attribute("aria-pressed", "false")
        expect(page.locator("#saved-count")).to_have_text("0")
        page.locator("#pac").click()
        expect(page.locator('[data-stat="tools"]')).to_have_text("29")
        self.assertEqual(page.evaluate("localStorage.length + sessionStorage.length"), 0)
        self.assertTrue(page.evaluate("document.documentElement.scrollWidth <= innerWidth"))

    def test_every_tool_and_offline_revisit(self):
        context = self.browser.new_context(viewport={"width":320,"height":800})
        self.addCleanup(context.close)
        page = context.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(self.root)
        for role in ("pro","pac"):
            page.locator("#"+role).click()
            page.get_by_role("button",name="Todo",exact=True).click()
            tools = page.locator(".tool-card")
            self.assertGreater(tools.count(), 20)
            page.wait_for_function("Array.from(document.querySelectorAll('.tool-card img')).every(i => i.complete && i.naturalWidth > 0)")
            for item in tools.all():
                item.click()
                expect(page.locator("#panel")).to_be_visible()
                self.assertGreater(len(page.locator("#panel-body").inner_text().strip()), 10)
                self.assertTrue(page.locator("#panel").evaluate("p => p.scrollWidth <= p.clientWidth + 1"), item.inner_text())
                page.keyboard.press("Escape")
            self.assertTrue(page.evaluate("document.documentElement.scrollWidth <= innerWidth"))
        page.wait_for_function("!!navigator.serviceWorker.controller")
        context.set_offline(True)
        page.reload()
        expect(page.get_by_role("heading",name="Mi espacio de cuidado")).to_be_visible()
        page.get_by_text("Diario de síntomas", exact=True).click()
        expect(page.get_by_text("Añadir al diario")).to_be_visible()
        self.assertEqual(errors, [])


if __name__ == "__main__":
    unittest.main()
