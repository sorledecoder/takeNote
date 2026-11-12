// ============================================================ 
// install.js — PWA Install Logic with OIP Logo 
// Voice-to-Text App 
// Author: Goodluck Akeekue 
// ============================================================ 
 
'use strict'; 
 
// ---- Store the browser's install prompt event ---- 
let deferredInstallPrompt = null; 
 
const installContainer = document.getElementById('install-container'); 
const installBtn       = document.getElementById('install-btn'); 
 
// ============================================================ 
// 1. CAPTURE THE BROWSER'S BEFOREINSTALLPROMPT EVENT 
//    This fires when the browser detects the app is installable. 
// ============================================================ 
window.addEventListener('beforeinstallprompt', (event) => { 
  // Prevent the default mini-infobar from appearing on mobile 
  event.preventDefault(); 
 
  // Save the event so we can trigger it later 
  deferredInstallPrompt = event; 
 
  // Show the custom install button 
  if (installContainer) { 
    installContainer.style.display = 'block'; 
  } 
 
  console.log('[PWA] Install prompt captured. Install button shown.'); 
}); 
 
// ============================================================ 
// 2. HANDLE INSTALL BUTTON CLICK 
//    Shows the native browser install dialog. 
// ============================================================ 
if (installBtn) { 
  installBtn.addEventListener('click', async () => { 
    if (!deferredInstallPrompt) { 
      console.warn('[PWA] No install prompt available.'); 
      return; 
    } 
 
    // Show the install dialog 
    deferredInstallPrompt.prompt(); 
 
    // Wait for the user to respond 
    const { outcome } = await deferredInstallPrompt.userChoice; 
 
    if (outcome === 'accepted') { 
      console.log('[PWA] User accepted the install prompt.'); 
      showInstallSuccess(); 
    } else { 
      console.log('[PWA] User dismissed the install prompt.'); 
    } 
 
    // Reset — prompt can only be used once 
    deferredInstallPrompt = null; 
 
    // Hide the install button after use 
    if (installContainer) { 
      installContainer.style.display = 'none'; 
    } 
  }); 
} 
 
// ============================================================ 
// 3. DETECT IF APP IS ALREADY INSTALLED 
//    Hides install button if app is running as standalone. 
// ============================================================ 
if (window.matchMedia('(display-mode: standalone)').matches || 
    window.navigator.standalone === true) { 
  console.log('[PWA] Running as installed app (standalone mode).'); 
  if (installContainer) { 
    installContainer.style.display = 'none'; 
  } 
} 
 
// ============================================================ 
// 4. LISTEN FOR SUCCESSFUL APP INSTALLATION 
// ============================================================ 
window.addEventListener('appinstalled', () => { 
  console.log('[PWA] App installed successfully with OIP logo!'); 
  deferredInstallPrompt = null; 
  if (installContainer) { 
    installContainer.style.display = 'none'; 
  } 
  showInstallSuccess(); 
}); 
 
// ============================================================ 
// 5. REGISTER SERVICE WORKER 
//    Required for PWA install + offline support. 
// ============================================================ 
if ('serviceWorker' in navigator) { 
  window.addEventListener('load', () => { 
    navigator.serviceWorker 
      .register('./sw.js') 
      .then((registration) => { 
        console.log('[PWA] Service Worker registered:', registration.scope); 
      }) 
      .catch((error) => { 
        console.error('[PWA] Service Worker registration failed:', error); 
      }); 
  }); 
} 
 
// ============================================================ 
// 6. SHOW INSTALL SUCCESS TOAST NOTIFICATION 
// ============================================================ 
function showInstallSuccess() { 
  const toast = document.createElement('div'); 
  toast.textContent = '✅ Voice-to-Text App installed successfully!'; 
  toast.style.cssText = ` 
    position: fixed; 
    bottom: 30px; 
    left: 50%; 
    transform: translateX(-50%); 
    background: #28a745; 
    color: white; 
    padding: 12px 24px; 
    border-radius: 8px; 
    font-size: 14px; 
    font-weight: bold; 
    z-index: 9999; 
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); 
    animation: fadeIn 0.4s ease; 
  `; 
  document.body.appendChild(toast); 
 
  // Auto-remove after 4 seconds 
  setTimeout(() => { 
    toast.style.opacity = '0'; 
    toast.style.transition = 'opacity 0.5s ease'; 
    setTimeout(() => toast.remove(), 500); 
  }, 4000); 
} 