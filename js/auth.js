/**
 * auth.js - Role-Based Authentication & Access Control
 * Dr. Mahmoud Ghanema Clinic System
 */

const DEFAULT_ADMIN = {
  username: 'DR',
  password: '123'
};

const DEFAULT_MODERATOR = {
  username: 'secretary',
  password: '123',
  enabled: true
};

class ClinicAuthManager {
  constructor() {
    this.currentUser = null;
  }

  async getAdminCredentials() {
    try {
      const saved = await window.clinicDB.getSetting('auth_admin', null);
      if (saved && typeof saved === 'object' && saved.username && saved.password) {
        return saved;
      }
    } catch (e) {
      console.warn('Error fetching admin credentials:', e);
    }
    return DEFAULT_ADMIN;
  }

  async getModeratorCredentials() {
    try {
      const saved = await window.clinicDB.getSetting('auth_moderator', null);
      if (saved && typeof saved === 'object') {
        return {
          username: saved.username || DEFAULT_MODERATOR.username,
          password: saved.password || DEFAULT_MODERATOR.password,
          enabled: saved.enabled !== false
        };
      }
    } catch (e) {
      console.warn('Error fetching moderator credentials:', e);
    }
    return DEFAULT_MODERATOR;
  }

  async saveAdminCredentials(username, password) {
    const creds = {
      username: username.trim(),
      password: password.trim()
    };
    await window.clinicDB.setSetting('auth_admin', creds);
    if (window.clinicSync && window.clinicSync.supabase) {
      await window.clinicSync.supabase.from('clinic_settings').upsert({
        key: 'auth_admin',
        value: creds,
        updated_at: new Date().toISOString()
      }).catch(console.warn);
    }
    return creds;
  }

  async saveModeratorCredentials(username, password, enabled = true) {
    const creds = {
      username: username.trim(),
      password: password.trim(),
      enabled: !!enabled
    };
    await window.clinicDB.setSetting('auth_moderator', creds);
    if (window.clinicSync && window.clinicSync.supabase) {
      await window.clinicSync.supabase.from('clinic_settings').upsert({
        key: 'auth_moderator',
        value: creds,
        updated_at: new Date().toISOString()
      }).catch(console.warn);
    }
    return creds;
  }

  async init() {
    // Check if session exists in localStorage or sessionStorage
    let session = localStorage.getItem('dr_clinic_session') || sessionStorage.getItem('dr_clinic_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed && parsed.role && parsed.username) {
          this.currentUser = parsed;
          this.applyUserRoleUI();
          this.hideLoginOverlay();
          return this.currentUser;
        }
      } catch (e) {
        console.warn('Corrupt session cleared');
        localStorage.removeItem('dr_clinic_session');
        sessionStorage.removeItem('dr_clinic_session');
      }
    }

    // No session -> show login modal
    this.currentUser = null;
    this.showLoginOverlay();
    return null;
  }

  async login(username, password, remember = true) {
    const u = (username || '').trim();
    const p = (password || '').trim();

    if (!u || !p) {
      throw new Error('يرجى كتابة اسم المستخدم وكلمة المرور');
    }

    const admin = await this.getAdminCredentials();
    const mod = await this.getModeratorCredentials();

    // Check Admin (Case insensitive for username, exact match for password)
    if (u.toLowerCase() === admin.username.toLowerCase() && p === admin.password) {
      this.currentUser = {
        role: 'admin',
        username: admin.username,
        displayName: 'د. محمود غنيمة (مسؤول)'
      };
    } 
    // Check Moderator
    else if (mod.enabled && u.toLowerCase() === mod.username.toLowerCase() && p === mod.password) {
      this.currentUser = {
        role: 'moderator',
        username: mod.username,
        displayName: 'مساعد العيادة (سكرتارية)'
      };
    } else {
      throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // Save session
    const sessionStr = JSON.stringify(this.currentUser);
    if (remember) {
      localStorage.setItem('dr_clinic_session', sessionStr);
    } else {
      sessionStorage.setItem('dr_clinic_session', sessionStr);
    }

    this.applyUserRoleUI();
    this.hideLoginOverlay();

    if (window.showToast) {
      window.showToast(`مرحباً بك: ${this.currentUser.displayName}`, 'success');
    }

    // Re-render patients list and dashboard for the logged-in role
    if (typeof window.renderPatientsList === 'function') window.renderPatientsList();
    if (typeof window.renderPatientHeader === 'function') window.renderPatientHeader();
    if (typeof window.renderCurrentTab === 'function') window.renderCurrentTab();

    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('dr_clinic_session');
    sessionStorage.removeItem('dr_clinic_session');
    this.showLoginOverlay();
    if (window.showToast) {
      window.showToast('تم تسجيل الخروج بنجاح', 'info');
    }
  }

  showLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      const userInput = document.getElementById('login-username');
      if (userInput) userInput.focus();
    }
  }

  hideLoginOverlay() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
  }

  applyUserRoleUI() {
    if (!this.currentUser) return;

    const isAdmin = this.currentUser.role === 'admin';
    const isMod = this.currentUser.role === 'moderator';

    // Update Header User Badge
    const badgeEl = document.getElementById('user-role-badge');
    const badgeName = document.getElementById('user-role-name');
    if (badgeEl) badgeEl.classList.remove('hidden');
    if (badgeName) badgeName.textContent = isAdmin ? 'د. محمود غنيمة' : 'سكرتارية';

    // Settings Button: Doctor only
    const settingsBtn = document.getElementById('btn-open-settings');
    if (settingsBtn) {
      settingsBtn.classList.toggle('hidden', !isAdmin);
    }

    // Delete Patient & Delete Visit buttons: Doctor only
    document.querySelectorAll('.admin-only-action').forEach(el => {
      el.classList.toggle('hidden', !isAdmin);
    });

    // Body class for CSS role-based scoping
    document.body.classList.toggle('role-admin', isAdmin);
    document.body.classList.toggle('role-moderator', isMod);
  }

  isAdmin() {
    return this.currentUser && this.currentUser.role === 'admin';
  }

  isModerator() {
    return this.currentUser && this.currentUser.role === 'moderator';
  }
}

window.clinicAuth = new ClinicAuthManager();
