(() => {
  const menuButton = document.querySelector(".landing-menu-button");
  const nav = document.querySelector(".landing-links");
  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
})();
