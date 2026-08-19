(function () {
  var THEME_CACHE = "bible-ai-theme-packs-v1";
  var activePhotoUrl = null;
  var packs = [
    { id: "forest-mist", title: "Forest Mist", theme: "forest", script: "/theme-packs/forest-mist.js", detail: "Misty evergreen hillside · 44 KB", position: "50% 46%", mobilePosition: "55% 50%" },
    { id: "forest-canopy", title: "Forest Canopy", theme: "forest", script: "/theme-packs/forest-canopy.js", detail: "Evergreen canopy texture · 92 KB", position: "50% 50%", mobilePosition: "50% 50%" },
    { id: "moonlit-grove", title: "Moonlit Grove", theme: "dark", script: "/theme-packs/moonlit-grove.js", detail: "For Dark · 36 KB", position: "52% 55%", mobilePosition: "56% 54%" },
    { id: "obsidian-waves", title: "Obsidian Waves", theme: "dark", script: "/theme-packs/obsidian-waves.js", detail: "For Dark · 176 KB", position: "50% 50%", mobilePosition: "50% 50%" },
    { id: "storm-canopy", title: "Storm Canopy", theme: "dark", script: "/theme-packs/storm-canopy.js", detail: "For Dark · 44 KB", position: "50% 46%", mobilePosition: "50% 45%" },
    { id: "golden-light", title: "Golden Light", theme: "light", script: "/theme-packs/golden-light.js", detail: "For Light · 76 KB", position: "55% 52%", mobilePosition: "58% 50%" },
    { id: "open-sky", title: "Open Sky", theme: "light", script: "/theme-packs/open-sky.js", detail: "For Light · 452 KB", position: "50% 54%", mobilePosition: "56% 55%" },
    { id: "ocean-clear-sky", title: "Clear Water", theme: "ocean", script: "/theme-packs/ocean-clear-sky.js", detail: "For Ocean · 44 KB", position: "50% 55%", mobilePosition: "54% 54%" },
    { id: "ocean-lagoon", title: "Tropical Lagoon", theme: "ocean", script: "/theme-packs/ocean-lagoon.js", detail: "For Ocean · 72 KB", position: "52% 54%", mobilePosition: "55% 54%" },
    { id: "ocean-sunset", title: "Ocean Sunset", theme: "ocean", script: "/theme-packs/ocean-sunset.js", detail: "For Ocean · 60 KB", position: "50% 58%", mobilePosition: "54% 58%" },
    { id: "storm-coast", title: "Storm Coast", theme: "ocean", script: "/theme-packs/storm-coast.js", detail: "For Ocean · 392 KB", position: "50% 54%", mobilePosition: "53% 54%" },
    { id: "lavender-field", title: "Lavender Field", theme: "lavender", script: "/theme-packs/lavender-field.js", detail: "For Lavender · 248 KB", position: "66% 55%", mobilePosition: "68% 54%" },
    { id: "lavender-golden", title: "Golden Lavender", theme: "lavender", script: "/theme-packs/lavender-golden.js", detail: "For Lavender · 48 KB", position: "58% 52%", mobilePosition: "62% 52%" },
    { id: "lavender-horizon", title: "Lavender Horizon", theme: "lavender", script: "/theme-packs/lavender-horizon.js", detail: "For Lavender · 68 KB", position: "50% 54%", mobilePosition: "55% 54%" },
    { id: "bloom-tulips", title: "Spring Tulips", theme: "bloom", script: "/theme-packs/bloom-tulips.js", detail: "For Bloom · 84 KB", position: "50% 52%", mobilePosition: "54% 52%" },
    { id: "bloom-blossom-close", title: "Blossom Close", theme: "bloom", script: "/theme-packs/bloom-blossom-close.js", detail: "For Bloom · 52 KB", position: "54% 46%", mobilePosition: "62% 46%" },
    { id: "bloom-blossom-park", title: "Blossom Park", theme: "bloom", script: "/theme-packs/bloom-blossom-park.js", detail: "For Bloom · 72 KB", position: "52% 52%", mobilePosition: "59% 52%" }
  ];

  function selectedPack(theme) { return localStorage.getItem("bible_theme_pack_" + theme); }

  function setStatus(message) {
    var status = document.getElementById("theme-download-status");
    if (status) status.textContent = message;
  }

  function clearThemePhoto() {
    document.body.style.removeProperty("--theme-downloaded-photo");
    document.body.style.removeProperty("--theme-photo-position");
    document.body.style.removeProperty("--theme-photo-mobile-position");
  }

  function applyBaseThemePhoto() {
    var base = window.BIBLE_THEME_BASE;
    if (!base || !base.data) { clearThemePhoto(); return; }
    document.body.style.setProperty("--theme-downloaded-photo", 'url("' + base.data + '")');
    document.body.style.setProperty("--theme-photo-position", "50% 52%");
    document.body.style.setProperty("--theme-photo-mobile-position", "54% 52%");
  }

  async function cachedPack(pack) {
    if (!("caches" in window)) return null;
    var cache = await caches.open(THEME_CACHE);
    return cache.match(pack.script);
  }

  function executePackScript(source) {
    var script = document.createElement("script");
    script.type = "text/javascript";
    script.text = source;
    document.head.appendChild(script);
    script.remove();
  }

  async function loadPack(pack, allowDownload) {
    window.BIBLE_THEME_PACKS = window.BIBLE_THEME_PACKS || {};
    if (window.BIBLE_THEME_PACKS[pack.id]) return window.BIBLE_THEME_PACKS[pack.id];
    var response = await cachedPack(pack);
    if (!response && allowDownload && navigator.onLine) {
      var networkResponse = await fetch(pack.script, { cache: "no-store" });
      if (!networkResponse.ok) throw new Error("Download unavailable");
      response = networkResponse.clone();
      if ("caches" in window) {
        var cache = await caches.open(THEME_CACHE);
        await cache.put(pack.script, response.clone());
      }
    }
    if (!response) return null;
    executePackScript(await response.text());
    return window.BIBLE_THEME_PACKS[pack.id] || null;
  }

  async function applyDownloadedThemePhoto(theme) {
    var packId = selectedPack(theme);
    var pack = packs.find(function (item) { return item.id === packId; });
    if (!pack) {
      applyBaseThemePhoto();
      return;
    }
    try {
      var definition = await loadPack(pack, false);
      if (!definition) {
        localStorage.removeItem("bible_theme_pack_" + theme);
        applyBaseThemePhoto();
        renderThemePacks();
        return;
      }
      document.body.style.setProperty("--theme-downloaded-photo", 'url("' + definition.data + '")');
      document.body.style.setProperty("--theme-photo-position", pack.position || "center");
      document.body.style.setProperty("--theme-photo-mobile-position", pack.mobilePosition || pack.position || "center");
    } catch (_) {
      applyBaseThemePhoto();
    }
  }

  async function downloadPack(id) {
    var pack = packs.find(function (item) { return item.id === id; });
    if (!pack || !navigator.onLine) { setStatus("Connect to the internet to download a theme photo."); return; }
    setStatus("Downloading " + pack.title + " code pack for offline use…");
    try {
      var definition = await loadPack(pack, true);
      if (!definition) throw new Error("Download unavailable");
      localStorage.setItem("bible_theme_pack_" + pack.theme, pack.id);
      if ((localStorage.getItem("bible_theme") || "forest") === pack.theme) await applyDownloadedThemePhoto(pack.theme);
      setStatus(pack.title + " code pack is ready for offline use.");
      renderThemePacks();
    } catch (_) { setStatus("The photo could not be downloaded. Please try again later."); }
  }

  async function removePack(id) {
    var pack = packs.find(function (item) { return item.id === id; });
    if (!pack || !("caches" in window)) return;
    var cache = await caches.open(THEME_CACHE);
    await cache.delete(pack.script);
    if (window.BIBLE_THEME_PACKS) delete window.BIBLE_THEME_PACKS[pack.id];
    if (selectedPack(pack.theme) === pack.id) localStorage.removeItem("bible_theme_pack_" + pack.theme);
    if ((localStorage.getItem("bible_theme") || "forest") === pack.theme) await applyDownloadedThemePhoto(pack.theme);
    setStatus(pack.title + " was removed from this device.");
    renderThemePacks();
  }

  async function renderThemePacks() {
    var grid = document.getElementById("theme-pack-grid");
    if (!grid) return;
    var cards = await Promise.all(packs.map(async function (pack) {
      var downloaded = Boolean((window.BIBLE_THEME_PACKS && window.BIBLE_THEME_PACKS[pack.id]) || await cachedPack(pack));
      return '<article class="theme-pack"><strong>' + pack.title + '</strong><small>' + pack.detail + '</small><div class="theme-pack-actions">' + (downloaded ? '<button type="button" class="ghost-btn" data-theme-use="' + pack.id + '">Use photo</button><button type="button" class="ghost-btn" data-theme-remove="' + pack.id + '">Remove</button>' : '<button type="button" class="primary-btn" data-theme-download="' + pack.id + '">Download</button>') + '</div></article>';
    }));
    grid.innerHTML = cards.join("");
  }

  function addThemeDownloads() {
    var settings = document.getElementById("settings-slot");
    if (!settings || document.getElementById("theme-downloads")) return;
    var panel = document.createElement("section");
    panel.id = "theme-downloads";
    panel.className = "theme-downloads";
    panel.innerHTML = '<h3>Offline theme photo packs</h3><p>Forest is included as a Base64 code pack. Download an optional code pack only when you want it; each photo stays on this device until removed.</p><div id="theme-pack-grid" class="theme-pack-grid"></div><p id="theme-download-status" class="theme-download-status" aria-live="polite"></p>';
    panel.addEventListener("click", async function (event) {
      var download = event.target.closest("[data-theme-download]");
      var use = event.target.closest("[data-theme-use]");
      var remove = event.target.closest("[data-theme-remove]");
      if (download) return downloadPack(download.dataset.themeDownload);
      if (use) {
        var pack = packs.find(function (item) { return item.id === use.dataset.themeUse; });
        if (!pack) return;
        localStorage.setItem("bible_theme_pack_" + pack.theme, pack.id);
        if (typeof window.changeTheme === "function") window.changeTheme(pack.theme);
        setStatus(pack.title + " is now used by the " + pack.theme + " theme.");
        return renderThemePacks();
      }
      if (remove) return removePack(remove.dataset.themeRemove);
    });
    settings.parentNode.insertBefore(panel, settings);
    renderThemePacks();
  }

  window.applyDownloadedThemePhoto = applyDownloadedThemePhoto;
  window.applyBaseThemePhoto = applyBaseThemePhoto;
  function activateSettings() {
    if (typeof window.switchPage === "function") window.switchPage("settings");
    var settings = document.getElementById("qa-settings");
    if (settings) {
      settings.classList.remove("is-open");
      if (typeof window.syncAiProviderUi === "function") window.syncAiProviderUi();
    }
  }

  function moveSettings() {
    var settings = document.getElementById("qa-settings");
    var slot = document.getElementById("settings-slot");
    if (!settings || !slot || slot.contains(settings)) return;
    settings.classList.remove("qa-global-settings", "is-open");
    settings.setAttribute("aria-label", "Bible app settings");
    slot.appendChild(settings);
  }

  function addStudyPulse() {
    var home = document.querySelector("#page-home .page-inner");
    if (!home || document.getElementById("study-pulse")) return;
    var panel = document.createElement("section");
    panel.id = "study-pulse";
    panel.className = "study-pulse";
    panel.setAttribute("aria-label", "Study rhythm");
    panel.innerHTML = '<div><p class="pulse-kicker">Today’s study rhythm</p><h3>Read. Reflect. Return.</h3><p>Keep your reading, reflection, and personal notes connected in one calm study space.</p></div><div class="pulse-actions"><button type="button" class="ghost-btn" data-study-action="browse">Open Scripture</button><button type="button" class="primary-btn" data-study-action="notes">Write a reflection</button></div>';
    panel.addEventListener("click", function (event) {
      var button = event.target.closest("[data-study-action]");
      if (!button || typeof window.switchPage !== "function") return;
      window.switchPage(button.dataset.studyAction === "notes" ? "notes" : "browse");
    });
    home.appendChild(panel);
  }

  document.addEventListener("DOMContentLoaded", function () {
    moveSettings();
    addStudyPulse();
    addThemeDownloads();
    applyBaseThemePhoto();
    applyDownloadedThemePhoto(localStorage.getItem("bible_theme") || "forest");
  });
})();
