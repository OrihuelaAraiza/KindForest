// The asset list and its version are generated from the deployable files.
importScripts("./offline-assets.js");
const base = self.registration.scope;
const prefix = "kindforest:" + base + ":";
const name = prefix + self.OFFLINE.version;
const urls = new Set(
  self.OFFLINE.files.map((path) => new URL(path, base).href),
);
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(name)
      .then((cache) =>
        cache.addAll(
          [...urls].map((url) => new Request(url, { cache: "reload" })),
        ),
      ),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(prefix) && key !== name) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request,
    url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  let key = url.href;
  if (
    req.mode === "navigate" &&
    [base, new URL("index.html", base).href].includes(url.origin + url.pathname)
  )
    key = new URL("index.html", base).href;
  if (!urls.has(key)) return;
  event.respondWith(
    (async () => (await (await caches.open(name)).match(key)) || fetch(req))(),
  );
});
