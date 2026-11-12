// install.js — handles PWA install prompt + registers service worker 
 
let deferredPrompt = null; 
 
const installContainer = document.getElementById('install-container'); 
const installBtn = document.getElementById('install-btn'); 
 
// Register service worker for offline caching 
if ('serviceWorker' in navigator) { 
  window.addEventListener('load', async () => { 
    try { 
      await navigator.serviceWorker.register('./sw.js'); 
    } catch (e) { 
      // SW registration can fail on file:// or unsupported contexts 
      console.warn('Service worker registration failed:', e); 
    } 
  }); 
} 
 
// Capture the install prompt event 
window.addEventListener('beforeinstallprompt', (e) => { 
  e.preventDefault(); 
  deferredPrompt = e; 
  if (installContainer) installContainer.style.display = 'block'; 
}); 
 
// Handle install button click 
if (installBtn) { 
  installBtn.addEventListener('click', async () => { 
    if (!deferredPrompt) return; 
    deferredPrompt.prompt(); 
 
    const choice = await deferredPrompt.userChoice; 
    deferredPrompt = null; 
 
    // Hide install UI after user interaction 
    if (installContainer) installContainer.style.display = 'none'; 
    console.log('Install choice:', choice); 
  }); 
} 
 
// If already installed, hide install UI 
window.addEventListener('appinstalled', () => { 
  deferredPrompt = null; 
  if (installContainer) installContainer.style.display = 'none'; 
});