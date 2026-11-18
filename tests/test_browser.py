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
