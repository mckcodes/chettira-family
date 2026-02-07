(function () {
  var storageKey = "theme";
  var toggle = document.querySelector(".theme-toggle");
  if (!toggle) {
    return;
  }

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.setAttribute("data-theme", "light");
      toggle.setAttribute("aria-pressed", "true");
      toggle.setAttribute("aria-label", "Switch to dark theme");
      toggle.textContent = "Light";
    } else {
      document.body.removeAttribute("data-theme");
      toggle.setAttribute("aria-pressed", "false");
      toggle.setAttribute("aria-label", "Switch to light theme");
      toggle.textContent = "Dark";
    }
  }

  var saved = localStorage.getItem(storageKey);
  applyTheme(saved === "light" ? "light" : "dark");

  toggle.addEventListener("click", function () {
    var isLight = document.body.getAttribute("data-theme") === "light";
    var nextTheme = isLight ? "dark" : "light";
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  });
})();
