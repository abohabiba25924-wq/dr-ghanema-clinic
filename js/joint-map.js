/**
 * joint-map.js - Interactive Rheumatology Joint Homunculus Component
 * Dr. Mahmoud Ghanema Clinic
 */

const JOINTS_DEF = [
  // Head & Spine
  { id: 'tmj_r', name: 'مفصل الفك الأيمن', group: 'head', cx: 180, cy: 60, r: 8 },
  { id: 'tmj_l', name: 'مفصل الفك الأيسر', group: 'head', cx: 220, cy: 60, r: 8 },
  { id: 'cervical', name: 'الفقرات العنقية', group: 'spine', cx: 200, cy: 95, r: 9 },
  { id: 'lumbar', name: 'الفقرات القطنية', group: 'spine', cx: 200, cy: 260, r: 10 },

  // Upper Limbs - Shoulders
  { id: 'shoulder_r', name: 'الكتف الأيمن', group: 'upper', cx: 125, cy: 125, r: 14 },
  { id: 'shoulder_l', name: 'الكتف الأيسر', group: 'upper', cx: 275, cy: 125, r: 14 },

  // Elbows
  { id: 'elbow_r', name: 'الكوع الأيمن', group: 'upper', cx: 95, cy: 205, r: 12 },
  { id: 'elbow_l', name: 'الكوع الأيسر', group: 'upper', cx: 305, cy: 205, r: 12 },

  // Wrists
  { id: 'wrist_r', name: 'الرسغ الأيمن', group: 'upper', cx: 70, cy: 290, r: 11 },
  { id: 'wrist_l', name: 'الرسغ الأيسر', group: 'upper', cx: 330, cy: 290, r: 11 },

  // Hands / MCPs & PIPs
  { id: 'mcp_r', name: 'مفاصل كف اليد اليمنى (MCPs)', group: 'hands', cx: 55, cy: 335, r: 14 },
  { id: 'mcp_l', name: 'مفاصل كف اليد اليسرى (MCPs)', group: 'hands', cx: 345, cy: 335, r: 14 },
  { id: 'pip_r', name: 'عقل الأصابع اليمنى (PIPs/DIPs)', group: 'hands', cx: 45, cy: 375, r: 12 },
  { id: 'pip_l', name: 'عقل الأصابع اليسرى (PIPs/DIPs)', group: 'hands', cx: 355, cy: 375, r: 12 },

  // Lower Limbs - Hips
  { id: 'hip_r', name: 'مفصل الحوض الأيمن', group: 'lower', cx: 160, cy: 310, r: 14 },
  { id: 'hip_l', name: 'مفصل الحوض الأيسر', group: 'lower', cx: 240, cy: 310, r: 14 },

  // Knees
  { id: 'knee_r', name: 'الركبة اليمنى', group: 'lower', cx: 155, cy: 440, r: 15 },
  { id: 'knee_l', name: 'الركبة اليسرى', group: 'lower', cx: 245, cy: 440, r: 15 },

  // Ankles
  { id: 'ankle_r', name: 'الكاحل الأيمن', group: 'lower', cx: 150, cy: 550, r: 12 },
  { id: 'ankle_l', name: 'الكاحل الأيسر', group: 'lower', cx: 250, cy: 550, r: 12 },

  // Feet / MTPs
  { id: 'mtp_r', name: 'مشط وأصابع القدم اليمنى (MTPs)', group: 'feet', cx: 145, cy: 595, r: 13 },
  { id: 'mtp_l', name: 'مشط وأصابع القدم اليسرى (MTPs)', group: 'feet', cx: 255, cy: 595, r: 13 },
];

const JOINT_STATES = {
  normal: { label: 'طبيعي', color: '#94a3b8', fill: '#f1f5f9', stroke: '#64748b' },
  tender: { label: 'ألم فقط (Tender)', color: '#f59e0b', fill: '#fef3c7', stroke: '#d97706' },
  swollen: { label: 'تورم/التهاب (Swollen)', color: '#ef4444', fill: '#fee2e2', stroke: '#dc2626' },
  both: { label: 'ألم وتورم معاً', color: '#8b5cf6', fill: '#ede9fe', stroke: '#7c3aed' }
};

class JointMapComponent {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = { readonly: false, onChange: null, ...options };
    this.states = {}; // jointId -> 'normal'|'tender'|'swollen'|'both'
    this.init();
  }

  setStates(states = {}) {
    this.states = { ...states };
    this.render();
    this.updateStats();
  }

  getStates() {
    return { ...this.states };
  }

  toggleJoint(jointId) {
    if (this.options.readonly) return;
    const current = this.states[jointId] || 'normal';
    let next = 'normal';
    if (current === 'normal') next = 'tender';
    else if (current === 'tender') next = 'swollen';
    else if (current === 'swollen') next = 'both';
    else if (current === 'both') next = 'normal';

    if (next === 'normal') {
      delete this.states[jointId];
    } else {
      this.states[jointId] = next;
    }

    this.render();
    this.updateStats();
    if (typeof this.options.onChange === 'function') {
      this.options.onChange(this.states);
    }
  }

  getStats() {
    let tender = 0;
    let swollen = 0;
    for (const val of Object.values(this.states)) {
      if (val === 'tender' || val === 'both') tender++;
      if (val === 'swollen' || val === 'both') swollen++;
    }
    return { tender, swollen, totalAffected: Object.keys(this.states).length };
  }

  init() {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="flex flex-col items-center">
        <!-- Legend & Stats Header -->
        <div class="w-full flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl mb-3 text-xs">
          <div class="flex items-center gap-4">
            <span class="font-bold text-slate-700">دليل الحالات:</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-slate-300 border border-slate-400"></span> سليم</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-amber-400 border border-amber-500"></span> مؤلم (Tender)</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-rose-500 border border-rose-600"></span> متورم (Swollen)</span>
            <span class="inline-flex items-center gap-1.5"><span class="w-3 h-3 rounded-full bg-purple-500 border border-purple-600"></span> ألم وتورم</span>
          </div>
          <div class="flex items-center gap-3 font-semibold">
            <span class="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg">مؤلمة: <b id="jm-tender-count">0</b></span>
            <span class="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-lg">متورمة: <b id="jm-swollen-count">0</b></span>
          </div>
        </div>

        <!-- Interactive SVG Skeleton Map -->
        <div class="relative w-full max-w-[380px] bg-gradient-to-b from-teal-50/40 to-slate-50 border border-teal-100 rounded-2xl p-4 shadow-sm">
          <svg id="joint-svg-map" viewBox="0 0 400 640" class="w-full h-auto select-none" xmlns="http://www.w3.org/2000/svg">
            <!-- Background Skeleton Structure Outline -->
            <!-- Head -->
            <ellipse cx="200" cy="50" rx="35" ry="42" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />
            <!-- Spine -->
            <line x1="200" y1="95" x2="200" y2="300" stroke="#cbd5e1" stroke-width="6" stroke-linecap="round" />
            <!-- Clavicles -->
            <line x1="130" y1="125" x2="270" y2="125" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
            <!-- Upper Arms -->
            <line x1="125" y1="125" x2="95" y2="205" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
            <line x1="275" y1="125" x2="305" y2="205" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
            <!-- Forearms -->
            <line x1="95" y1="205" x2="70" y2="290" stroke="#cbd5e1" stroke-width="4.5" stroke-linecap="round" />
            <line x1="305" y1="205" x2="330" y2="290" stroke="#cbd5e1" stroke-width="4.5" stroke-linecap="round" />
            <!-- Hands -->
            <line x1="70" y1="290" x2="55" y2="335" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" />
            <line x1="55" y1="335" x2="45" y2="375" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
            <line x1="330" y1="290" x2="345" y2="335" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" />
            <line x1="345" y1="335" x2="355" y2="375" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
            <!-- Pelvis -->
            <path d="M 155 300 Q 200 320 245 300 L 235 325 Q 200 340 165 325 Z" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
            <!-- Thighs -->
            <line x1="160" y1="310" x2="155" y2="440" stroke="#cbd5e1" stroke-width="5.5" stroke-linecap="round" />
            <line x1="240" y1="310" x2="245" y2="440" stroke="#cbd5e1" stroke-width="5.5" stroke-linecap="round" />
            <!-- Shins -->
            <line x1="155" y1="440" x2="150" y2="550" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
            <line x1="245" y1="440" x2="250" y2="550" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" />
            <!-- Feet -->
            <line x1="150" y1="550" x2="145" y2="595" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />
            <line x1="250" y1="550" x2="255" y2="595" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" />

            <!-- Joint interactive nodes group -->
            <g id="joints-nodes-group"></g>
          </svg>

          <!-- Floating instruction hint -->
          ${!this.options.readonly ? `
            <div class="mt-2 text-center text-[11px] text-slate-500 font-medium">
              💡 اضغط على أي مفصل لتغيير حالته (طبيعي ➜ ألم ➜ تورم ➜ كلاهما)
            </div>
          ` : ''}
        </div>
      </div>
    `;

    this.render();
    this.updateStats();
  }

  render() {
    const group = this.container.querySelector('#joints-nodes-group');
    if (!group) return;

    let svgHtml = '';
    JOINTS_DEF.forEach(j => {
      const stateKey = this.states[j.id] || 'normal';
      const st = JOINT_STATES[stateKey];
      const isAffected = stateKey !== 'normal';

      svgHtml += `
        <g class="joint-node ${this.options.readonly ? 'cursor-default' : 'cursor-pointer'}" 
           data-id="${j.id}" 
           transform="translate(${j.cx}, ${j.cy})">
          
          <!-- Invisible generous touch target for mobile finger taps -->
          <circle r="22" fill="transparent" />

          <!-- Outer pulsing glow if affected -->
          ${isAffected ? `
            <circle r="${j.r + 6}" fill="${st.color}" opacity="0.25" class="animate-pulse" />
          ` : ''}
          
          <!-- Main joint circle -->
          <circle r="${j.r}" 
                  fill="${st.fill}" 
                  stroke="${st.stroke}" 
                  stroke-width="${isAffected ? 3 : 2}" 
                  class="transition-all duration-200 hover:scale-125 pointer-events-none" />
          
          <!-- Center indicator dot -->
          ${isAffected ? `
            <circle r="${Math.max(3, j.r / 3)}" fill="${st.color}" />
          ` : ''}
          
          <title>${j.name} (${st.label})</title>
        </g>
      `;
    });

    group.innerHTML = svgHtml;

    if (!this.options.readonly) {
      group.querySelectorAll('.joint-node').forEach(node => {
        node.addEventListener('click', () => {
          const id = node.getAttribute('data-id');
          this.toggleJoint(id);
        });
      });
    }
  }

  updateStats() {
    const stats = this.getStats();
    const tenderEl = this.container.querySelector('#jm-tender-count');
    const swollenEl = this.container.querySelector('#jm-swollen-count');
    if (tenderEl) tenderEl.textContent = stats.tender;
    if (swollenEl) swollenEl.textContent = stats.swollen;
  }
}

window.JointMapComponent = JointMapComponent;
