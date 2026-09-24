/**
 * app.js - Main Application Logic for Dr. Mahmoud Ghanema Clinic System
 */

let state = {
  patients: [],
  currentPatient: null,
  currentVisits: [],
  activeTab: 'gallery',
  selectedVisitFilter: null,
  jointMapInstance: null,
  pendingImages: [], // array of { name, data, mimeType }
  extractedData: null
};

// Top-level camera & connection state
var liveCameraStream = null;
var currentFacingMode = 'environment'; // default to rear camera
var activeServerUrls = null;

// Lightbox & Edit Visit state
var currentLightboxImages = [];
var currentLightboxIndex = 0;
var currentLightboxVisitId = null;
var editVisitState = { visitId: null, images: [] };
var targetVisitForDirectPhotoAdd = null;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await window.clinicDB.init();
    await window.checkAndSeedInitialData();
    if (window.clinicAuth) {
      await window.clinicAuth.init();
    }
    await loadPatients();
    setupEventListeners();
    fetchActiveUrls();

    // Check if there is a patient parameter or select first
    if (state.patients.length > 0) {
      if (window.innerWidth >= 1024) {
        selectPatient(state.patients[0].id);
      } else {
        // On mobile, keep directory list as first screen and prepare selection
        state.currentPatient = state.patients[0];
        state.currentVisits = await window.clinicDB.getVisitsByPatient(state.patients[0].id);
        renderPatientHeader();
        renderCurrentTab();
        showMobileView('patients');
      }
    }
  } catch (err) {
    console.error('Initialization error:', err);
    showToast('حدث خطأ أثناء تحميل البيانات: ' + err.message, 'error');
  }
});

// --- Data Loading ---
async function loadPatients(query = '') {
  state.patients = await window.clinicDB.searchPatients(query);
  renderPatientsList();
  updateHeaderStats();
}

function handleSearchInput(val) {
  const clearBtnDesktop = document.getElementById('btn-clear-search-desktop');
  const clearBtnMobile = document.getElementById('btn-clear-search-mobile');
  const hasVal = !!(val && val.trim());

  if (clearBtnDesktop) {
    clearBtnDesktop.classList.toggle('hidden', !hasVal);
    clearBtnDesktop.classList.toggle('flex', hasVal);
  }
  if (clearBtnMobile) {
    clearBtnMobile.classList.toggle('hidden', !hasVal);
    clearBtnMobile.classList.toggle('flex', hasVal);
  }

  // Sync inputs across desktop and mobile
  const desktopInput = document.getElementById('global-search-input');
  const mobileInput = document.getElementById('mobile-search-input');
  if (desktopInput && desktopInput.value !== val) desktopInput.value = val;
  if (mobileInput && mobileInput.value !== val) mobileInput.value = val;

  loadPatients(val);
}

function clearSearch() {
  const desktopInput = document.getElementById('global-search-input');
  const mobileInput = document.getElementById('mobile-search-input');
  if (desktopInput) desktopInput.value = '';
  if (mobileInput) mobileInput.value = '';

  const clearBtnDesktop = document.getElementById('btn-clear-search-desktop');
  const clearBtnMobile = document.getElementById('btn-clear-search-mobile');
  if (clearBtnDesktop) { clearBtnDesktop.classList.add('hidden'); clearBtnDesktop.classList.remove('flex'); }
  if (clearBtnMobile) { clearBtnMobile.classList.add('hidden'); clearBtnMobile.classList.remove('flex'); }

  loadPatients('');
}

// Expose globals for sync.js and HTML listeners
window.state = state;
window.loadPatients = loadPatients;
window.handleSearchInput = handleSearchInput;
window.clearSearch = clearSearch;
window.renderPatientsList = renderPatientsList;
window.renderCurrentTab = renderCurrentTab;
window.renderPatientHeader = renderPatientHeader;
window.renderVisitsDatesBar = renderVisitsDatesBar;
window.selectPatient = selectPatient;
window.filterByVisit = filterByVisit;
window.switchTab = switchTab;
window.toggleAIAccordion = toggleAIAccordion;
window.openUploadModal = openUploadModal;
window.closeUploadModal = closeUploadModal;
window.saveSheetDirectly = saveSheetDirectly;
window.openManualNewPatientModal = openManualNewPatientModal;
window.saveManualNewPatient = saveManualNewPatient;
window.openEditPatientModal = openEditPatientModal;
window.saveEditedPatient = saveEditedPatient;
window.deleteCurrentPatient = deleteCurrentPatient;
window.deleteVisitConfirm = deleteVisitConfirm;
window.openNewVisitModal = openNewVisitModal;
window.closeNewVisitModal = closeNewVisitModal;
window.saveNewVisitManual = saveNewVisitManual;
window.testAndDetectGeminiKey = testAndDetectGeminiKey;
window.saveSettings = saveSettings;
window.exportBackupFile = exportBackupFile;
window.importBackupFile = importBackupFile;
window.handleBackupFileInput = importBackupFile;
window.reseedSamplePatient = reseedSamplePatient;
window.openSettingsModal = openSettingsModal;
window.closeSettingsModal = closeSettingsModal;
window.prefillLogin = prefillLogin;
window.handleLoginSubmit = handleLoginSubmit;
window.togglePasswordVisibility = togglePasswordVisibility;
window.saveDoctorAccountSettings = saveDoctorAccountSettings;
window.saveModeratorAccountSettings = saveModeratorAccountSettings;
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;
window.openLightboxFromVisit = openLightboxFromVisit;
window.nextLightboxImage = nextLightboxImage;
window.prevLightboxImage = prevLightboxImage;
window.setLightboxIndex = setLightboxIndex;
window.downloadLightboxImage = downloadLightboxImage;
window.openEditVisitModal = openEditVisitModal;
window.closeEditVisitModal = closeEditVisitModal;
window.saveEditedVisit = saveEditedVisit;
window.deleteVisitConfirmFromEditModal = deleteVisitConfirmFromEditModal;
window.handleEditVisitPhotoUpload = handleEditVisitPhotoUpload;
window.removeEditVisitPhoto = removeEditVisitPhoto;
window.addPhotoToVisitDirect = addPhotoToVisitDirect;
window.handleDirectVisitPhotoSelected = handleDirectVisitPhotoSelected;
window.deletePhotoFromVisit = deletePhotoFromVisit;
window.printVisitReport = printVisitReport;
window.triggerBrowserPrint = triggerBrowserPrint;
window.startLiveCamera = startLiveCamera;
window.stopLiveCamera = stopLiveCamera;
window.captureFromLiveCamera = captureFromLiveCamera;
window.switchLiveCameraFacing = switchLiveCameraFacing;
window.showMobileView = showMobileView;
window.triggerDirectMobileCamera = triggerDirectMobileCamera;
window.handleDirectCameraCapture = handleDirectCameraCapture;
window.openMobileConnectModal = openMobileConnectModal;
window.closeMobileConnectModal = closeMobileConnectModal;
window.copyMobileUrl = copyMobileUrl;
window.showToast = showToast;
window.formatDate = formatDate;
window.escapeHtml = escapeHtml;


function updateHeaderStats() {
  const totalCountEl = document.getElementById('stat-total-patients');
  if (totalCountEl) totalCountEl.textContent = state.patients.length;
}

// --- UI Rendering: Patient List / Directory ---
function renderPatientsList() {
  const container = document.getElementById('patients-list-container');
  if (!container) return;

  if (state.patients.length === 0) {
    const searchVal = (document.getElementById('global-search-input')?.value || document.getElementById('mobile-search-input')?.value || '').trim();
    if (searchVal) {
      container.innerHTML = `
        <div class="p-6 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-2">
          <i data-lucide="search-x" class="w-10 h-10 mx-auto text-slate-300"></i>
          <p class="font-bold text-slate-700 text-sm">لا يوجد مريض مطابق لـ "${escapeHtml(searchVal)}"</p>
          <p class="text-xs text-slate-400">تأكد من كتابة الاسم أو الكود أو الهاتف بشكل صحيح</p>
          <button onclick="clearSearch()" class="mt-2 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1 transition-all">
            ✕ مسح البحث
          </button>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="p-5 text-center text-slate-400 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-3">
          <div class="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 mx-auto flex items-center justify-center">
            <i data-lucide="users" class="w-6 h-6"></i>
          </div>
          <div>
            <p class="font-bold text-slate-800 text-sm">سجل المرضى فارغ حالياً</p>
            <p class="text-xs text-slate-400 mt-0.5">يمكنك إضافة مريض جديد أو تصوير شيت ورقي فوراً</p>
          </div>
          <div class="pt-2 flex flex-col gap-2">
            <button onclick="openManualNewPatientModal()" class="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5 transition-all">
              <i data-lucide="user-plus" class="w-4 h-4"></i> إضافة مريض جديد الآن
            </button>
            <button onclick="openUploadModal()" class="w-full py-2 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all">
              <i data-lucide="camera" class="w-4 h-4 text-teal-600"></i> تصوير ورفع شيت ورقي
            </button>
            <button onclick="reseedSamplePatient()" class="pt-1 text-[11px] text-teal-600 hover:text-teal-800 font-semibold hover:underline">
              🔄 استعادة مريض تجريبي (فاطمة إسماعيل - كود 594)
            </button>
          </div>
        </div>
      `;
    }
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = state.patients.map(p => {
    const isSelected = state.currentPatient && state.currentPatient.id === p.id;
    const hasPhone = !!(p.phone && p.phone.trim() && p.phone !== 'بدون هاتف' && p.phone !== 'غير مسجل');
    return `
      <div onclick="selectPatient('${p.id}')" 
           class="p-3.5 sm:p-4 rounded-2xl cursor-pointer transition-all duration-200 border text-right ${
             isSelected 
               ? 'bg-gradient-to-r from-teal-50/90 to-emerald-50/80 border-teal-500 shadow-md ring-2 ring-teal-500/20' 
               : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-teal-300 shadow-sm'
           }">
        <div class="flex items-center justify-between mb-1.5">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800 flex items-center gap-1">
            <span class="text-[10px] text-teal-600">كود:</span> ${p.code || '---'}
          </span>
          <div class="flex items-center gap-1">
            ${hasPhone ? `
              <a href="tel:${escapeHtml(p.phone)}" onclick="event.stopPropagation()" title="اتصال بالهاتف" class="p-1 text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-all">
                <i data-lucide="phone" class="w-3.5 h-3.5"></i>
              </a>
            ` : ''}
            <button onclick="event.stopPropagation(); selectPatient('${p.id}'); openUploadModal();" title="تصوير شيت سريع" class="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-all">
              <i data-lucide="camera" class="w-3.5 h-3.5"></i>
            </button>
            <span class="text-[11px] text-slate-400 font-medium mr-1">${formatDate(p.updatedAt || p.createdAt)}</span>
          </div>
        </div>
        <h4 class="font-bold text-slate-800 text-sm sm:text-base mb-1 flex items-center gap-1.5">
          <i data-lucide="user" class="w-4 h-4 text-teal-600 shrink-0"></i>
          <span class="truncate">${escapeHtml(p.name)}</span>
        </h4>
        <div class="text-xs text-slate-500 flex flex-wrap items-center gap-2.5 mt-1.5">
          <span class="flex items-center gap-1"><i data-lucide="phone" class="w-3 h-3 text-slate-400"></i> ${escapeHtml(p.phone || 'بدون هاتف')}</span>
          <span class="flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3 text-slate-400"></i> ${p.age ? p.age + ' سنة' : ''}</span>
          <span class="flex items-center gap-1"><i data-lucide="activity" class="w-3 h-3 text-slate-400"></i> ${p.sex || ''}</span>
        </div>
        ${(p.diagnosis && (!window.clinicAuth || window.clinicAuth.isAdmin())) ? `
          <div class="mt-2 pt-1.5 border-t border-slate-100 text-xs text-teal-700 font-medium truncate flex items-center gap-1">
            <i data-lucide="stethoscope" class="w-3 h-3 text-teal-600 shrink-0"></i>
            <span class="truncate">${escapeHtml(p.diagnosis)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  if (window.lucide) lucide.createIcons();
}

// --- Select Patient & Render Profile ---
async function selectPatient(patientId) {
  const patient = await window.clinicDB.getPatient(patientId);
  if (!patient) return;

  state.currentPatient = patient;
  state.selectedVisitFilter = null;
  state.currentVisits = await window.clinicDB.getVisitsByPatient(patientId);

  // Highlight in sidebar list
  renderPatientsList();

  // Show profile view container, hide empty placeholder
  const emptyView = document.getElementById('patient-empty-view');
  const profileView = document.getElementById('patient-profile-view');
  if (emptyView) emptyView.classList.add('hidden');
  if (profileView) profileView.classList.remove('hidden');

  renderPatientHeader();
  renderCurrentTab();

  // On mobile devices, automatically switch view to the patient profile
  if (window.innerWidth < 1024) {
    showMobileView('profile');
  }
}

function renderPatientHeader() {
  const p = state.currentPatient;
  if (!p) return;

  const nameEl = document.getElementById('p-header-name');
  if (nameEl) nameEl.textContent = p.name || 'بدون اسم';

  const codeEl = document.getElementById('p-header-code');
  if (codeEl) codeEl.textContent = p.code || '---';

  const phoneEl = document.getElementById('p-header-phone');
  if (phoneEl) phoneEl.textContent = p.phone || 'غير مسجل';

  const phoneLink = document.getElementById('p-header-phone-link');
  if (phoneLink) {
    if (p.phone && p.phone.trim() && p.phone !== 'غير مسجل') {
      phoneLink.href = 'tel:' + p.phone.trim();
    } else {
      phoneLink.removeAttribute('href');
    }
  }

  const ageEl = document.getElementById('p-header-age');
  if (ageEl) ageEl.textContent = p.age ? `${p.age} سنة` : 'غير محدد';

  const sexEl = document.getElementById('p-header-sex');
  if (sexEl) sexEl.textContent = p.sex || 'غير محدد';

  const addrEl = document.getElementById('p-header-address');
  if (addrEl) addrEl.textContent = p.address || 'العنوان غير مدخل';

  const isMod = window.clinicAuth && window.clinicAuth.isModerator();
  const diagEl = document.getElementById('p-header-diagnosis');
  if (diagEl) {
    if (isMod) {
      diagEl.textContent = '🔒 بيانات طبية خاصة بالطبيب';
    } else {
      diagEl.textContent = p.diagnosis || 'لم يحدد تشخيص بعد';
    }
  }

  const visitsBadge = document.getElementById('p-header-visits-count');
  if (visitsBadge) visitsBadge.textContent = `${state.currentVisits.length} زيارة`;

  // Hide or show doctor-only tabs in the navigation bar
  document.querySelectorAll('.doctor-only-tab').forEach(el => {
    el.classList.toggle('hidden', isMod);
  });

  // Doctor-only actions (like delete button)
  document.querySelectorAll('.admin-only-action').forEach(el => {
    el.classList.toggle('hidden', isMod);
  });

  // Render Visits Dates Filter Bar
  renderVisitsDatesBar();
}

function renderVisitsDatesBar() {
  const container = document.getElementById('patient-visits-dates-bar');
  if (!container) return;

  if (!state.currentVisits || state.currentVisits.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 italic">لا توجد زيارات مسجلة لهذا المريض بعد</span>`;
    return;
  }

  const isAll = !state.selectedVisitFilter;
  let html = `
    <button onclick="filterByVisit(null)" class="shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
      isAll 
        ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-500/20' 
        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
    }">
      كل الشيتات (${state.currentVisits.length})
    </button>
  `;

  state.currentVisits.forEach(v => {
    const isSelected = state.selectedVisitFilter === v.id;
    const isConsultation = v.type && v.type.includes('استشارة');
    const badgeColor = isConsultation ? 'text-amber-800 bg-amber-50 border-amber-200' : 'text-teal-800 bg-teal-50 border-teal-200';
    const activeColor = isConsultation ? 'bg-amber-600 text-white' : 'bg-teal-600 text-white';

    html += `
      <button onclick="filterByVisit('${v.id}')" class="shrink-0 px-3 py-1 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
        isSelected 
          ? activeColor + ' shadow-sm ring-2 ring-teal-500/20' 
          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
      }">
        <span>🗓️ ${formatDate(v.date)}</span>
        <span class="text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${isSelected ? 'bg-white/25 text-white' : badgeColor}">
          ${v.type || 'كشف'}
        </span>
      </button>
    `;
  });

  container.innerHTML = html;
  if (window.lucide) lucide.createIcons();
}

function filterByVisit(visitId) {
  state.selectedVisitFilter = visitId;
  renderVisitsDatesBar();
  renderCurrentTab();
}

function switchTab(tabKey) {
  state.activeTab = tabKey;
  document.querySelectorAll('.patient-tab-btn').forEach(btn => {
    const key = btn.getAttribute('data-tab');
    if (key === tabKey) {
      btn.className = 'patient-tab-btn active px-4 py-2.5 rounded-xl font-bold text-sm bg-teal-600 text-white shadow-sm flex items-center gap-2 transition-all';
    } else {
      btn.className = 'patient-tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm text-slate-600 hover:text-teal-700 hover:bg-teal-50/50 flex items-center gap-2 transition-all';
    }
  });

  renderCurrentTab();
}

function renderCurrentTab() {
  const container = document.getElementById('tab-content-area');
  if (!container || !state.currentPatient) return;

  switch (state.activeTab) {
    case 'timeline':
      renderTimelineTab(container);
      break;
    case 'gallery':
    default:
      renderGalleryTab(container);
      break;
  }

  if (window.lucide) lucide.createIcons();
}

// --- Tab 1: Visits Timeline ---
function renderTimelineTab(container) {
  if (state.currentVisits.length === 0) {
    container.innerHTML = `
      <div class="p-10 text-center text-slate-400 bg-white rounded-2xl border border-slate-100">
        <i data-lucide="clipboard-list" class="w-12 h-12 mx-auto mb-2 opacity-40"></i>
        <h3 class="font-bold text-slate-700 text-base">لا توجد زيارات مسجلة لهذا المريض</h3>
        <p class="text-sm text-slate-400 mt-1">يمكنك إضافة زيارة جديدة أو رفع وتفريغ الشيت بالذكاء الاصطناعي</p>
        <button onclick="openNewVisitModal()" class="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold rounded-xl shadow-sm inline-flex items-center gap-2">
          <i data-lucide="plus" class="w-4 h-4"></i> تسجيل زيارة جديدة
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="flex items-center justify-between mb-4">
      <h3 class="font-bold text-slate-800 text-base flex items-center gap-2">
        <i data-lucide="history" class="w-5 h-5 text-teal-600"></i>
        سجل الزيارات والكشوفات (${state.currentVisits.length})
      </h3>
      <button onclick="openNewVisitModal()" class="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all">
        <i data-lucide="plus" class="w-4 h-4"></i> إضافة زيارة جديدة
      </button>
    </div>

    <div class="relative pl-4 space-y-6 before:absolute before:top-3 before:bottom-3 before:right-5 before:w-0.5 before:bg-teal-100">
      ${state.currentVisits.map((v, idx) => `
        <div class="relative pr-11">
          <!-- Timeline Icon Bubble -->
          <div class="absolute right-2.5 top-0 -translate-x-1/2 w-6 h-6 rounded-full bg-teal-600 border-4 border-white shadow flex items-center justify-center text-white text-[10px] font-bold">
            ${state.currentVisits.length - idx}
          </div>

          <!-- Visit Card -->
          <div class="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all">
            <div class="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-3">
              <div class="flex flex-wrap items-center gap-2">
                <span class="px-3 py-1 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                  ${v.type || 'كشف / متابعة'}
                </span>
                ${v.isPendingAI ? `
                  <span class="px-2.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded-full text-[10px] font-black flex items-center gap-1 animate-pulse">
                    <i data-lucide="clock" class="w-3 h-3 text-amber-700"></i> محفوظ محلياً (بانتظار النت)
                  </span>
                ` : ''}
                <span class="text-sm font-bold text-slate-700 flex items-center gap-1">
                  <i data-lucide="calendar" class="w-4 h-4 text-teal-600"></i> ${formatDate(v.date)}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <button onclick="openEditVisitModal('${v.id}')" class="px-2.5 py-1 text-xs font-bold text-slate-700 hover:text-teal-800 hover:bg-teal-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-all shadow-sm" title="تعديل الشيت والزيارة وإضافة/حذف صور">
                  <i data-lucide="edit-3" class="w-3.5 h-3.5 text-teal-600"></i> تعديل
                </button>
                ${v.images && v.images.length > 0 ? `
                  <button onclick="runAILaterForVisit('${v.id}')" class="px-3 py-1 text-xs font-bold text-amber-900 hover:text-white bg-amber-100 hover:bg-amber-600 border border-amber-300 rounded-xl inline-flex items-center gap-1.5 transition-all shadow-sm">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5 text-amber-700"></i> تفريغ الشيت بالذكاء الاصطناعي (متوفر نت)
                  </button>
                ` : ''}
                <button onclick="printVisitReport('${v.id}')" class="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-teal-700 hover:bg-teal-50 border border-slate-200 rounded-lg inline-flex items-center gap-1.5 transition-all">
                  <i data-lucide="printer" class="w-3.5 h-3.5 text-teal-600"></i> طباعة روشتة / تقرير
                </button>
                <button onclick="deleteVisitConfirm('${v.id}')" class="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition-colors">
                  <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

            <!-- Vitals Grid -->
            ${v.vitals ? `
              <div class="grid grid-cols-2 sm:grid-cols-5 gap-2 p-2.5 bg-slate-50/80 rounded-xl mb-4 text-xs">
                <div><span class="text-slate-400">الضغط:</span> <b class="text-slate-800">${v.vitals.bp || '---'}</b></div>
                <div><span class="text-slate-400">الوزن:</span> <b class="text-slate-800">${v.vitals.weight ? v.vitals.weight + ' كجم' : '---'}</b></div>
                <div><span class="text-slate-400">الطول:</span> <b class="text-slate-800">${v.vitals.height ? v.vitals.height + ' سم' : '---'}</b></div>
                <div><span class="text-slate-400">النبض:</span> <b class="text-slate-800">${v.vitals.pulse || '---'}</b></div>
                <div><span class="text-slate-400">الحرارة:</span> <b class="text-slate-800">${v.vitals.temp ? v.vitals.temp + ' °C' : '---'}</b></div>
              </div>
            ` : ''}

            <!-- Visit Details -->
            <div class="space-y-3 text-sm">
              ${v.history ? `
                <div>
                  <h5 class="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <i data-lucide="file-text" class="w-3.5 h-3.5 text-teal-600"></i> الشكوى وتطور الأعراض (History):
                  </h5>
                  <p class="text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed font-sans">${escapeHtml(v.history)}</p>
                </div>
              ` : ''}

              ${v.examNotes ? `
                <div>
                  <h5 class="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <i data-lucide="eye" class="w-3.5 h-3.5 text-teal-600"></i> الفحص الإكلينيكي والمفاصل (Examination):
                  </h5>
                  <p class="text-slate-700 bg-slate-50/50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">${escapeHtml(v.examNotes)}</p>
                </div>
              ` : ''}

              ${v.treatment ? `
                <div>
                  <h5 class="text-xs font-bold text-teal-800 mb-1 flex items-center gap-1">
                    <i data-lucide="pill" class="w-3.5 h-3.5 text-teal-600"></i> العلاج والأدوية الموصوفة (Treatment - TTT):
                  </h5>
                  <div class="bg-emerald-50/60 text-emerald-950 border border-emerald-200/70 p-3 rounded-xl whitespace-pre-line font-medium leading-relaxed">
                    ${escapeHtml(v.treatment)}
                  </div>
                </div>
              ` : ''}

              ${v.plan ? `
                <div>
                  <h5 class="text-xs font-bold text-slate-500 mb-1 flex items-center gap-1">
                    <i data-lucide="compass" class="w-3.5 h-3.5 text-teal-600"></i> الخطة والتحاليل المطلوبة (Plan):
                  </h5>
                  <p class="text-slate-700 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">${escapeHtml(v.plan)}</p>
                </div>
              ` : ''}

              <!-- Uploaded Sheet Thumbnails -->
              ${v.images && v.images.length > 0 ? `
                <div class="pt-2">
                  <h5 class="text-xs font-bold text-slate-500 mb-2 flex items-center gap-1">
                    <i data-lucide="image" class="w-3.5 h-3.5 text-teal-600"></i> صور الشيت الورقي لهذه الزيارة (${v.images.length}):
                  </h5>
                  <div class="flex flex-wrap gap-2">
                    ${v.images.map((imgSrc, imgIdx) => `
                      <div onclick="openLightboxFromVisit('${v.id}', ${imgIdx})" class="relative group w-20 h-24 rounded-xl border border-slate-200 overflow-hidden cursor-pointer shadow-sm hover:ring-2 hover:ring-teal-500 transition-all">
                        <img src="${imgSrc}" class="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div class="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                          <i data-lucide="zoom-in" class="w-4 h-4"></i>
                        </div>
                        <span class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-[9px] text-white rounded font-bold">ص ${imgIdx + 1}</span>
                      </div>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// --- Tab 2: Initial Comprehensive Medical Sheet ---
function renderInitialHistoryTab(container) {
  const p = state.currentPatient;

  container.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div class="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
            <i data-lucide="file-check-2" class="w-5 h-5 text-teal-600"></i>
            شيت الزيارة الأولى الشامل (Comprehensive Intake Sheet)
          </h3>
          <p class="text-xs text-slate-400 mt-1">البيانات الديموغرافية والنسائية والتاريخ المرضي والجراحي الكامل</p>
        </div>
        <button onclick="openEditPatientModal()" class="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl inline-flex items-center gap-1.5 transition-all">
          <i data-lucide="edit-3" class="w-3.5 h-3.5"></i> تعديل البيانات
        </button>
      </div>

      <!-- Grid of Demographics & Social -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">المهنة (Occupation):</span>
          <span class="font-bold text-slate-800">${escapeHtml(p.occupation || 'غير محدد')}</span>
        </div>
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">الحالة الاجتماعية والأبناء (Marital & Children):</span>
          <span class="font-bold text-slate-800">${escapeHtml(p.marital || '---')} / ${escapeHtml(p.children || 'بدون أبناء')}</span>
        </div>
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">التدخين (Smoking):</span>
          <span class="font-bold text-slate-800">${escapeHtml(p.smoking || 'لا تدخن')}</span>
        </div>

        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">التاريخ النسائي (G P L):</span>
          <span class="font-bold text-slate-800">${escapeHtml(p.gpl || '---')}</span>
        </div>
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">الدورة الشهرية (Menses):</span>
          <span class="font-bold text-slate-800">${escapeHtml(p.menses || '---')}</span>
        </div>
        <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
          <span class="text-xs text-slate-400 block mb-1">وسيلة منع الحمل (Contraception):</span>
          <span class="font-bold text-slate-800">${escapeHtml(p.contraception || 'لا يوجد')}</span>
        </div>
      </div>

      <!-- Medical & Surgical History -->
      <div class="space-y-3 pt-2">
        <div class="p-4 bg-rose-50/50 rounded-xl border border-rose-100 text-sm">
          <h4 class="font-bold text-rose-800 text-xs mb-1 flex items-center gap-1.5">
            <i data-lucide="shield-alert" class="w-4 h-4 text-rose-600"></i> الحساسية الدوائية (Allergy):
          </h4>
          <p class="text-slate-800 font-medium">${escapeHtml(p.allergy || 'لا يوجد حساسية معروفة')}</p>
        </div>

        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
          <h4 class="font-bold text-slate-700 text-xs mb-1 flex items-center gap-1.5">
            <i data-lucide="scissors" class="w-4 h-4 text-teal-600"></i> العمليات الجراحية السابقة (Operations):
          </h4>
          <p class="text-slate-800">${escapeHtml(p.operations || 'لا يوجد عمليات مسجلة')}</p>
        </div>

        <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
          <h4 class="font-bold text-slate-700 text-xs mb-1 flex items-center gap-1.5">
            <i data-lucide="users" class="w-4 h-4 text-teal-600"></i> التاريخ العائلي للأمراض (Family History):
          </h4>
          <p class="text-slate-800">${escapeHtml(p.familyHistory || 'لا يوجد أمراض وراثية مسجلة')}</p>
        </div>

        <div class="p-4 bg-amber-50/50 rounded-xl border border-amber-100 text-sm">
          <h4 class="font-bold text-amber-800 text-xs mb-1 flex items-center gap-1.5">
            <i data-lucide="pill" class="w-4 h-4 text-amber-600"></i> العلاج الحالي قبل الزيارة (Current TTT):
          </h4>
          <p class="text-slate-800 font-medium">${escapeHtml(p.currentTTT || 'لا يتناول أدوية حالياً')}</p>
        </div>
      </div>

      <!-- Main Complaint Narrative -->
      <div class="pt-2">
        <h4 class="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
          <i data-lucide="clipboard-pen" class="w-4 h-4 text-teal-600"></i>
          الشكوى الرئيسية وتاريخ المرض بالتفصيل (Main Complaint & Review of Systems):
        </h4>
        <div class="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800 font-sans text-sm leading-relaxed whitespace-pre-line">
          ${escapeHtml(p.mainComplaint || 'لم تسجل شكوى مفصلة.')}
        </div>
      </div>
    </div>
  `;
}

// --- Tab 3: Interactive Joint Homunculus Map ---
function renderJointMapTab(container) {
  const latestVisit = state.currentVisits[0];
  const initialJoints = latestVisit?.jointStates || {};

  container.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
            <i data-lucide="person-standing" class="w-5 h-5 text-teal-600"></i>
            مخطط المفاصل التفاعلي (Rheumatology Joint Homunculus)
          </h3>
          <p class="text-xs text-slate-400 mt-1">تحديد المفاصل الملتهبة والمتورمة والمؤلمة وحساب درجات النشاط الإكلينيكي</p>
        </div>
        <button onclick="saveJointMapChanges()" class="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-all">
          <i data-lucide="save" class="w-4 h-4"></i> حفظ التعديل في أحدث زيارة
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <!-- Joint SVG Column -->
        <div class="lg:col-span-6 flex justify-center">
          <div id="interactive-joint-container" class="w-full max-w-[420px]"></div>
        </div>

        <!-- Clinical Joint Notes Column -->
        <div class="lg:col-span-6 space-y-4">
          <div class="p-4 bg-teal-50/50 rounded-2xl border border-teal-100">
            <h4 class="font-bold text-teal-900 text-sm mb-2 flex items-center gap-1.5">
              <i data-lucide="stethoscope" class="w-4 h-4 text-teal-600"></i> ملاحظات الفحص الإكلينيكي الحالية:
            </h4>
            <p class="text-slate-700 text-sm leading-relaxed whitespace-pre-line">
              ${escapeHtml(latestVisit?.examNotes || 'لا توجد ملاحظات إكلينيكية مسجلة في أحدث زيارة.')}
            </p>
          </div>

          <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-2">
            <h5 class="font-bold text-slate-700 flex items-center gap-1">
              <i data-lucide="info" class="w-3.5 h-3.5 text-teal-600"></i> إرشادات الاستخدام السريع:
            </h5>
            <ul class="list-disc list-inside space-y-1 text-slate-500">
              <li>اضغط نقرة أولى على أي مفصل: يتحول للأصفر للدلالة على الألم عند الضغط (Tender Joint).</li>
              <li>اضغط نقرة ثانية: يتحول للأحمر للدلالة على وجود تورم أو ارتشاح نشط (Swollen Joint).</li>
              <li>اضغط نقرة ثالثة: يتحول للبنفسجي للدلالة على وجود ألم وتورم معاً.</li>
              <li>النقرة الرابعة تعيد المفصل لحالته الطبيعية.</li>
            </ul>
          </div>

          <!-- Original Joint Drawing Photo Thumbnail if exists -->
          ${latestVisit?.images?.[1] ? `
            <div class="p-4 bg-white rounded-2xl border border-slate-200">
              <span class="text-xs font-bold text-slate-600 block mb-2">رسمة الشيت الأصلي المرفوع (مقارنة بصرية):</span>
              <div onclick="openLightbox('${latestVisit.images[1]}')" class="h-44 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:ring-2 hover:ring-teal-500 transition-all">
                <img src="${latestVisit.images[1]}" class="w-full h-full object-contain bg-slate-50" />
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Instantiate Joint Map Component
  state.jointMapInstance = new JointMapComponent('interactive-joint-container', {
    readonly: false,
    onChange: (states) => {
      // States changed
    }
  });
  state.jointMapInstance.setStates(initialJoints);
}

async function saveJointMapChanges() {
  if (!state.jointMapInstance || state.currentVisits.length === 0) {
    showToast('لا توجد زيارة حالية لحفظ التغييرات بها', 'warning');
    return;
  }
  const latestVisit = state.currentVisits[0];
  latestVisit.jointStates = state.jointMapInstance.getStates();
  await window.clinicDB.saveVisit(latestVisit);
  showToast('تم حفظ حالة المفاصل بنجاح في أحدث كشف', 'success');
}

// --- Tab 4: Longitudinal Labs Evolution Tracker ---
function renderLabsTrackerTab(container) {
  // Collect all visits with labs
  const labVisits = state.currentVisits.filter(v => v.labs && Object.keys(v.labs).length > 0);

  const LAB_PARAMS = [
    { key: 'alt', label: 'ALT (GPT)', normal: 'أقل من 35 U/L' },
    { key: 'ast', label: 'AST (GOT)', normal: 'أقل من 35 U/L' },
    { key: 'creatinine', label: 'Creatinine', normal: '0.6 - 1.2 mg/dL' },
    { key: 'uric_acid', label: 'Uric Acid', normal: '3.5 - 7.2 mg/dL' },
    { key: 'esr', label: 'ESR (سرعة الترسيب)', normal: 'أقل من 20 mm/hr' },
    { key: 'crp', label: 'CRP', normal: 'أقل من 6 mg/L' },
    { key: 'hb', label: 'Hemoglobin (HB)', normal: '12 - 15.5 g/dL' },
    { key: 'plt', label: 'Platelets (PLT)', normal: '150,000 - 450,000' },
    { key: 'tlc', label: 'TLC (كرات الدم البيضاء)', normal: '4,000 - 11,000' },
    { key: 'mcv', label: 'MCV', normal: '80 - 100 fL' },
    { key: 'ca', label: 'Total Calcium (Ca)', normal: '8.5 - 10.5 mg/dL' },
    { key: 'ldl', label: 'LDL / Lipid / INR', normal: 'طبيعي' },
    { key: 'tsh', label: 'TSH', normal: '0.4 - 4.0 mIU/L' },
    { key: 'hba1c', label: 'HbA1c (السكر التراكمي)', normal: 'أقل من 5.7%' },
    { key: 'vit_d', label: 'Vitamin D', normal: '30 - 100 ng/mL' },
    { key: 'hbsag', label: 'HBsAg (فيروس B)', normal: 'سلبي -ve' },
    { key: 'hcv', label: 'HCV Ab (فيروس C)', normal: 'سلبي -ve' },
    { key: 'hiv', label: 'HIV', normal: 'سلبي -ve' },
    { key: 'ana', label: 'ANA', normal: 'سلبي -ve' },
    { key: 'rf', label: 'RF (عامل الروماتويد)', normal: 'أقل من 15 IU/mL' },
    { key: 'anti_ccp', label: 'Anti-CCP', normal: 'أقل من 20 U/mL' }
  ];

  container.innerHTML = `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
        <div>
          <h3 class="font-bold text-slate-800 text-lg flex items-center gap-2">
            <i data-lucide="flask-conical" class="w-5 h-5 text-teal-600"></i>
            جدول تتبع التحاليل الدوري (Longitudinal Labs Evolution)
          </h3>
          <p class="text-xs text-slate-400 mt-1">متابعة الفحوصات الـ 21 والمؤشرات المناعية عبر كافة الزيارات بالتاريخ</p>
        </div>
      </div>

      ${labVisits.length === 0 ? `
        <div class="p-8 text-center text-slate-400 bg-slate-50 rounded-xl">
          <i data-lucide="flask-round" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
          <p class="text-sm font-semibold text-slate-600">لا توجد نتائج تحاليل مسجلة لهذا المريض بعد</p>
          <p class="text-xs text-slate-400 mt-1">يمكنك إضافة نتائج التحاليل عند تسجيل كشف جديد أو عبر استخراج الشيت بالذكاء الاصطناعي</p>
        </div>
      ` : `
        <div class="overflow-x-auto">
          <table class="w-full text-right border-collapse text-xs">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200 text-slate-700">
                <th class="p-3 font-bold border-l border-slate-200 w-48">اسم التحليل (Test)</th>
                <th class="p-3 font-bold border-l border-slate-200 w-36 text-slate-400">المعدل الطبيعي</th>
                ${labVisits.map(v => `
                  <th class="p-3 font-bold text-center border-l border-slate-200 bg-teal-50/70 text-teal-900">
                    <div>${formatDate(v.labs.date || v.date)}</div>
                    <div class="text-[10px] font-normal text-teal-700 mt-0.5">${v.type || 'زيارة'}</div>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${LAB_PARAMS.map(param => {
                // Check if any visit has a value for this param
                const hasValue = labVisits.some(v => v.labs && v.labs[param.key]);
                return `
                  <tr class="hover:bg-slate-50/70 transition-colors ${hasValue ? '' : 'opacity-60'}">
                    <td class="p-3 font-bold text-slate-800 border-l border-slate-100 bg-slate-50/30">
                      ${param.label}
                    </td>
                    <td class="p-3 text-slate-400 border-l border-slate-100">
                      ${param.normal}
                    </td>
                    ${labVisits.map(v => {
                      const val = v.labs ? v.labs[param.key] : '';
                      const isHigh = val && (val.includes('مرتفع') || val.includes('+ve') || parseFloat(val) > 35);
                      return `
                        <td class="p-3 text-center font-bold border-l border-slate-100 ${
                          isHigh ? 'bg-rose-50/70 text-rose-700' : 'text-slate-700'
                        }">
                          ${val ? `
                            <span class="${isHigh ? 'px-2 py-0.5 rounded bg-rose-100 border border-rose-200 inline-block' : ''}">
                              ${escapeHtml(val)}
                            </span>
                          ` : '<span class="text-slate-300">---</span>'}
                        </td>
                      `;
                    }).join('')}
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      `}
    </div>
  `;
}

// --- Tab: Original Sheets Gallery (Photo-First Primary View) ---
function renderGalleryTab(container) {
  const isMod = window.clinicAuth && window.clinicAuth.isModerator();

  // Filter visits if a specific visit date was chosen
  let visitsToDisplay = state.currentVisits;
  if (state.selectedVisitFilter) {
    visitsToDisplay = state.currentVisits.filter(v => v.id === state.selectedVisitFilter);
  }

  const visitsWithImages = visitsToDisplay.filter(v => v.images && v.images.length > 0);

  if (visitsWithImages.length === 0) {
    container.innerHTML = `
      <div class="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center shadow-sm">
        <div class="w-16 h-16 rounded-3xl bg-teal-50 text-teal-600 mx-auto mb-3 flex items-center justify-center">
          <i data-lucide="image-off" class="w-8 h-8 opacity-60"></i>
        </div>
        <h4 class="text-base font-bold text-slate-800 mb-1">لا توجد شيتات مسجلة ${state.selectedVisitFilter ? 'لهذا التاريخ' : 'لهذا المريض'}</h4>
        <p class="text-xs text-slate-400 max-w-sm mx-auto mb-5">
          يمكنك تصوير شيت الكشف أو الاستشارة بالكاميرا، وستظهر الصور هنا فوراً في ملف المريض.
        </p>
        <button onclick="openUploadModal()" class="px-5 py-2.5 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-bold text-xs rounded-xl shadow inline-flex items-center gap-2">
          <i data-lucide="camera" class="w-4 h-4"></i> رفع أو تصوير شيت الآن
        </button>
      </div>
    `;
    if (window.lucide) lucide.createIcons();
    return;
  }

  container.innerHTML = `
    <div class="space-y-6">
      ${visitsWithImages.map(v => {
        const isConsultation = v.type && v.type.includes('استشارة');
        const hasAI = !!(v.extractedData || v.aiProcessed);
        return `
          <div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
            <!-- Visit Header Info Bar -->
            <div class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div class="flex items-center gap-2.5">
                <span class="px-3 py-1 rounded-full text-xs font-bold ${
                  isConsultation ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-teal-100 text-teal-900 border border-teal-200'
                }">
                  ${v.type || 'كشف جديد'}
                </span>
                <span class="font-bold text-sm text-slate-800 flex items-center gap-1.5">
                  <i data-lucide="calendar" class="w-4 h-4 text-teal-600"></i> ${formatDate(v.date)}
                </span>
                <span class="text-xs text-slate-400">(${v.images.length} صفحة)</span>
              </div>

              <!-- Actions on this visit -->
              <div class="flex items-center gap-2">
                ${!isMod ? `
                  <button onclick="openEditVisitModal('${v.id}')" class="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200 shadow-sm" title="تعديل الشيت والزيارة وإضافة/حذف صور">
                    <i data-lucide="edit-3" class="w-3.5 h-3.5 text-teal-600"></i>
                    <span>تعديل</span>
                  </button>
                  <button onclick="toggleAIAccordion('${v.id}')" id="btn-ai-toggle-${v.id}" class="px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm ${
                    hasAI 
                      ? 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200' 
                      : 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white'
                  }">
                    <i data-lucide="sparkles" class="w-3.5 h-3.5"></i>
                    <span>${hasAI ? 'عرض تفريغ الـ AI (English)' : '✨ تفريغ الشيت بالـ AI'}</span>
                  </button>
                  <button onclick="printVisitReport('${v.id}')" class="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-slate-100 rounded-lg transition-all" title="طباعة روشتة / تقرير">
                    <i data-lucide="printer" class="w-4 h-4"></i>
                  </button>
                  <button onclick="deleteVisitConfirm('${v.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" title="حذف الزيارة">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            <!-- Sheets Images Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              ${v.images.map((imgSrc, imgIdx) => {
                if (isMod) {
                  // Moderator: Privacy Shield
                  return `
                    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center h-64">
                      <div class="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center mb-3">
                        <i data-lucide="shield-check" class="w-6 h-6"></i>
                      </div>
                      <span class="font-bold text-xs text-slate-800">شيت طبي محفوظ</span>
                      <span class="text-[11px] text-slate-400 mt-1">صفحة ${imgIdx + 1} - خاص بالطبيب فقط</span>
                    </div>
                  `;
                }
                // Doctor: Full Thumbnail with Lightbox Carousel Zoom & Quick Delete
                return `
                  <div onclick="openLightboxFromVisit('${v.id}', ${imgIdx})" class="group relative bg-slate-50 border border-slate-200 hover:border-teal-400 rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all">
                    <div class="h-64 sm:h-72 overflow-hidden bg-slate-100 flex items-center justify-center p-1 relative">
                      <img src="${imgSrc}" loading="lazy" class="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                      <button type="button" onclick="event.stopPropagation(); deletePhotoFromVisit('${v.id}', ${imgIdx})" title="حذف هذه الصفحة من الشيت" class="absolute top-2 left-2 p-1.5 bg-white/90 hover:bg-rose-600 text-slate-500 hover:text-white rounded-xl shadow-md transition-all sm:opacity-0 group-hover:opacity-100 z-10">
                        <i data-lucide="trash-2" class="w-4 h-4"></i>
                      </button>
                    </div>
                    <div class="p-2.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs">
                      <span class="font-bold text-slate-700">صفحة ${imgIdx + 1} من ${v.images.length}</span>
                      <span class="text-[11px] font-semibold text-teal-700 flex items-center gap-1">
                        <i data-lucide="zoom-in" class="w-3.5 h-3.5"></i> تكبير وتقليب
                      </span>
                    </div>
                  </div>
                `;
              }).join('')}
              ${!isMod ? `
                <div onclick="addPhotoToVisitDirect('${v.id}')" class="border-2 border-dashed border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[16rem] group">
                  <div class="w-12 h-12 rounded-2xl bg-teal-50 group-hover:bg-teal-100 text-teal-600 flex items-center justify-center mb-3 transition-colors shadow-sm">
                    <i data-lucide="plus" class="w-6 h-6"></i>
                  </div>
                  <span class="font-bold text-xs text-slate-700 group-hover:text-teal-900">إضافة صفحة أخرى للشيت</span>
                  <span class="text-[11px] text-slate-400 mt-1">تصوير أو رفع ورقة إضافية</span>
                </div>
              ` : ''}
            </div>

            <!-- On-Demand AI Extraction Accordion (Directly under the sheet) -->
            ${!isMod ? `
              <div id="ai-accordion-${v.id}" class="hidden border border-teal-200 bg-teal-50/20 rounded-2xl overflow-hidden transition-all text-left" dir="ltr">
                <div id="ai-accordion-content-${v.id}" class="p-5 space-y-4">
                  <!-- Rendered dynamically by renderAIAccordionContent -->
                </div>
              </div>
            ` : ''}

          </div>
        `;
      }).join('')}
    </div>
  `;

  if (window.lucide) lucide.createIcons();
}

async function toggleAIAccordion(visitId) {
  const accordion = document.getElementById(`ai-accordion-${visitId}`);
  if (!accordion) return;

  const v = state.currentVisits.find(item => item.id === visitId);
  if (!v) return;

  // Toggle close if already open and has data
  if (!accordion.classList.contains('hidden') && (v.extractedData || v.aiProcessed)) {
    accordion.classList.add('hidden');
    return;
  }

  // If already extracted, render and show
  if (v.extractedData || v.aiProcessed) {
    renderAIAccordionContent(v);
    accordion.classList.remove('hidden');
    return;
  }

  // Needs extraction
  if (!v.images || v.images.length === 0) {
    showToast('لا توجد صور شيتات في هذه الزيارة لتفريغها', 'warning');
    return;
  }

  accordion.classList.remove('hidden');
  const contentEl = document.getElementById(`ai-accordion-content-${visitId}`);
  if (contentEl) {
    contentEl.innerHTML = `
      <div class="py-8 text-center space-y-3">
        <div class="animate-spin inline-block w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
        <p class="font-bold text-sm text-teal-950">Transcribing sheet via Gemini Vision AI (100% English)...</p>
        <p class="text-xs text-slate-500">Deciphering doctor handwriting, symptoms, examination, and prescriptions</p>
      </div>
    `;
  }

  try {
    const formattedImages = v.images.map((dataUri, i) => ({
      data: dataUri,
      mimeType: 'image/jpeg',
      name: `sheet_page_${i + 1}.jpg`
    }));

    const extractFn = (window.geminiExtractor.extractSheetData || window.geminiExtractor.extractFromImages);
    const extracted = await extractFn.call(window.geminiExtractor, formattedImages);
    v.extractedData = extracted;
    v.aiProcessed = true;

    // Map extracted fields to visit
    if (extracted.diagnosis) v.diagnosis = extracted.diagnosis;
    if (extracted.mainComplaint) v.history = extracted.mainComplaint;
    if (extracted.examNotes) v.exam = extracted.examNotes;
    if (extracted.treatment) v.ttt = extracted.treatment;
    if (extracted.plan) v.plan = extracted.plan;
    if (extracted.vitals) v.vitals = extracted.vitals;
    if (extracted.labs) v.labs = extracted.labs;

    // Update patient diagnosis if empty
    if (state.currentPatient && (!state.currentPatient.diagnosis || state.currentPatient.diagnosis === 'لم يحدد تشخيص بعد')) {
      if (extracted.diagnosis) {
        state.currentPatient.diagnosis = extracted.diagnosis;
        await window.clinicDB.savePatient(state.currentPatient);
        renderPatientHeader();
      }
    }

    await window.clinicDB.saveVisit(v);
    showToast('✨ تم استخراج البيانات بالذكاء الاصطناعي بنجاح (100% English)', 'success');

    const btn = document.getElementById(`btn-ai-toggle-${visitId}`);
    if (btn) {
      btn.innerHTML = `<i data-lucide="sparkles" class="w-3.5 h-3.5"></i><span>عرض تفريغ الـ AI (English)</span>`;
      btn.className = 'px-3.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200';
    }

    renderAIAccordionContent(v);
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.error('AI extraction error:', err);
    if (contentEl) {
      contentEl.innerHTML = `
        <div class="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs space-y-2">
          <p class="font-bold">Extraction Error: ${escapeHtml(err.message)}</p>
          <p class="text-slate-600">Please make sure the Gemini API key is configured in settings and you have active internet connection.</p>
          <button onclick="toggleAIAccordion('${visitId}')" class="px-3 py-1.5 bg-rose-700 text-white rounded-lg font-bold">Retry Extraction</button>
        </div>
      `;
    }
    showToast('فشل الاستخراج بالذكاء الاصطناعي: ' + err.message, 'error');
  }
}

function renderAIAccordionContent(v) {
  const contentEl = document.getElementById(`ai-accordion-content-${v.id}`);
  if (!contentEl) return;

  const data = v.extractedData || {
    diagnosis: v.diagnosis,
    mainComplaint: v.history,
    examNotes: v.exam,
    treatment: v.ttt,
    plan: v.plan,
    vitals: v.vitals,
    labs: v.labs
  };

  const hasLabs = data.labs && Object.keys(data.labs).some(k => data.labs[k]);

  contentEl.innerHTML = `
    <!-- Accordion Header -->
    <div class="flex items-center justify-between pb-3 border-b border-teal-200">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
        <h4 class="font-black text-teal-950 text-sm flex items-center gap-1.5">
          <i data-lucide="sparkles" class="w-4 h-4 text-teal-600"></i>
          AI Medical Transcription (100% Medical English)
        </h4>
      </div>
      <div class="flex items-center gap-2">
        <button onclick="printVisitReport('${v.id}')" class="px-3 py-1 bg-white hover:bg-teal-50 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm">
          <i data-lucide="printer" class="w-3.5 h-3.5"></i> Print Prescription
        </button>
        <button onclick="document.getElementById('ai-accordion-${v.id}').classList.add('hidden')" class="px-2.5 py-1 text-slate-500 hover:text-slate-800 text-xs font-bold">
          ▲ Collapse
        </button>
      </div>
    </div>

    <!-- Diagnosis Banner -->
    <div class="p-3 bg-white border border-teal-200 rounded-2xl">
      <div class="text-[11px] font-bold text-teal-700 uppercase tracking-wider mb-1">Clinical Diagnosis</div>
      <div class="text-base font-black text-slate-900">${escapeHtml(data.diagnosis || v.diagnosis || 'Diagnosis not specified')}</div>
    </div>

    <!-- Complaint & Examination Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      <div class="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
        <div class="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-1">
          <i data-lucide="activity" class="w-3.5 h-3.5 text-teal-600"></i> Chief Complaint & Symptoms
        </div>
        <p class="text-slate-800 font-medium leading-relaxed">${escapeHtml(data.mainComplaint || v.history || 'No complaint notes transcribed')}</p>
      </div>

      <div class="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
        <div class="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-1">
          <i data-lucide="stethoscope" class="w-3.5 h-3.5 text-teal-600"></i> Physical & Joint Examination
        </div>
        <p class="text-slate-800 font-medium leading-relaxed">${escapeHtml(data.examNotes || v.exam || 'No physical exam findings recorded')}</p>
      </div>
    </div>

    <!-- Vitals Bar if available -->
    ${data.vitals && (data.vitals.bp || data.vitals.pulse || data.vitals.weight) ? `
      <div class="p-3 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center gap-4 text-xs font-medium text-slate-700">
        <span class="font-bold text-slate-900">Vitals:</span>
        ${data.vitals.bp ? `<span>BP: <b>${escapeHtml(data.vitals.bp)}</b></span>` : ''}
        ${data.vitals.pulse ? `<span>Pulse: <b>${escapeHtml(data.vitals.pulse)} bpm</b></span>` : ''}
        ${data.vitals.weight ? `<span>Weight: <b>${escapeHtml(data.vitals.weight)} kg</b></span>` : ''}
        ${data.vitals.temp ? `<span>Temp: <b>${escapeHtml(data.vitals.temp)} °C</b></span>` : ''}
      </div>
    ` : ''}

    <!-- Treatment / Prescriptions (TTT) -->
    <div class="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-1 text-xs">
      <div class="font-black text-emerald-950 uppercase text-[11px] flex items-center gap-1">
        <i data-lucide="pill" class="w-3.5 h-3.5 text-emerald-700"></i> Prescribed Treatment (TTT)
      </div>
      <p class="text-slate-900 font-semibold leading-relaxed whitespace-pre-line">${escapeHtml(data.treatment || v.ttt || 'No medications prescribed')}</p>
    </div>

    <!-- Plan & Follow-up -->
    ${data.plan || v.plan ? `
      <div class="p-3 bg-white border border-slate-200 rounded-2xl text-xs space-y-1">
        <div class="font-bold text-slate-700 uppercase text-[11px]">Plan & Recommendations</div>
        <p class="text-slate-800 font-medium">${escapeHtml(data.plan || v.plan)}</p>
      </div>
    ` : ''}

    <!-- Labs Table if available -->
    ${hasLabs ? `
      <div class="p-3.5 bg-white border border-slate-200 rounded-2xl text-xs space-y-2">
        <div class="font-bold text-slate-700 uppercase text-[11px] flex items-center gap-1">
          <i data-lucide="flask-conical" class="w-3.5 h-3.5 text-teal-600"></i> Extracted Lab Investigations
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
          ${Object.keys(data.labs).filter(k => data.labs[k]).map(k => `
            <div class="p-2 bg-slate-50 border border-slate-200 rounded-xl text-center">
              <div class="text-[10px] text-slate-400 font-bold uppercase">${k}</div>
              <div class="font-black text-slate-900 text-xs mt-0.5">${escapeHtml(data.labs[k])}</div>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;

  if (window.lucide) lucide.createIcons();
}

// --- In-App Live Camera Engine (WebRTC - Zero Crash, Native Stream) ---
async function startLiveCamera() {
  const videoEl = document.getElementById('live-camera-video');
  const container = document.getElementById('live-camera-container');
  const errorEl = document.getElementById('live-camera-error');
  if (!videoEl || !container) return;

  stopLiveCamera();

  try {
    if (errorEl) errorEl.classList.add('hidden');
    container.classList.remove('hidden');

    const constraints = {
      video: {
        facingMode: { ideal: currentFacingMode || 'environment' },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    liveCameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = liveCameraStream;
    await videoEl.play();
    if (window.lucide) lucide.createIcons();
  } catch (err) {
    console.warn('Live camera access error:', err);
    if (container) container.classList.add('hidden');
    if (errorEl) {
      errorEl.innerHTML = `
        <div class="flex items-center gap-2">
          <i data-lucide="alert-circle" class="w-4 h-4 shrink-0"></i>
          <span>تعذر فتح الكاميرا المباشرة (${escapeHtml(err.message)}). يمكنك استخدام زر "اختيار من المعرض / الصور".</span>
        </div>
      `;
      errorEl.classList.remove('hidden');
      if (window.lucide) lucide.createIcons();
    }
  }
}

function stopLiveCamera() {
  if (typeof liveCameraStream !== 'undefined' && liveCameraStream) {
    try {
      liveCameraStream.getTracks().forEach(t => t.stop());
    } catch { }
    liveCameraStream = null;
  }
  const videoEl = document.getElementById('live-camera-video');
  if (videoEl) videoEl.srcObject = null;
  const container = document.getElementById('live-camera-container');
  if (container) container.classList.add('hidden');
}

async function switchLiveCameraFacing() {
  currentFacingMode = (currentFacingMode === 'environment') ? 'user' : 'environment';
  await startLiveCamera();
}

function captureFromLiveCamera() {
  const videoEl = document.getElementById('live-camera-video');
  if (!videoEl || !videoEl.videoWidth) {
    showToast('الكاميرا غير جاهزة بعد، انتظر لحظة', 'warning');
    return;
  }

  try {
    let width = videoEl.videoWidth;
    let height = videoEl.videoHeight;
    const maxDim = 1600;

    if (width > maxDim || height > maxDim) {
      if (width > height) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(videoEl, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

    state.pendingImages.push({
      name: `sheet_page_${state.pendingImages.length + 1}.jpg`,
      data: dataUrl,
      mimeType: 'image/jpeg',
      width: width,
      height: height
    });

    renderUploadImagesList();
    showToast(`✅ تم التقاط صفحة ${state.pendingImages.length} بنجاح!`, 'success');

    videoEl.classList.add('opacity-40');
    setTimeout(() => videoEl.classList.remove('opacity-40'), 150);
  } catch (err) {
    console.error('Frame capture error:', err);
    showToast('حدث خطأ أثناء التقاط الإطار: ' + err.message, 'error');
  }
}

// --- Image Compression & Mobile Optimization (Zero-Memory ObjectURL) ---
function compressImage(file, maxDimension = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('الملف غير موجود'));

    let blobUrl = null;
    try {
      blobUrl = URL.createObjectURL(file);
    } catch {
      const reader = new FileReader();
      reader.onload = (e) => processImgSrc(e.target.result, null, resolve, reject, file, maxDimension, quality);
      reader.onerror = () => reject(new Error('تعذر قراءة ملف الصورة'));
      reader.readAsDataURL(file);
      return;
    }

    processImgSrc(blobUrl, blobUrl, resolve, reject, file, maxDimension, quality);
  });
}

function processImgSrc(src, blobToRevoke, resolve, reject, file, maxDimension, quality) {
  const img = new Image();
  img.onload = () => {
    try {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (!width || !height) {
        if (blobToRevoke) URL.revokeObjectURL(blobToRevoke);
        return resolve({
          name: file.name || `sheet_${Date.now()}.jpg`,
          data: src,
          mimeType: file.type || 'image/jpeg'
        });
      }

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

      if (blobToRevoke) URL.revokeObjectURL(blobToRevoke);
      canvas.width = 0;
      canvas.height = 0;

      resolve({
        name: file.name ? file.name.replace(/\.[^/.]+$/, '') + '.jpg' : `sheet_${Date.now()}.jpg`,
        data: compressedDataUrl,
        mimeType: 'image/jpeg',
        width: width,
        height: height
      });
    } catch (err) {
      if (blobToRevoke) URL.revokeObjectURL(blobToRevoke);
      reject(err);
    }
  };
  img.onerror = (err) => {
    if (blobToRevoke) URL.revokeObjectURL(blobToRevoke);
    reject(new Error('تعذر فك ترميز ملف الصورة'));
  };
  img.src = src;
}

// --- Upload & Direct Sheet Save Flow ---
function openUploadModal(presetImages = null, targetPatient = null, initialType = 'كشف جديد') {
  if (presetImages !== null) {
    state.pendingImages = presetImages;
  }
  if (targetPatient) {
    state.currentPatient = targetPatient;
  } else if (!state.currentPatient && state.patients.length > 0) {
    state.currentPatient = state.patients[0];
  }

  if (!state.currentPatient && state.patients.length === 0) {
    showToast('يرجى إضافة مريض جديد أولاً قبل رفع الشيت', 'warning');
    openManualNewPatientModal();
    return;
  }

  // Display target patient name in modal header
  const titleNameEl = document.getElementById('upload-modal-patient-name');
  if (titleNameEl) {
    titleNameEl.textContent = state.currentPatient ? `(${state.currentPatient.name})` : '';
  }

  // Set visit type radio (كشف جديد vs استشارة)
  const typeRadios = document.querySelectorAll('input[name="upload-visit-type"]');
  typeRadios.forEach(radio => {
    radio.checked = (radio.value === initialType);
  });

  // Set default visit date to today
  const dateInput = document.getElementById('upload-visit-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  renderUploadImagesList();

  const modal = document.getElementById('upload-modal');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeUploadModal() {
  stopLiveCamera();
  const modal = document.getElementById('upload-modal');
  if (modal) modal.classList.add('hidden');
  state.pendingImages = [];
  renderUploadImagesList();

  // Reset file inputs
  const singleCam = document.getElementById('mobile-camera-single-input');
  if (singleCam) singleCam.value = '';
  const multiGal = document.getElementById('mobile-gallery-input');
  if (multiGal) multiGal.value = '';
  const sheetInput = document.getElementById('sheet-file-input');
  if (sheetInput) sheetInput.value = '';
}

async function handleImageFiles(files) {
  if (!files || files.length === 0) return;

  const validFiles = Array.from(files).filter(f => f.type && f.type.startsWith('image/'));
  if (validFiles.length === 0) {
    showToast('يرجى اختيار ملف صورة صالح (JPG / PNG)', 'warning');
    return;
  }

  showToast(`جاري تجهيز ${validFiles.length} صورة وتحسين الحجم للموبايل...`, 'info');

  for (const file of validFiles) {
    try {
      const processed = await compressImage(file);
      state.pendingImages.push(processed);
    } catch (err) {
      console.error('Image compression error:', err);
      showToast('تعذر معالجة إحدى الصور: ' + err.message, 'warning');
    }
  }

  renderUploadImagesList();
}

function renderUploadImagesList() {
  const container = document.getElementById('uploaded-preview-grid');
  const directSaveBtn = document.getElementById('btn-save-sheet-direct');
  if (!container) return;

  if (state.pendingImages.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-6 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
        <i data-lucide="upload-cloud" class="w-10 h-10 mx-auto mb-2 opacity-40"></i>
        <p class="text-sm font-semibold text-slate-600">لم يتم اختيار أي صور حتى الآن</p>
        <p class="text-xs text-slate-400 mt-1">التقط صورة بكاميرا الهاتف أو اختر صفحات الشيت من الجهاز</p>
      </div>
    `;
    if (directSaveBtn) directSaveBtn.disabled = true;
    if (window.lucide) lucide.createIcons();
    return;
  }

  if (directSaveBtn) directSaveBtn.disabled = false;

  container.innerHTML = state.pendingImages.map((img, idx) => `
    <div class="relative group h-32 rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
      <img src="${img.data}" class="w-full h-full object-cover" />
      <button onclick="removePendingImage(${idx})" class="absolute top-1.5 left-1.5 p-1 bg-rose-600/90 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
      <span class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded font-bold">
        صفحة ${idx + 1}
      </span>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function removePendingImage(idx) {
  state.pendingImages.splice(idx, 1);
  renderUploadImagesList();
}

/**
 * Save sheet images directly to patient file without forcing AI
 */
async function saveSheetDirectly() {
  if (!state.pendingImages || state.pendingImages.length === 0) {
    showToast('يرجى التقاط أو اختيار صورة شيت واحدة على الأقل', 'warning');
    return;
  }

  if (!state.currentPatient) {
    if (state.patients.length > 0) {
      state.currentPatient = state.patients[0];
    } else {
      showToast('يرجى اختيار مريض أو إضافة مريض جديد أولاً لحفظ الشيت في ملفه', 'warning');
      return;
    }
  }

  const directSaveBtn = document.getElementById('btn-save-sheet-direct');
  if (directSaveBtn) directSaveBtn.disabled = true;

  try {
    // Get visit type
    let visitType = 'كشف جديد';
    const checkedRadio = document.querySelector('input[name="upload-visit-type"]:checked');
    if (checkedRadio) {
      visitType = checkedRadio.value;
    }

    // Get visit date
    const dateInput = document.getElementById('upload-visit-date');
    const visitDate = (dateInput && dateInput.value) ? dateInput.value : new Date().toISOString().split('T')[0];

    const visit = {
      id: 'visit_' + Date.now(),
      patientId: state.currentPatient.id,
      date: visitDate,
      type: visitType,
      vitals: {},
      history: '',
      examNotes: '',
      treatment: '',
      plan: '',
      labs: {},
      images: state.pendingImages.map(img => img.data),
      createdAt: new Date().toISOString()
    };

    await window.clinicDB.saveVisit(visit);

    // Sync to Supabase if available
    if (window.clinicSync && typeof window.clinicSync.syncAll === 'function') {
      window.clinicSync.syncAll().catch(e => console.warn('Background sync failed:', e));
    }

    // Refresh current visits & patient UI
    state.currentVisits = await window.clinicDB.getVisitsByPatient(state.currentPatient.id);
    state.selectedVisitFilter = null;

    renderVisitsDatesBar();
    renderPatientHeader();
    renderCurrentTab();

    closeUploadModal();
    showToast(`✅ تم حفظ شيت الزيارة (${visitType}) في ملف المريض بنجاح!`, 'success');
  } catch (err) {
    console.error('Save sheet direct error:', err);
    showToast('حدث خطأ أثناء حفظ الشيت: ' + err.message, 'error');
  } finally {
    if (directSaveBtn) directSaveBtn.disabled = false;
  }
}

/**
 * Re-run AI extraction for a previously stored visit
 */
async function runAILaterForVisit(visitId) {
  await toggleAIAccordion(visitId);
}

// --- Manual New Patient Modal Flow ---
function openManualNewPatientModal() {
  const codeEl = document.getElementById('manual-p-code');
  const nameEl = document.getElementById('manual-p-name');
  const ageEl = document.getElementById('manual-p-age');
  const phoneEl = document.getElementById('manual-p-phone');
  const sexEl = document.getElementById('manual-p-sex');
  const addrEl = document.getElementById('manual-p-address');
  const diagEl = document.getElementById('manual-p-diagnosis');

  if (codeEl) codeEl.value = `RH-${state.patients.length + 101}`;
  if (nameEl) nameEl.value = '';
  if (ageEl) ageEl.value = '';
  if (phoneEl) phoneEl.value = '';
  if (sexEl) sexEl.value = 'أنثى';
  if (addrEl) addrEl.value = '';
  if (diagEl) diagEl.value = '';

  const modal = document.getElementById('new-patient-modal');
  if (modal) modal.classList.remove('hidden');
  if (nameEl) nameEl.focus();
  if (window.lucide) lucide.createIcons();
}

async function saveManualNewPatient() {
  const nameEl = document.getElementById('manual-p-name');
  const codeEl = document.getElementById('manual-p-code');
  const ageEl = document.getElementById('manual-p-age');
  const phoneEl = document.getElementById('manual-p-phone');
  const sexEl = document.getElementById('manual-p-sex');
  const addrEl = document.getElementById('manual-p-address');
  const diagEl = document.getElementById('manual-p-diagnosis');

  const name = nameEl ? nameEl.value.trim() : '';
  if (!name) {
    showToast('يرجى كتابة اسم المريض على الأقل', 'warning');
    return;
  }

  const code = (codeEl && codeEl.value.trim()) ? codeEl.value.trim() : `RH-${state.patients.length + 101}`;

  const newPatient = {
    id: 'patient_' + Date.now(),
    code: code,
    name: name,
    age: ageEl ? ageEl.value.trim() : '',
    phone: phoneEl ? phoneEl.value.trim() : '',
    sex: sexEl ? sexEl.value : 'أنثى',
    address: addrEl ? addrEl.value.trim() : '',
    diagnosis: diagEl ? diagEl.value.trim() : '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await window.clinicDB.savePatient(newPatient);

  if (window.clinicSync && typeof window.clinicSync.pushPatient === 'function') {
    window.clinicSync.pushPatient(newPatient).catch(console.warn);
  }

  const modal = document.getElementById('new-patient-modal');
  if (modal) modal.classList.add('hidden');

  clearSearch();
  await loadPatients();
  await selectPatient(newPatient.id);
  showToast(`✅ تم إضافة ملف المريض "${name}" بنجاح`, 'success');
}

// --- Login Overlay & Role Switching Helpers ---
function prefillLogin(u, p) {
  const uEl = document.getElementById('login-username');
  const pEl = document.getElementById('login-password');
  if (uEl) uEl.value = u;
  if (pEl) pEl.value = p;
  const alertEl = document.getElementById('login-error-alert');
  if (alertEl) alertEl.classList.add('hidden');
}

function togglePasswordVisibility(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.type = el.type === 'password' ? 'text' : 'password';
}

async function handleLoginSubmit(event) {
  if (event) event.preventDefault();
  const uEl = document.getElementById('login-username');
  const pEl = document.getElementById('login-password');
  const remEl = document.getElementById('login-remember');
  const alertEl = document.getElementById('login-error-alert');
  const textEl = document.getElementById('login-error-text');

  const u = uEl ? uEl.value.trim() : '';
  const p = pEl ? pEl.value.trim() : '';
  const remember = remEl ? remEl.checked : true;

  try {
    if (alertEl) alertEl.classList.add('hidden');
    await window.clinicAuth.login(u, p, remember);
  } catch (err) {
    if (alertEl && textEl) {
      textEl.textContent = err.message || 'بيانات الدخول غير صحيحة';
      alertEl.classList.remove('hidden');
    } else {
      showToast(err.message, 'error');
    }
  }
}

// --- Doctor & Moderator Account Settings ---
async function saveDoctorAccountSettings() {
  const u = document.getElementById('setting-admin-username')?.value.trim();
  const p = document.getElementById('setting-admin-password')?.value.trim();
  if (!u || !p) {
    showToast('يرجى كتابة اسم المستخدم وكلمة المرور للدكتور', 'warning');
    return;
  }
  await window.clinicAuth.saveAdminCredentials(u, p);
  showToast('✅ تم حفظ وتحديث بيانات حساب الدكتور بنجاح', 'success');
}

async function saveModeratorAccountSettings() {
  const u = document.getElementById('setting-mod-username')?.value.trim();
  const p = document.getElementById('setting-mod-password')?.value.trim();
  const en = document.getElementById('setting-mod-enabled')?.checked;
  if (!u || !p) {
    showToast('يرجى إدخال اسم مستخدم وكلمة مرور السكرتارية', 'warning');
    return;
  }
  await window.clinicAuth.saveModeratorCredentials(u, p, en);
  showToast('✅ تم حفظ وتحديث إعدادات حساب السكرتارية بنجاح', 'success');
}

// --- Print E-Prescription / Report Modal ---
function printVisitReport(visitId) {
  const visit = state.currentVisits.find(v => v.id === visitId);
  const patient = state.currentPatient;
  if (!visit || !patient) return;

  const modal = document.getElementById('print-modal');
  const printBody = document.getElementById('print-paper-content');

  printBody.innerHTML = `
    <!-- Letterhead Header -->
    <div class="border-b-2 border-teal-700 pb-4 mb-5 flex items-center justify-between">
      <div class="text-right">
        <h2 class="text-2xl font-black text-teal-900 mb-1">د. محمود غنيمة</h2>
        <p class="text-xs font-bold text-teal-700">استشاري ومدرس الروماتيزم والمناعة - كلية الطب، جامعة القاهرة</p>
        <p class="text-[11px] text-slate-500 mt-0.5">دكتوراه أمراض الباطنة والروماتيزم والمناعة | مستشفى دار الفؤاد ومصر الدولي</p>
      </div>
      <div class="w-16 h-16 rounded-full overflow-hidden border border-teal-200">
        <img src="assets/doctor_logo.png" class="w-full h-full object-cover" />
      </div>
    </div>

    <!-- Patient Bar -->
    <div class="bg-teal-50/70 border border-teal-200 rounded-xl p-3 flex flex-wrap items-center justify-between text-xs font-bold text-slate-800 mb-5">
      <div>اسم المريض: <span class="text-teal-900">${escapeHtml(patient.name)}</span></div>
      <div>كود: <span class="text-teal-900">${patient.code}</span></div>
      <div>السن: <span>${patient.age || '---'}</span></div>
      <div>التاريخ: <span>${formatDate(visit.date)}</span></div>
      ${visit.vitals?.bp ? `<div>الضغط: <span class="text-rose-700">${visit.vitals.bp}</span></div>` : ''}
    </div>

    ${patient.diagnosis ? `
      <div class="mb-4 text-xs font-bold text-teal-900 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
        التشخيص (Diagnosis): <span class="font-normal text-slate-800">${escapeHtml(patient.diagnosis)}</span>
      </div>
    ` : ''}

    <!-- Rx / Treatment Body -->
    <div class="min-h-[300px] border border-slate-200 rounded-2xl p-5 mb-5">
      <div class="text-teal-800 font-serif font-black text-3xl mb-3 tracking-widest">℞</div>
      <div class="text-sm text-slate-800 whitespace-pre-line leading-loose font-sans">
        ${escapeHtml(visit.treatment || 'لم يسجل علاج محدد لهذه الزيارة.')}
      </div>
    </div>

    <!-- Plan / Investigations -->
    ${visit.plan ? `
      <div class="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-5">
        <span class="font-bold text-slate-700 block mb-1">التحاليل والتوصيات القادمة (Investigations & Plan):</span>
        <p class="text-slate-600 whitespace-pre-line">${escapeHtml(visit.plan)}</p>
      </div>
    ` : ''}

    <!-- Footer -->
    <div class="border-t border-slate-200 pt-3 flex items-center justify-between text-[11px] text-slate-400">
      <span>تمنياتنا بالشفاء العاجل</span>
      <span class="font-bold text-slate-600">توقيع الطبيب: ...............................</span>
    </div>
  `;

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function triggerBrowserPrint() {
  window.print();
}

// --- Enhanced Lightbox Carousel (Flip between photos, keyboard, touch swipe) ---
function openLightbox(src, images, initialIndex) {
  const lb = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  if (!lb || !img) return;

  if (Array.isArray(images) && images.length > 0) {
    currentLightboxImages = images;
    currentLightboxIndex = (typeof initialIndex === 'number' && initialIndex >= 0 && initialIndex < images.length) ? initialIndex : 0;
  } else {
    currentLightboxImages = src ? [src] : [];
    currentLightboxIndex = 0;
  }

  updateLightboxView();
  lb.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function openLightboxFromVisit(visitId, imgIndex) {
  currentLightboxVisitId = visitId;
  const v = state.currentVisits ? state.currentVisits.find(item => item.id === visitId) : null;
  if (v && v.images && v.images.length > 0) {
    openLightbox(v.images[imgIndex || 0], v.images, imgIndex || 0);
  } else if (imgIndex && typeof imgIndex === 'string') {
    openLightbox(imgIndex, [imgIndex], 0);
  }
}

function updateLightboxView() {
  const lb = document.getElementById('lightbox-modal');
  const img = document.getElementById('lightbox-img');
  const counter = document.getElementById('lightbox-counter');
  const thumbsContainer = document.getElementById('lightbox-thumbs');
  const prevBtn = document.getElementById('lightbox-prev-btn');
  const nextBtn = document.getElementById('lightbox-next-btn');

  if (!img || !currentLightboxImages.length) return;

  // Make sure index is within bounds
  if (currentLightboxIndex < 0) currentLightboxIndex = 0;
  if (currentLightboxIndex >= currentLightboxImages.length) currentLightboxIndex = currentLightboxImages.length - 1;

  const currentSrc = currentLightboxImages[currentLightboxIndex];
  img.src = currentSrc;

  // Update page counter
  if (counter) {
    counter.textContent = `صفحة ${currentLightboxIndex + 1} من ${currentLightboxImages.length}`;
  }

  // Toggle arrow buttons visibility if only 1 image
  const hasMultiple = currentLightboxImages.length > 1;
  if (prevBtn) prevBtn.style.display = hasMultiple ? 'flex' : 'none';
  if (nextBtn) nextBtn.style.display = hasMultiple ? 'flex' : 'none';

  // Render mini thumbnails at bottom
  if (thumbsContainer) {
    if (!hasMultiple) {
      thumbsContainer.innerHTML = '';
      thumbsContainer.classList.add('hidden');
    } else {
      thumbsContainer.classList.remove('hidden');
      thumbsContainer.innerHTML = currentLightboxImages.map((tSrc, idx) => {
        const isActive = idx === currentLightboxIndex;
        return `
          <button type="button" onclick="setLightboxIndex(${idx})" class="w-12 h-14 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
            isActive ? 'border-teal-400 ring-2 ring-teal-400 scale-105 opacity-100' : 'border-white/30 opacity-60 hover:opacity-100'
          }">
            <img src="${tSrc}" class="w-full h-full object-cover" />
          </button>
        `;
      }).join('');
    }
  }
}

function nextLightboxImage() {
  if (!currentLightboxImages || currentLightboxImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex + 1) % currentLightboxImages.length;
  updateLightboxView();
}

function prevLightboxImage() {
  if (!currentLightboxImages || currentLightboxImages.length <= 1) return;
  currentLightboxIndex = (currentLightboxIndex - 1 + currentLightboxImages.length) % currentLightboxImages.length;
  updateLightboxView();
}

function setLightboxIndex(idx) {
  if (idx >= 0 && idx < currentLightboxImages.length) {
    currentLightboxIndex = idx;
    updateLightboxView();
  }
}

function closeLightbox() {
  const lb = document.getElementById('lightbox-modal');
  if (lb) lb.classList.add('hidden');
  currentLightboxImages = [];
  currentLightboxIndex = 0;
  currentLightboxVisitId = null;
}

function downloadLightboxImage() {
  if (!currentLightboxImages || !currentLightboxImages.length) return;
  const currentSrc = currentLightboxImages[currentLightboxIndex];
  if (!currentSrc) return;
  const a = document.createElement('a');
  a.href = currentSrc;
  a.download = `patient-sheet-page-${currentLightboxIndex + 1}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Lightbox Keyboard and Touch Swipe Listeners
(function setupLightboxGestures() {
  // Keyboard: Arrow keys (in RTL Arabic: ArrowRight = previous page, ArrowLeft = next page) and Escape
  window.addEventListener('keydown', (e) => {
    const lb = document.getElementById('lightbox-modal');
    if (!lb || lb.classList.contains('hidden')) return;

    if (e.key === 'Escape') {
      closeLightbox();
    } else if (e.key === 'ArrowRight') {
      prevLightboxImage();
    } else if (e.key === 'ArrowLeft') {
      nextLightboxImage();
    }
  });

  // Touch Swipe for mobile devices
  let touchStartX = 0;
  let touchEndX = 0;
  window.addEventListener('DOMContentLoaded', () => {
    const lb = document.getElementById('lightbox-modal');
    if (lb) {
      lb.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          touchStartX = e.changedTouches[0].screenX;
        }
      }, { passive: true });

      lb.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches[0]) {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchEndX - touchStartX;
          if (Math.abs(diff) > 40) {
            if (diff > 0) {
              // Swiped right (in RTL: previous)
              prevLightboxImage();
            } else {
              // Swiped left (in RTL: next)
              nextLightboxImage();
            }
          }
        }
      }, { passive: true });
    }
  });
})();

// --- Edit Visit & Sheets Management (Modify type, date, add/remove photos, clinical notes) ---
function openEditVisitModal(visitId) {
  const v = state.currentVisits ? state.currentVisits.find(item => item.id === visitId) : null;
  if (!v) {
    showToast('تعذر العثور على بيانات الزيارة المطلوبة', 'warning');
    return;
  }

  editVisitState.visitId = v.id;
  editVisitState.images = Array.isArray(v.images) ? [...v.images] : [];

  const visitIdEl = document.getElementById('ev-visit-id');
  if (visitIdEl) visitIdEl.value = v.id;

  // Visit Type: كشف جديد vs استشارة ومتابعة
  const isConsultation = v.type && v.type.includes('استشارة');
  const typeKashf = document.getElementById('ev-type-kashf');
  const typeEsteshara = document.getElementById('ev-type-esteshara');
  if (typeKashf && typeEsteshara) {
    typeKashf.checked = !isConsultation;
    typeEsteshara.checked = isConsultation;
  }

  // Visit Date
  const dateEl = document.getElementById('ev-date');
  if (dateEl) {
    dateEl.value = v.date ? v.date.split('T')[0] : new Date().toISOString().split('T')[0];
  }

  // Clinical notes
  const diagEl = document.getElementById('ev-diagnosis');
  const tttEl = document.getElementById('ev-ttt');
  const examEl = document.getElementById('ev-exam');

  if (diagEl) diagEl.value = v.diagnosis || (v.extractedData && v.extractedData.diagnosis) || (state.currentPatient && state.currentPatient.diagnosis) || '';
  if (tttEl) tttEl.value = v.treatment || v.ttt || (v.extractedData && v.extractedData.treatment) || '';
  if (examEl) examEl.value = v.examinationNotes || v.examNotes || v.notes || (v.extractedData && v.extractedData.clinicalNotes) || '';

  renderEditVisitPhotosGrid();

  const modal = document.getElementById('edit-visit-modal');
  if (modal) modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeEditVisitModal() {
  const modal = document.getElementById('edit-visit-modal');
  if (modal) modal.classList.add('hidden');
  editVisitState = { visitId: null, images: [] };
}

function renderEditVisitPhotosGrid() {
  const container = document.getElementById('ev-photos-grid');
  if (!container) return;

  if (!editVisitState.images || editVisitState.images.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-4 text-center text-slate-400 border border-dashed border-slate-300 rounded-xl bg-white">
        <p class="font-bold text-xs text-slate-600">لا توجد صور حالياً في هذا الشيت</p>
        <p class="text-[11px] text-slate-400 mt-0.5">يمكنك إضافة صور جديدة من زري "تصوير صفحة" أو "رفع من الجهاز" بالأعلى</p>
      </div>
    `;
    return;
  }

  container.innerHTML = editVisitState.images.map((imgSrc, idx) => `
    <div class="relative group h-28 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <img src="${imgSrc}" class="w-full h-full object-cover" />
      <button type="button" onclick="removeEditVisitPhoto(${idx})" title="حذف هذه الصفحة" class="absolute top-1.5 left-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-md transition-all">
        <i data-lucide="x" class="w-3.5 h-3.5"></i>
      </button>
      <span class="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 text-white text-[10px] rounded font-bold">
        صفحة ${idx + 1}
      </span>
    </div>
  `).join('');

  if (window.lucide) lucide.createIcons();
}

function removeEditVisitPhoto(idx) {
  if (idx >= 0 && idx < editVisitState.images.length) {
    editVisitState.images.splice(idx, 1);
    renderEditVisitPhotosGrid();
  }
}

async function handleEditVisitPhotoUpload(files) {
  if (!files || !files.length) return;
  showToast('جارٍ معالجة وضغط الصور المضافة...', 'info');

  for (let i = 0; i < files.length; i++) {
    try {
      const res = await compressImage(files[i], 1600, 0.82);
      if (res && res.data) {
        editVisitState.images.push(res.data);
      }
    } catch (err) {
      console.error('Error compressing sheet photo:', err);
      showToast('تعذر معالجة إحدى الصور المضافة: ' + err.message, 'warning');
    }
  }

  renderEditVisitPhotosGrid();
  showToast('✅ تم إضافة الصور، لا تنس الضغط على "حفظ التعديلات"', 'success');
}

async function saveEditedVisit() {
  const visitId = editVisitState.visitId || (document.getElementById('ev-visit-id') ? document.getElementById('ev-visit-id').value : null);
  if (!visitId) {
    showToast('خطأ: تعذر تحديد الزيارة', 'error');
    return;
  }

  const v = state.currentVisits ? state.currentVisits.find(item => item.id === visitId) : null;
  if (!v) {
    showToast('تعذر العثور على بيانات الزيارة', 'error');
    return;
  }

  // Read fields
  const typeEsteshara = document.getElementById('ev-type-esteshara');
  const selectedType = (typeEsteshara && typeEsteshara.checked) ? 'استشارة ومتابعة' : 'كشف جديد';

  const dateInput = document.getElementById('ev-date');
  const selectedDate = (dateInput && dateInput.value) ? dateInput.value : v.date;

  const diagInput = document.getElementById('ev-diagnosis');
  const tttInput = document.getElementById('ev-ttt');
  const examInput = document.getElementById('ev-exam');

  const diagnosis = diagInput ? diagInput.value.trim() : '';
  const treatment = tttInput ? tttInput.value.trim() : '';
  const examinationNotes = examInput ? examInput.value.trim() : '';

  // Update object
  v.type = selectedType;
  v.date = selectedDate;
  v.images = [...editVisitState.images];
  v.diagnosis = diagnosis;
  v.treatment = treatment;
  v.examinationNotes = examinationNotes;
  v.updatedAt = new Date().toISOString();

  // If AI extractedData exists, keep its fields synchronized
  if (v.extractedData) {
    if (diagnosis) v.extractedData.diagnosis = diagnosis;
    if (treatment) v.extractedData.treatment = treatment;
    if (examinationNotes) v.extractedData.clinicalNotes = examinationNotes;
  }

  // Also update current patient diagnosis if updated here
  if (diagnosis && state.currentPatient && (!state.currentPatient.diagnosis || state.currentPatient.diagnosis === 'غير محدد')) {
    state.currentPatient.diagnosis = diagnosis;
    await window.clinicDB.savePatient(state.currentPatient);
  }

  await window.clinicDB.saveVisit(v);

  closeEditVisitModal();
  await selectPatient(state.currentPatient.id);
  showToast('✅ تم حفظ تعديلات الشيت والزيارة بنجاح', 'success');
}

function deleteVisitConfirmFromEditModal() {
  const visitId = editVisitState.visitId;
  closeEditVisitModal();
  if (visitId) {
    deleteVisitConfirm(visitId);
  }
}

// --- Quick Direct Add / Delete Photos from Visit Cards ---
function addPhotoToVisitDirect(visitId) {
  targetVisitForDirectPhotoAdd = visitId;
  const fileInput = document.getElementById('direct-visit-photo-input');
  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
}

async function handleDirectVisitPhotoSelected(files) {
  if (!files || !files.length || !targetVisitForDirectPhotoAdd) return;

  const v = state.currentVisits ? state.currentVisits.find(item => item.id === targetVisitForDirectPhotoAdd) : null;
  if (!v) {
    showToast('تعذر العثور على الزيارة المحددة', 'warning');
    return;
  }

  showToast('جارٍ إضافة وضغط الصفحات الجديدة للشيت...', 'info');

  if (!Array.isArray(v.images)) {
    v.images = [];
  }

  for (let i = 0; i < files.length; i++) {
    try {
      const res = await compressImage(files[i], 1600, 0.82);
      if (res && res.data) {
        v.images.push(res.data);
      }
    } catch (err) {
      console.error('Error compressing direct visit photo:', err);
      showToast('تعذر معالجة إحدى الصور المضافة: ' + err.message, 'warning');
    }
  }

  v.updatedAt = new Date().toISOString();
  await window.clinicDB.saveVisit(v);

  targetVisitForDirectPhotoAdd = null;
  await selectPatient(state.currentPatient.id);
  showToast('✅ تم إضافة الصفحات الجديدة للشيت بنجاح', 'success');
}

async function deletePhotoFromVisit(visitId, photoIndex) {
  const v = state.currentVisits ? state.currentVisits.find(item => item.id === visitId) : null;
  if (!v || !Array.isArray(v.images) || photoIndex < 0 || photoIndex >= v.images.length) return;

  const confirmed = confirm(`هل أنت متأكد من حذف الصفحة رقم ${photoIndex + 1} من هذا الشيت؟`);
  if (!confirmed) return;

  v.images.splice(photoIndex, 1);
  v.updatedAt = new Date().toISOString();
  await window.clinicDB.saveVisit(v);

  await selectPatient(state.currentPatient.id);
  showToast('تم حذف الصفحة من الشيت بنجاح', 'info');
}

// --- Settings & Backup ---
async function openSettingsModal() {
  const currentKey = await window.clinicDB.getSetting('gemini_api_key', '');
  const keyInput = document.getElementById('setting-gemini-key');
  if (keyInput) keyInput.value = currentKey;

  const statusEl = document.getElementById('gemini-key-status');
  if (statusEl) {
    const workingModel = await window.clinicDB.getSetting('gemini_working_model', null);
    if (currentKey && workingModel) {
      statusEl.className = 'p-2 rounded-lg text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200 block';
      statusEl.innerHTML = `النموذج النشط حالياً: <b dir="ltr" class="font-mono">${workingModel}</b>`;
    } else {
      statusEl.classList.add('hidden');
    }
  }

  // Populate Doctor and Moderator settings
  if (window.clinicAuth) {
    try {
      const admin = await window.clinicAuth.getAdminCredentials();
      const mod = await window.clinicAuth.getModeratorCredentials();

      const adminUser = document.getElementById('setting-admin-username');
      const adminPass = document.getElementById('setting-admin-password');
      if (adminUser) adminUser.value = admin.username || 'DR';
      if (adminPass) adminPass.value = admin.password || '123';

      const modUser = document.getElementById('setting-mod-username');
      const modPass = document.getElementById('setting-mod-password');
      const modEnabled = document.getElementById('setting-mod-enabled');
      if (modUser) modUser.value = mod.username || 'secretary';
      if (modPass) modPass.value = mod.password || '123';
      if (modEnabled) modEnabled.checked = mod.enabled !== false;
    } catch (e) {
      console.warn('Error loading account settings into modal:', e);
    }
  }

  document.getElementById('settings-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeSettingsModal() {
  document.getElementById('settings-modal').classList.add('hidden');
}

async function testAndDetectGeminiKey() {
  const keyInput = document.getElementById('setting-gemini-key');
  const statusEl = document.getElementById('gemini-key-status');
  const key = keyInput.value.trim();

  if (!key) {
    statusEl.className = 'p-2 rounded-lg text-[11px] font-bold bg-amber-100 text-amber-900 block';
    statusEl.textContent = 'يرجى كتابة أو لصق المفتاح أولاً لفحصه.';
    return;
  }

  statusEl.className = 'p-2 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-700 block';
  statusEl.innerHTML = '<span class="inline-block animate-spin ml-1">⏳</span> جاري فحص المفتاح واكتشاف النماذج المدعومة من Google...';

  try {
    // Clear old model cache so we get fresh one
    await window.clinicDB.setSetting('gemini_working_model', null);
    window.geminiExtractor.activeModel = null;
    const best = await window.geminiExtractor.resolveWorkingModel(key);
    await window.clinicDB.setSetting('gemini_api_key', key);
    window.geminiExtractor.apiKey = key;

    // Quick verification ping
    const testEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${best}:generateContent?key=${key}`;
    const pingRes = await fetch(testEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: "hi" }] }] })
    });

    if (pingRes.ok) {
      statusEl.className = 'p-2.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 block';
      statusEl.innerHTML = `✅ متصل بنجاح ومختبر تماماً!<br>النموذج المعتمد للتفريغ: <b dir="ltr" class="font-mono text-emerald-950">${best}</b>`;
      showToast('تم فحص المفتاح والتأكد من استجابة الذكاء الاصطناعي بنجاح!', 'success');
    } else {
      const errData = await pingRes.json().catch(() => ({}));
      const msg = errData.error?.message || `HTTP ${pingRes.status}`;
      statusEl.className = 'p-2.5 rounded-xl text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 block';
      statusEl.innerHTML = `⚠️ تم اختيار النموذج (${best})، تنبيه: ${escapeHtml(msg)}`;
    }
  } catch (err) {
    statusEl.className = 'p-2.5 rounded-xl text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 block';
    statusEl.textContent = '❌ خطأ في فحص المفتاح: ' + err.message;
  }
}

async function saveSettings() {
  const key = document.getElementById('setting-gemini-key').value.trim();
  await window.clinicDB.setSetting('gemini_api_key', key);
  await window.clinicDB.setSetting('gemini_working_model', null); // clear so it re-detects for this key
  window.geminiExtractor.apiKey = key;
  showToast('تم حفظ الإعدادات بنجاح', 'success');
  closeSettingsModal();
}

async function exportBackupFile() {
  const jsonStr = await window.clinicDB.exportFullBackup();
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Dr_Ghanema_Clinic_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('تم تنزيل النسخة الاحتياطية بنجاح', 'success');
}

async function importBackupFile(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    try {
      await window.clinicDB.importFullBackup(e.target.result);
      await loadPatients();
      if (state.patients.length > 0) selectPatient(state.patients[0].id);
      showToast('تم استعادة النسخة الاحتياطية بنجاح!', 'success');
      closeSettingsModal();
    } catch (err) {
      showToast('فشل استعادة الملف: ' + err.message, 'error');
    }
  };
  reader.readAsText(file);
}

// --- New Visit Manual Modal ---
function openNewVisitModal() {
  if (!state.currentPatient) return;
  document.getElementById('nv-date').value = new Date().toISOString().split('T')[0];
  document.getElementById('nv-bp').value = '';
  document.getElementById('nv-notes').value = '';
  document.getElementById('nv-exam').value = '';
  document.getElementById('nv-ttt').value = '';
  document.getElementById('nv-plan').value = '';
  document.getElementById('new-visit-modal').classList.remove('hidden');
}

function closeNewVisitModal() {
  document.getElementById('new-visit-modal').classList.add('hidden');
}

async function saveNewVisitManual() {
  if (!state.currentPatient) return;

  const visit = {
    id: 'visit_' + Date.now(),
    patientId: state.currentPatient.id,
    date: document.getElementById('nv-date').value || new Date().toISOString().split('T')[0],
    type: document.getElementById('nv-type').value || 'كشف ومتابعة',
    vitals: {
      bp: document.getElementById('nv-bp').value.trim()
    },
    history: document.getElementById('nv-notes').value.trim(),
    examNotes: document.getElementById('nv-exam').value.trim(),
    treatment: document.getElementById('nv-ttt').value.trim(),
    plan: document.getElementById('nv-plan').value.trim(),
    labs: {},
    images: []
  };

  await window.clinicDB.saveVisit(visit);
  await selectPatient(state.currentPatient.id);
  closeNewVisitModal();
  showToast('تم تسجيل الزيارة بنجاح', 'success');
}

// --- Edit Patient Modal Handling ---
function openEditPatientModal() {
  const p = state.currentPatient;
  if (!p) return;

  document.getElementById('edit-p-code').value = p.code || '';
  document.getElementById('edit-p-name').value = p.name || '';
  document.getElementById('edit-p-age').value = p.age || '';
  document.getElementById('edit-p-phone').value = p.phone || '';
  document.getElementById('edit-p-sex').value = p.sex || 'أنثى';
  document.getElementById('edit-p-address').value = p.address || '';
  document.getElementById('edit-p-diagnosis').value = p.diagnosis || '';
  document.getElementById('edit-p-occupation').value = p.occupation || '';
  document.getElementById('edit-p-marital').value = p.marital || '';
  document.getElementById('edit-p-gpl').value = p.gpl || '';
  document.getElementById('edit-p-menses').value = p.menses || '';
  document.getElementById('edit-p-smoking').value = p.smoking || '';
  document.getElementById('edit-p-allergy').value = p.allergy || '';
  document.getElementById('edit-p-operations').value = p.operations || '';
  document.getElementById('edit-p-family').value = p.familyHistory || '';
  document.getElementById('edit-p-current-ttt').value = p.currentTTT || '';
  document.getElementById('edit-p-complaint').value = p.mainComplaint || '';

  document.getElementById('edit-patient-modal').classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

async function saveEditedPatient() {
  const p = state.currentPatient;
  if (!p) return;

  p.code = document.getElementById('edit-p-code').value.trim() || p.code;
  p.name = document.getElementById('edit-p-name').value.trim() || p.name;
  p.age = document.getElementById('edit-p-age').value.trim();
  p.phone = document.getElementById('edit-p-phone').value.trim();
  p.sex = document.getElementById('edit-p-sex').value;
  p.address = document.getElementById('edit-p-address').value.trim();
  p.diagnosis = document.getElementById('edit-p-diagnosis').value.trim();
  p.occupation = document.getElementById('edit-p-occupation').value.trim();
  p.marital = document.getElementById('edit-p-marital').value.trim();
  p.gpl = document.getElementById('edit-p-gpl').value.trim();
  p.menses = document.getElementById('edit-p-menses').value.trim();
  p.smoking = document.getElementById('edit-p-smoking').value.trim();
  p.allergy = document.getElementById('edit-p-allergy').value.trim();
  p.operations = document.getElementById('edit-p-operations').value.trim();
  p.familyHistory = document.getElementById('edit-p-family').value.trim();
  p.currentTTT = document.getElementById('edit-p-current-ttt').value.trim();
  p.mainComplaint = document.getElementById('edit-p-complaint').value.trim();

  await window.clinicDB.savePatient(p);
  await loadPatients();
  await selectPatient(p.id);

  document.getElementById('edit-patient-modal').classList.add('hidden');
  showToast('تم تحديث بيانات المريض والشيت بنجاح!', 'success');
}

// --- Delete Patient / Visit Confirmation ---
async function deleteCurrentPatient() {
  if (!state.currentPatient) return;
  if (!confirm(`هل أنت متأكد من حذف ملف المريض "${state.currentPatient.name}" وكافة زياراته؟`)) return;

  await window.clinicDB.deletePatient(state.currentPatient.id);
  state.currentPatient = null;
  await loadPatients();
  if (state.patients.length > 0) {
    selectPatient(state.patients[0].id);
  } else {
    document.getElementById('patient-profile-view').classList.add('hidden');
    document.getElementById('patient-empty-view').classList.remove('hidden');
  }
  showToast('تم حذف ملف المريض بنجاح', 'info');
}

async function deleteVisitConfirm(visitId) {
  if (!confirm('هل تريد بالتأكيد حذف هذه الزيارة؟')) return;
  await window.clinicDB.deleteVisit(visitId);
  await selectPatient(state.currentPatient.id);
  showToast('تم حذف الزيارة بنجاح', 'info');
}

// --- Event Listeners Helper ---
function setupEventListeners() {
  // Drag and drop for upload zone
  const dropZone = document.getElementById('upload-dropzone');
  if (dropZone) {
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-teal-500', 'bg-teal-50/50');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-teal-500', 'bg-teal-50/50');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-teal-500', 'bg-teal-50/50');
      handleImageFiles(e.dataTransfer.files);
    });
  }
}

// --- Utilities ---
function formatDate(dateStr) {
  if (!dateStr) return '---';
  try {
    const d = new Date(dateStr);
    return isNaN(d) ? dateStr : d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = 'info') {
  const toast = document.createElement('div');
  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-rose-600 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-slate-800 text-white'
  };
  toast.className = `fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl shadow-xl font-bold text-sm flex items-center gap-2 transform transition-all duration-300 translate-y-10 opacity-0 ${colors[type] || colors.info}`;
  toast.textContent = msg;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-10', 'opacity-0');
  });

  setTimeout(() => {
    toast.classList.add('translate-y-10', 'opacity-0');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- Mobile Navigation & UX Controllers ---
function showMobileView(view) {
  const sidebar = document.getElementById('patients-sidebar-col');
  const detail = document.getElementById('patient-detail-col');
  const btnPatients = document.getElementById('nav-btn-patients');
  const btnProfile = document.getElementById('nav-btn-profile');

  if (view === 'patients') {
    if (sidebar) sidebar.className = 'block lg:col-span-4 space-y-4';
    if (detail) detail.className = 'hidden lg:block lg:col-span-8 space-y-5';

    if (btnPatients) btnPatients.className = 'flex flex-col items-center gap-1 text-teal-700 text-[11px] font-black transition-all';
    if (btnProfile) btnProfile.className = 'flex flex-col items-center gap-1 text-slate-400 hover:text-teal-700 text-[11px] font-bold transition-all';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    if (sidebar) sidebar.className = 'hidden lg:block lg:col-span-4 space-y-4';
    if (detail) detail.className = 'block lg:col-span-8 space-y-5';

    if (btnPatients) btnPatients.className = 'flex flex-col items-center gap-1 text-slate-400 hover:text-teal-700 text-[11px] font-bold transition-all';
    if (btnProfile) btnProfile.className = 'flex flex-col items-center gap-1 text-teal-700 text-[11px] font-black transition-all';

    // If no current patient selected, select first
    if (!state.currentPatient && state.patients.length > 0) {
      selectPatient(state.patients[0].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  if (window.lucide) lucide.createIcons();
}

function triggerDirectMobileCamera() {
  openUploadModal();
  startLiveCamera();
}

async function handleDirectCameraCapture(files) {
  if (!files || files.length === 0) return;
  openUploadModal();
  await handleImageFiles(files);

  // Clear file inputs so same camera/file can be triggered repeatedly
  const singleCam = document.getElementById('mobile-camera-single-input');
  if (singleCam) singleCam.value = '';
  const multiGal = document.getElementById('mobile-gallery-input');
  if (multiGal) multiGal.value = '';
  const sheetInput = document.getElementById('sheet-file-input');
  if (sheetInput) sheetInput.value = '';
}

function toggleMobileAIReviewView(mode) {
  const formCol = document.getElementById('ai-review-form-col');
  const imgCol = document.getElementById('ai-review-image-col');
  const tabForm = document.getElementById('ai-tab-btn-form');
  const tabImg = document.getElementById('ai-tab-btn-image');

  if (mode === 'form') {
    if (formCol) formCol.className = 'block lg:col-span-7 space-y-3 max-h-[60vh] overflow-y-auto pr-2';
    if (imgCol) imgCol.className = 'hidden lg:flex lg:col-span-5 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex-col h-[55vh] sm:h-[60vh]';
    if (tabForm) tabForm.className = 'flex-1 py-2 rounded-xl bg-white text-teal-800 shadow-sm text-center transition-all';
    if (tabImg) tabImg.className = 'flex-1 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-center transition-all';
  } else {
    if (formCol) formCol.className = 'hidden lg:block lg:col-span-7 space-y-3 max-h-[60vh] overflow-y-auto pr-2';
    if (imgCol) imgCol.className = 'flex lg:col-span-5 bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex-col h-[55vh] sm:h-[60vh]';
    if (tabForm) tabForm.className = 'flex-1 py-2 rounded-xl text-slate-500 hover:text-slate-800 text-center transition-all';
    if (tabImg) tabImg.className = 'flex-1 py-2 rounded-xl bg-white text-teal-800 shadow-sm text-center transition-all';
  }
  if (window.lucide) lucide.createIcons();
}

// --- Mobile Connect & QR Code Integration ---
async function fetchActiveUrls() {
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1' && !window.location.hostname.startsWith('192.168.')) {
    return;
  }
  try {
    const res = await fetch('active-urls.json?t=' + Date.now());
    if (res.ok) {
      activeServerUrls = await res.json();
    }
  } catch (e) {
    // silently ignore on production/github pages
  }
}

async function reseedSamplePatient() {
  showToast('جاري استعادة ملف المريض والشيتات...', 'info');
  if (typeof window.seedSamplePatientNow === 'function') {
    await window.seedSamplePatientNow(true);
    await loadPatients();
    if (state.patients.length > 0) {
      selectPatient(state.patients[0].id);
    }
    showToast('✅ تم استعادة بيانات المريض والشيت بنجاح ومزامنته سحابياً!', 'success');
  }
}
window.reseedSamplePatient = reseedSamplePatient;

async function openMobileConnectModal() {
  const modal = document.getElementById('mobile-connect-modal');
  if (!modal) return;

  if (!activeServerUrls) {
    await fetchActiveUrls();
  }

  const targetUrl = (activeServerUrls && activeServerUrls.tunnelUrl) 
    ? activeServerUrls.tunnelUrl 
    : ((activeServerUrls && activeServerUrls.wifiUrl) ? activeServerUrls.wifiUrl : window.location.href);

  const urlInput = document.getElementById('mobile-direct-url-input');
  if (urlInput) urlInput.value = targetUrl;

  const qrImg = document.getElementById('mobile-qr-image');
  if (qrImg) {
    qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(targetUrl)}`;
  }

  modal.classList.remove('hidden');
  if (window.lucide) lucide.createIcons();
}

function closeMobileConnectModal() {
  const modal = document.getElementById('mobile-connect-modal');
  if (modal) modal.classList.add('hidden');
}

function copyMobileUrl() {
  const urlInput = document.getElementById('mobile-direct-url-input');
  if (!urlInput) return;
  urlInput.select();
  navigator.clipboard.writeText(urlInput.value).then(() => {
    showToast('تم نسخ الرابط بنجاح! أرسله أو افتحه على الموبايل', 'success');
  }).catch(() => {
    showToast('تم تحديد الرابط، يرجى نسخه يدوياً', 'info');
  });
}

