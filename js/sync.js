/**
 * sync.js - Realtime Cloud Sync Engine (Supabase) & PWA Installation Manager
 * Dr. Mahmoud Ghanema Clinic Management System
 */

const SUPABASE_URL = 'https://acgpywyypxbvsqytbygj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjZ3B5d3l5cHhidnNxeXRieWdqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MDA2NDIsImV4cCI6MjEwNTE3NjY0Mn0.8SldF5DmF4fvr9IXU99KP8yhdxhi2_bO9wWIh6P8Of4';

// --- Schema Transformers ---
function patientToDb(p) {
  return {
    id: p.id,
    code: p.code || '',
    name: p.name || '',
    age: p.age ? String(p.age) : '',
    phone: p.phone ? String(p.phone) : '',
    sex: p.sex || 'female',
    address: p.address || '',
    diagnosis: p.diagnosis || '',
    obs_gyn: p.obsGyn || p.obs_gyn || '',
    history_complaint: p.historyComplaint || p.history_complaint || p.mainComplaint || '',
    family_history: p.familyHistory || p.family_history || '',
    surgical_history: p.surgicalHistory || p.surgical_history || p.operations || '',
    current_meds: p.currentMeds || p.current_meds || p.currentTTT || '',
    created_at: p.createdAt || p.created_at || new Date().toISOString(),
    updated_at: p.updatedAt || p.updated_at || new Date().toISOString()
  };
}

function dbToPatient(r) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    age: r.age,
    phone: r.phone,
    sex: r.sex,
    address: r.address,
    diagnosis: r.diagnosis,
    obsGyn: r.obs_gyn,
    historyComplaint: r.history_complaint,
    familyHistory: r.family_history,
    surgicalHistory: r.surgical_history,
    currentMeds: r.current_meds,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function visitToDb(v) {
  return {
    id: v.id,
    patient_id: v.patientId || v.patient_id,
    date: v.date || new Date().toISOString().split('T')[0],
    vitals: v.vitals || {},
    history: v.history || '',
    exam: v.exam || '',
    diagnosis: v.diagnosis || '',
    ttt: v.ttt || '',
    plan: v.plan || '',
    joints: v.joints || { tender: [], swollen: [], both: [] },
    labs: v.labs || {},
    sheet_images: v.sheetImages || v.sheet_images || [],
    ai_processed: !!v.aiProcessed || !!v.ai_processed,
    raw_ai_text: v.rawAiText || v.raw_ai_text || '',
    created_at: v.createdAt || v.created_at || new Date().toISOString(),
    updated_at: v.updatedAt || v.updated_at || new Date().toISOString()
  };
}

function dbToVisit(r) {
  return {
    id: r.id,
    patientId: r.patient_id,
    date: r.date,
    vitals: r.vitals || {},
    history: r.history || '',
    exam: r.exam || '',
    diagnosis: r.diagnosis || '',
    ttt: r.ttt || '',
    plan: r.plan || '',
    joints: r.joints || { tender: [], swollen: [], both: [] },
    labs: r.labs || {},
    sheetImages: r.sheet_images || [],
    aiProcessed: !!r.ai_processed,
    rawAiText: r.raw_ai_text || '',
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

// --- Sync Engine Class ---
class ClinicSyncEngine {
  constructor() {
    this.supabase = null;
    this.isSyncing = false;
    this.channel = null;
  }

  async init() {
    if (!window.supabase) {
      console.warn('Supabase library not detected, running pure local mode.');
      return;
    }

    try {
      this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ Supabase connected for Dr. Ghanema clinic.');
      
      this.setupRealtime();

      if (navigator.onLine) {
        await this.syncAll();
      }
    } catch (e) {
      console.error('Failed to initialize Supabase sync:', e);
    }
  }

  setSyncBadge(state, text) {
    const badge = document.getElementById('cloud-sync-badge');
    const textEl = document.getElementById('cloud-sync-text');
    if (!badge || !textEl) return;

    if (state === 'syncing') {
      badge.className = 'cursor-pointer px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1.5 shadow-sm transition-all';
      badge.innerHTML = <span class="w-2 h-2 rounded-full bg-amber-500 animate-spin"></span><span id="cloud-sync-text" class="text-[11px] font-bold text-amber-800 hidden sm:inline">\</span>;
    } else if (state === 'synced') {
      badge.className = 'cursor-pointer px-2.5 py-1 bg-teal-50 border border-teal-200 rounded-full flex items-center gap-1.5 shadow-sm transition-all hover:bg-teal-100';
      badge.innerHTML = <span class="w-2 h-2 rounded-full bg-teal-500"></span><span id="cloud-sync-text" class="text-[11px] font-bold text-teal-800 hidden sm:inline">\</span>;
    } else if (state === 'error') {
      badge.className = 'cursor-pointer px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-full flex items-center gap-1.5 shadow-sm transition-all';
      badge.innerHTML = <span class="w-2 h-2 rounded-full bg-rose-500"></span><span id="cloud-sync-text" class="text-[11px] font-bold text-rose-800 hidden sm:inline">\</span>;
    }
  }

  async syncAll() {
    if (!this.supabase || !navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;
    this.setSyncBadge('syncing', 'جاري المزامنة السحابية...');

    try {
      // 1. Pull cloud patients
      const { data: cloudPatients, error: pErr } = await this.supabase
        .from('clinic_patients')
        .select('*');

      if (pErr) throw pErr;

      // 2. Fetch local patients
      const localPatients = await window.clinicDB.getAllPatients();
      const localMap = new Map(localPatients.map(p => [p.id, p]));
      const cloudMap = new Map((cloudPatients || []).map(cp => [cp.id, cp]));

      // 3. Save cloud patients into local IndexedDB
      if (cloudPatients && cloudPatients.length > 0) {
        for (const cp of cloudPatients) {
          const p = dbToPatient(cp);
          await window.clinicDB.savePatient(p, false);
        }
      }

      // 4. Two-way sync: Push any local patients NOT in cloud to Supabase (e.g. mobile RH-102!)
      for (const lp of localPatients) {
        if (!cloudMap.has(lp.id)) {
          console.log('Uploading unsynced local patient to cloud:', lp.id, lp.name);
          await this.pushPatient(lp);
        }
      }

      // 5. Pull cloud visits
      const { data: cloudVisits, error: vErr } = await this.supabase
        .from('clinic_visits')
        .select('*');

      if (vErr) throw vErr;

      // 6. Save cloud visits locally
      if (cloudVisits && cloudVisits.length > 0) {
        for (const cv of cloudVisits) {
          const v = dbToVisit(cv);
          await window.clinicDB.saveVisit(v, false);
        }
      }

      // 7. Push any unsynced local visits to cloud
      for (const lp of localPatients) {
        const localVisits = await window.clinicDB.getVisitsByPatient(lp.id);
        const cloudVisitIds = new Set((cloudVisits || []).map(cv => cv.id));
        for (const lv of localVisits) {
          if (!cloudVisitIds.has(lv.id)) {
            await this.pushVisit(lv);
          }
        }
      }

      this.setSyncBadge('synced', 'سحابي متزامن');

      // Refresh UI if available
      if (typeof window.loadPatients === 'function') {
        await window.loadPatients();
      }
      if (window.state && window.state.selectedPatient && typeof window.renderVisitsTimeline === 'function') {
        await window.renderVisitsTimeline();
        if (typeof window.renderLabsTable === 'function') await window.renderLabsTable();
      }
    } catch (err) {
      console.error('Cloud Sync failed:', err);
      this.setSyncBadge('error', 'خطأ بالمزامنة');
    } finally {
      this.isSyncing = false;
    }
  }

  async pushPatient(patient) {
    if (!this.supabase || !navigator.onLine) return;
    try {
      const payload = patientToDb(patient);
      const { error } = await this.supabase.from('clinic_patients').upsert(payload);
      if (error) throw error;
      console.log('✅ Patient synced to cloud:', patient.name);
    } catch (e) {
      console.warn('Failed to push patient to cloud:', e);
    }
  }

  async deletePatient(id) {
    if (!this.supabase || !navigator.onLine) return;
    try {
      const { error } = await this.supabase.from('clinic_patients').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete patient from cloud:', e);
    }
  }

  async pushVisit(visit) {
    if (!this.supabase || !navigator.onLine) return;
    try {
      const payload = visitToDb(visit);
      const { error } = await this.supabase.from('clinic_visits').upsert(payload);
      if (error) throw error;
      console.log('✅ Visit synced to cloud:', visit.id);
    } catch (e) {
      console.warn('Failed to push visit to cloud:', e);
    }
  }

  async deleteVisit(id) {
    if (!this.supabase || !navigator.onLine) return;
    try {
      const { error } = await this.supabase.from('clinic_visits').delete().eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Failed to delete visit from cloud:', e);
    }
  }

  setupRealtime() {
    if (!this.supabase) return;

    this.channel = this.supabase.channel('clinic-realtime-room')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_patients' }, async (payload) => {
        console.log('⚡ Realtime Event (clinic_patients):', payload.eventType);
        if (payload.eventType === 'DELETE' && payload.old) {
          await window.clinicDB.deletePatient(payload.old.id, false);
        } else if (payload.new) {
          const patient = dbToPatient(payload.new);
          await window.clinicDB.savePatient(patient, false);
        }
        if (typeof window.loadPatients === 'function') await window.loadPatients();
        if (typeof window.showToast === 'function') {
          window.showToast('🔄 تم تحديث قائمة المرضى لحظياً عبر السحابة', 'info');
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clinic_visits' }, async (payload) => {
        console.log('⚡ Realtime Event (clinic_visits):', payload.eventType);
        if (payload.eventType === 'DELETE' && payload.old) {
          await window.clinicDB.deleteVisit(payload.old.id, false);
        } else if (payload.new) {
          const visit = dbToVisit(payload.new);
          await window.clinicDB.saveVisit(visit, false);
        }
        if (window.state && window.state.selectedPatient && payload.new && window.state.selectedPatient.id === payload.new.patient_id) {
          if (typeof window.renderVisitsTimeline === 'function') await window.renderVisitsTimeline();
          if (typeof window.renderLabsTable === 'function') await window.renderLabsTable();
          if (typeof window.showToast === 'function') {
            window.showToast('⚡ تم تحديث كشوفات المريض لحظياً', 'info');
          }
        }
      })
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });
  }
}

// Global Sync Engine
window.clinicSync = new ClinicSyncEngine();

// Initialize Sync Engine on DOM Load
document.addEventListener('DOMContentLoaded', () => {
  window.clinicSync.init();
});

// --- PWA Installation & Network Management ---
let deferredInstallPrompt = null;

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

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
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
  if (typeof window.showToast === 'function') {
    window.showToast('🎉 تم تثبيت تطبيق العيادة بنجاح على جهازك!', 'success');
  }
});

async function triggerPWAInstall() {
  if (!deferredInstallPrompt) {
    if (typeof window.showToast === 'function') {
      window.showToast('على الآيفون: اضغط على زر المشاركة (Share) ثم اختر "إضافة إلى الشاشة الرئيسية"', 'info');
    }
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

function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  const indicatorEl = document.getElementById('network-status-badge');
  if (!indicatorEl) return;

  if (isOnline) {
    indicatorEl.innerHTML = 
      <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
      <span class="text-[11px] font-bold text-emerald-800 hidden sm:inline">أونلاين (متصل)</span>
    ;
    indicatorEl.className = 'px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1.5 shadow-sm';
    indicatorEl.title = 'متصل بالإنترنت - ميزة تفريغ الذكاء الاصطناعي نشطة';
  } else {
    indicatorEl.innerHTML = 
      <span class="w-2 h-2 rounded-full bg-amber-500"></span>
      <span class="text-[11px] font-bold text-amber-800 hidden sm:inline">أوفلاين (محلي)</span>
    ;
    indicatorEl.className = 'px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full flex items-center gap-1.5 shadow-sm';
    indicatorEl.title = 'يعمل محلياً بدون إنترنت - كافة السجلات محفوظة في الجهاز بأمان';
  }
}

window.addEventListener('online', () => {
  updateNetworkStatus();
  if (window.clinicSync) window.clinicSync.syncAll();
  if (typeof window.showToast === 'function') {
    window.showToast('🟢 تم استعادة الاتصال بالإنترنت وجاري المزامنة السحابية!', 'success');
  }
});

window.addEventListener('offline', () => {
  updateNetworkStatus();
  if (window.clinicSync) window.clinicSync.setSyncBadge('error', 'وضع الأوفلاين');
  if (typeof window.showToast === 'function') {
    window.showToast('🟡 انقطع الاتصال بالإنترنت. النظام مستمر بالعمل محلياً بأمان (أوفلاين).', 'warning');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  updateNetworkStatus();
});
