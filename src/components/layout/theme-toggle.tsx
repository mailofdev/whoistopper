"use client";

export function ThemeToggle() {
  return (
    <button
      type="button"
      className="grid h-11 w-11 place-items-center rounded-full text-lg text-secondary hover:bg-white/40"
      aria-label="Switch color theme"
      onClick={() => {
        const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
        document.documentElement.dataset.theme = next;
        window.localStorage.setItem("rp-theme", next);
      }}
    >
      <span className="theme-moon">☾</span>
      <span className="theme-sun">☀</span>
    </button>
  );
}
