"""Audit key states with axe-core (WCAG 2.0/2.1 A and AA rules).

axe-core is not shipped with the site. Point AXE_CORE at a local axe.min.js,
for example from `npm pack axe-core@4.10.3`:

    AXE_CORE=path/to/axe.min.js python3 tests/test_accessibility.py
"""

import os
import shutil
import threading
import unittest
from functools import partial
from http.server import ThreadingHTTPServer
from pathlib import Path

from playwright.sync_api import sync_playwright

from test_browser import QuietHandler

AXE = os.environ.get("AXE_CORE")
RULES = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]


@unittest.skipUnless(AXE and Path(AXE).is_file(), "AXE_CORE no apunta a axe.min.js")
class AccessibilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        site = Path(__file__).resolve().parents[1] / "docs"
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=str(site)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        cls.addClassCleanup(server.server_close)
        cls.addClassCleanup(server.shutdown)
        cls.root = f"http://127.0.0.1:{server.server_port}"
        cls.source = Path(AXE).read_text()
        runtime = sync_playwright().start()
        cls.addClassCleanup(runtime.stop)
        cls.browser = runtime.chromium.launch(executable_path=shutil.which("chromium"))
        cls.addClassCleanup(cls.browser.close)

    def audit(self, page, label):
        page.add_script_tag(content=self.source)
        found = page.evaluate(
            "rules => axe.run(document, {runOnly: {type: 'tag', values: rules}, resultTypes: ['violations']})"
            ".then(r => r.violations.map(v => v.id + ': ' + v.nodes.map(n => n.target.join(' ')).join(', ')))",
            RULES,
        )
        self.assertEqual(found, [], label)

    def test_states_in_both_themes(self):
        for scheme in ("light", "dark"):
            for width in (390, 1280):
                with self.subTest(scheme=scheme, width=width):
                    # bypass_csp lets the audit script run; the site itself is unchanged.
                    context = self.browser.new_context(
                        viewport={"width": width, "height": 900},
                        color_scheme=scheme,
                        reduced_motion="reduce",
                        bypass_csp=True,
                    )
                    self.addCleanup(context.close)
                    page = context.new_page()
                    for view in ("/", "/?vista=pacientes"):
                        page.goto(self.root + view)
                        self.audit(page, view)
                    page.keyboard.press("Control+k")
                    page.keyboard.type("apoyo")
                    self.audit(page, "palette")
                    page.keyboard.press("Escape")
                    page.locator(".tool-card").first.click()
                    self.audit(page, "tool dialog")
                    page.keyboard.press("Escape")
                    page.locator(".figure-open").first.click()
                    self.audit(page, "figure record")
                    page.keyboard.press("Escape")
                    page.locator(".card .bookmark").first.click()
                    page.locator("#open-saved").click()
                    self.audit(page, "selection")


if __name__ == "__main__":
    unittest.main()
