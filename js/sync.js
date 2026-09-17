/**
 * sync.js - PWA Installation, Offline Connectivity Monitor & Data Sync Engine
 * Dr. Mahmoud Ghanema Clinic Management System
 */

let deferredInstallPrompt = null;

// --- 1. Service Worker Registration ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('✅ Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

// --- 2. PWA Native Installation (Add to Home Screen) ---
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent browser default mini-infobar
  e.preventDefault();
  deferredInstallPrompt = e;

  // Show install button in header and mobile
  const installBtn = document.getElementById('btn-pwa-install');
  if (installBtn) {
    installBtn.classList.remove('hidden');
    installBtn.classList.add('flex');
  }
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  const installBtn = document.getElementById('btn-pwa-install');
  if (installBtn) installBtn.classList.add('hidden');
  showToast('🎉 تم تثبيت تطبيق العيادة بنجاح على جهازك!', 'success');
});

async function triggerPWAInstall() {
  if (!deferredInstallPrompt) {
    // If iOS Safari or browser already installed
    showToast('على الآيفون: اضغط على زر المشاركة (Share) ثم اختر "إضافة إلى الشاشة الرئيسية"', 'info');
    return;
  }

  deferredInstallPrompt.prompt();
  const { outcome } = await deferredInstallPrompt.userChoice;
  if (outcome === 'accepted') {
    deferredInstallPrompt = null;
    const installBtn = document.getElementById('btn-pwa-install');
    if (installBtn) installBtn.classList.add('hidden');
  }
}

// --- 3. Online / Offline Connectivity Detection ---
function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const indicatorEl = document.getElementById('network-status-badge');
  if (!indicatorEl) return;

  if (isOnline) {
    indicatorEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span class="text-[11px] font-bold text-emerald-800 hidden sm:inline">أونلاين (متصل)</span>
    `;
    indicatorEl.className = 'px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-sm';
    indicatorEl.title = 'متصل بالإنترنت - ميزة تفريغ الذكاء الاصطناعي نشطة';
  } else {
    indicatorEl.innerHTML = `
      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
      <span class="text-[11px] font-bold text-amber-800 hidden sm:inline">أوفلاين (محلي)</span>
    `;
    indicatorEl.className = 'px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1.5 shadow-sm';
    indicatorEl.title = 'يعمل محلياً بدون إنترنت - كافة السجلات محفوظة في الجهاز بأمان';
  }
}

window.addEventListener('online', () => {
  updateNetworkStatus();
  showToast('🟢 تم استعادة الاتصال بالإنترنت! ميزة الذكاء الاصطناعي جاهزة الآن.', 'success');
});

window.addEventListener('offline', () => {
  updateNetworkStatus();
  showToast('🟡 انقطع الاتصال بالإنترنت. النظام مستمر بالعمل محلياً بأمان (أوفلاين).', 'warning');
});

document.addEventListener('DOMContentLoaded', () => {
  updateNetworkStatus();
});
