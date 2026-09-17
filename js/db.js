/**
 * db.js - IndexedDB Local-First Database Layer for Dr. Mahmoud Ghanema Clinic
 */
const DB_NAME = 'DrGhanemaClinicDB';
const DB_VERSION = 1;

class ClinicDB {
  constructor() {
    this.db = null;
  }

  async init() {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // Patients store
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
          patientStore.createIndex('code', 'code', { unique: false });
          patientStore.createIndex('name', 'name', { unique: false });
          patientStore.createIndex('phone', 'phone', { unique: false });
          patientStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Visits store
        if (!db.objectStoreNames.contains('visits')) {
          const visitStore = db.createObjectStore('visits', { keyPath: 'id' });
          visitStore.createIndex('patientId', 'patientId', { unique: false });
          visitStore.createIndex('date', 'date', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('IndexedDB error:', e);
        reject(e.target.error);
      };
    });
  }

  async getAllPatients() {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('patients', 'readonly');
      const store = tx.objectStore('patients');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async getPatient(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('patients', 'readonly');
      const store = tx.objectStore('patients');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async savePatient(patient) {
    await this.init();
    patient.updatedAt = new Date().toISOString();
    if (!patient.createdAt) patient.createdAt = patient.updatedAt;
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('patients', 'readwrite');
      const store = tx.objectStore('patients');
      const request = store.put(patient);
      request.onsuccess = () => resolve(patient);
      request.onerror = () => reject(request.error);
    });
  }

  async deletePatient(id) {
    await this.init();
    const visits = await this.getVisitsByPatient(id);
    const tx = this.db.transaction(['patients', 'visits'], 'readwrite');
    tx.objectStore('patients').delete(id);
    const visitStore = tx.objectStore('visits');
    visits.forEach(v => visitStore.delete(v.id));

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }

  async getVisitsByPatient(patientId) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('visits', 'readonly');
      const store = tx.objectStore('visits');
      const index = store.index('patientId');
      const request = index.getAll(patientId);
      request.onsuccess = () => {
        const visits = request.result || [];
        visits.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        resolve(visits);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async saveVisit(visit) {
    await this.init();
    visit.updatedAt = new Date().toISOString();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('visits', 'readwrite');
      const store = tx.objectStore('visits');
      const request = store.put(visit);
      request.onsuccess = () => resolve(visit);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteVisit(id) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('visits', 'readwrite');
      const store = tx.objectStore('visits');
      const request = store.delete(id);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key, defaultValue = null) {
    await this.init();
    return new Promise((resolve) => {
      const tx = this.db.transaction('settings', 'readonly');
      const store = tx.objectStore('settings');
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result ? request.result.value : defaultValue);
      };
      request.onerror = () => resolve(defaultValue);
    });
  }

  async setSetting(key, value) {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      const request = store.put({ key, value });
      request.onsuccess = () => resolve(value);
      request.onerror = () => reject(request.error);
    });
  }

  async searchPatients(term) {
    const patients = await this.getAllPatients();
    if (!term || !term.trim()) return patients;

    const q = term.toLowerCase().trim();
    return patients.filter(p => {
      const name = (p.name || '').toLowerCase();
      const code = String(p.code || '').toLowerCase();
      const phone = String(p.phone || '').toLowerCase();
      const diagnosis = (p.diagnosis || '').toLowerCase();
      return name.includes(q) || code.includes(q) || phone.includes(q) || diagnosis.includes(q);
    });
  }

  async exportFullBackup() {
    const patients = await this.getAllPatients();
    const visits = [];
    for (const p of patients) {
      const pVisits = await this.getVisitsByPatient(p.id);
      visits.push(...pVisits);
    }
    const apiKey = await this.getSetting('gemini_api_key', '');
    const clinicInfo = await this.getSetting('clinic_info', null);

    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      patients,
      visits,
      settings: {
        gemini_api_key: apiKey,
        clinic_info: clinicInfo
      }
    }, null, 2);
  }

  async importFullBackup(jsonString) {
    const data = JSON.parse(jsonString);
    if (!data.patients) throw new Error('Invalid backup file format');

    await this.init();
    const tx = this.db.transaction(['patients', 'visits', 'settings'], 'readwrite');
    const patientStore = tx.objectStore('patients');
    const visitStore = tx.objectStore('visits');
    const settingsStore = tx.objectStore('settings');

    for (const p of data.patients) {
      patientStore.put(p);
    }
    if (data.visits) {
      for (const v of data.visits) {
        visitStore.put(v);
      }
    }
    if (data.settings) {
      for (const [key, value] of Object.entries(data.settings)) {
        settingsStore.put({ key, value });
      }
    }

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }
}

// Global DB instance
window.clinicDB = new ClinicDB();
