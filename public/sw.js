const SHELL_CACHE = "bible-ai-shell-v2";
const BIBLE_CACHE = "bible-ai-bible-v2";
const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/csb.json",
  "/ilokano1973.json",
  "/sw.js"
];
const BIBLE_API_ORIGIN = "https://bible.helloao.org/api/";

self.addEventListener("install", function(event) {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then(function(cache) { return cache.addAll(APP_SHELL); })
      .then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        if (key !== SHELL_CACHE && key !== BIBLE_CACHE) return caches.delete(key);
        return undefined;
      }));
    }).then(function() { return self.clients.claim(); })
  );
});

function isBibleApiRequest(request) {
  return request.method === "GET" && request.url.indexOf(BIBLE_API_ORIGIN) === 0;
}

function isAppRequest(request) {
  const url = new URL(request.url);
  return request.method === "GET" && url.origin === self.location.origin && !url.pathname.startsWith("/api/");
}

function cacheBibleResponse(request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return response;
  return caches.open(BIBLE_CACHE).then(function(cache) {
    cache.put(request, response.clone());
    return response;
  });
}

function networkFirstBible(request) {
  return fetch(request).then(function(response) {
    return cacheBibleResponse(request, response);
  }).catch(function() {
    return caches.match(request).then(function(cached) {
      if (cached) return cached;
      return new Response(JSON.stringify({ error: "This chapter is not cached yet. Connect once to download it for offline reading." }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    });
  });
}

function cacheFirstApp(request) {
  return caches.match(request).then(function(cached) {
    if (cached) return cached;
    return fetch(request).then(function(response) {
      if (response && response.ok) {
        caches.open(SHELL_CACHE).then(function(cache) { cache.put(request, response.clone()); });
      }
      return response;
    });
  }).catch(function() {
    return caches.match("/index.html");
  });
}

self.addEventListener("fetch", function(event) {
  const request = event.request;
  if (isBibleApiRequest(request)) {
    event.respondWith(networkFirstBible(request));
    return;
  }
  if (isAppRequest(request)) {
    event.respondWith(cacheFirstApp(request));
  }
});

self.addEventListener("message", function(event) {
  if (event.data && event.data.type === "SKIP_WAITING") self.skipWaiting();
});
