(function () {
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

  function addSettingsNavigation() {
    var nav = document.getElementById("nav-tabs");
    if (!nav || document.querySelector('.nav-tab[data-page="settings"]')) return;
    var button = document.createElement("button");
    button.className = "nav-tab";
    button.type = "button";
    button.dataset.page = "settings";
    button.textContent = "⚙ Settings";
    button.addEventListener("click", activateSettings);
    nav.appendChild(button);
  }

  document.addEventListener("DOMContentLoaded", function () {
    moveSettings();
    addSettingsNavigation();
  });
})();
