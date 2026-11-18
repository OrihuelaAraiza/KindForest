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


if __name__ == "__main__":
    unittest.main()
