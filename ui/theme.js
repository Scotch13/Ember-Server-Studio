// Eseguito prima dei fogli di stile per applicare subito la preferenza salvata.
(() => {
  let theme = 'dark';
  try { if (localStorage.getItem('ember-theme') === 'light') theme = 'light'; } catch {}
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
})();
