/* QG du BDE : rend le site installable et l'ouvre même sans réseau.
   - La page (index.html) : toujours la version du réseau d'abord, la copie gardée seulement hors ligne.
   - Les images et icônes : la copie gardée tout de suite, mise à jour en arrière-plan.
   - Les données (Google) et les polices : jamais touchées, elles passent directement. */
const V = "qg-bde-v7";
const CORE = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin) return;
  if (r.mode === "navigate" || u.pathname.endsWith("/") || u.pathname.endsWith(".html")) {
    e.respondWith(
      fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put("index.html", cp)); } return res; })
        .catch(() => caches.match("index.html").then(x => x || caches.match("./")))
    );
    return;
  }
  e.respondWith(caches.open(V).then(c => c.match(r).then(hit => {
    const net = fetch(r).then(res => { if (res.ok) c.put(r, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
