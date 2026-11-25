(function () {
  try {
    var stored = localStorage.getItem("goyo-theme");
    var dark =
      stored === "dark" ||
      ((stored === null || stored === "system") &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.colorScheme = dark ? "dark" : "light";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#111a18" : "#f8fafc");
  } catch (e) {
    /* localStorage can be blocked; the light theme is a safe default. */
  }
})();
