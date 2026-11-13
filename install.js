// ============================================================
// install.js — handles the "Install App" button and registers
// the service worker so the app shell works offline.
// ============================================================

let deferredPrompt;
const installContainer = document.getElementById('install-container');
const installBtn        = document.getElementById('install-btn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installContainer) installContainer.style.display = 'block';
});

if (installBtn) {
  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (installContainer) installContainer.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  if (installContainer) installContainer.style.display = 'none';
  deferredPrompt = null;
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((err) => {
      console.error('Service worker registration failed:', err);
    });
  });
}
