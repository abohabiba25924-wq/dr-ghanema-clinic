/**
 * gemini.js - Vision AI Extraction Engine for Dr. Mahmoud Ghanema Clinic
 * Auto-detects models via ListModels and supports both v1 and v1beta with full diagnostic reporting.
 */

class GeminiMedicalExtractor {
  constructor() {
    this.apiKey = null;
    this.activeModel = null;
    this.activeApiVersion = 'v1beta';
    this.fallbackModels = [
      'gemini-3.6-flash',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-3.1-pro-preview',
      'gemini-1.5-pro',
      'gemini-2.0-flash-lite',
      'gemini-1.5-flash-8b'
    ];
  }

  async getApiKey() {
    if (this.apiKey) return this.apiKey;
    this.apiKey = await window.clinicDB.getSetting('gemini_api_key', '');
    return this.apiKey;
  }

  setApiKey(key) {
    this.apiKey = key.trim();
    this.activeModel = null;
    return window.clinicDB.setSetting('gemini_api_key', this.apiKey);
  }

  /**
   * Filters out non-vision, audio, TTS, and discontinued models,
   * then ranks remaining models according to Google's multimodal speed & quality recommendations.
   */
  filterAndRankModels(rawList) {
    if (!Array.isArray(rawList)) return [...this.fallbackModels];

    const names = rawList.map(m => {
      const str = (typeof m === 'string') ? m : (m.name || '');
      return str.replace(/^models\//, '');
    });

    // 1. Exclude non-multimodal, text-to-speech, embedding, or discontinued models
    const filtered = names.filter(name => {
      const n = name.toLowerCase();
      // Drop audio, speech, embeddings, imagen, aqa, and text-only gemma
      if (n.includes('tts') || n.includes('embedding') || n.includes('imagen') || 
          n.includes('aqa') || n.includes('audio') || n.includes('gemma')) {
        return false;
      }
      // Drop discontinued models that Google stopped serving to new users
      if (n === 'gemini-2.5-flash' || n === 'gemini-2.5-pro') {
        return false;
      }
      return true;
    });

    // 2. Rank models according to Google's vision performance hierarchy
    const getScore = (n) => {
      const lower = n.toLowerCase();
      if (lower.includes('3.6-flash')) return 100;
      if (lower.includes('2.0-flash') && !lower.includes('lite')) return 95;
      if (lower.includes('1.5-flash') && !lower.includes('8b')) return 90;
      if (lower.includes('3.1-pro')) return 85;
      if (lower.includes('1.5-pro')) return 80;
      if (lower.includes('2.0-flash-lite')) return 75;
      if (lower.includes('1.5-flash-8b')) return 70;
      if (lower.includes('flash')) return 60;
      if (lower.includes('pro')) return 50;
      return 10;
    };

    filtered.sort((a, b) => getScore(b) - getScore(a));

    // 3. Ensure top standard models are always present in the pool
    const deduplicated = [];
    
    // Put current activeModel first if valid
    if (this.activeModel && !this.activeModel.includes('tts') && 
        this.activeModel !== 'gemini-2.5-flash' && this.activeModel !== 'gemini-2.5-pro') {
      deduplicated.push(this.activeModel);
    }

    for (const item of [...filtered, ...this.fallbackModels]) {
      if (!deduplicated.includes(item)) {
        deduplicated.push(item);
      }
    }

    // Limit to top 5 candidates to guarantee blazing-fast response without slow sequential loops
    return deduplicated.slice(0, 5);
  }

  /**
   * Queries Google Gemini ListModels API to get all available models for this key
   */
  async listSupportedModels(key) {
    let lastApiError = null;
    const endpoints = [
      { ver: 'v1beta', url: `https://generativelanguage.googleapis.com/v1beta/models?key=${key}` },
      { ver: 'v1', url: `https://generativelanguage.googleapis.com/v1/models?key=${key}` }
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep.url);
        const data = await res.json().catch(() => null);

        if (res.ok && data && data.models && Array.isArray(data.models)) {
          const supported = data.models.filter(m => 
            m.supportedGenerationMethods && 
            m.supportedGenerationMethods.includes('generateContent')
          );
          if (supported.length > 0) {
            this.activeApiVersion = ep.ver;
            return this.filterAndRankModels(supported);
          }
        } else if (data && data.error) {
          lastApiError = data.error.message || `HTTP ${res.status}`;
        }
      } catch (err) {
        lastApiError = err.message;
      }
    }

    if (lastApiError) {
      console.warn('Google ListModels returned error:', lastApiError);
      // If it's an explicit key/permission problem, expose it clearly
      if (lastApiError.includes('API key') || lastApiError.includes('disabled') || lastApiError.includes('PERMISSION_DENIED') || lastApiError.includes('not enabled')) {
        throw new Error(`خطأ في صلاحية مفتاح جوجل: ${lastApiError}`);
      }
    }
    return [...this.fallbackModels];
  }

  /**
   * Determine best available model for content generation
   */
  async resolveWorkingModel(key) {
    // Check cached working model (validate it's not a discontinued or TTS model)
    const saved = await window.clinicDB.getSetting('gemini_working_model', null);
    if (saved && !saved.includes('tts') && saved !== 'gemini-2.5-flash' && saved !== 'gemini-2.5-pro') {
      this.activeModel = saved;
      return saved;
    } else if (saved) {
      // Clear deprecated cached model
      await window.clinicDB.setSetting('gemini_working_model', null);
    }

    // Query ListModels and filter/rank models
    const models = await this.listSupportedModels(key);
    const ranked = this.filterAndRankModels(models);

    const best = ranked[0] || 'gemini-3.6-flash';
    this.activeModel = best;
    this.activeApiVersion = 'v1beta';
    await window.clinicDB.setSetting('gemini_working_model', best);
    return best;
  }

  /**
   * Alias for extractSheetData to support both naming conventions
   */
  async extractFromImages(images) {
    return this.extractSheetData(images);
  }

  /**
   * Extract medical data from sheet images with smart multi-version fallback (v1beta and v1)
   */
  async extractSheetData(images) {
    const key = await this.getApiKey();
    if (!key) {
      throw new Error('لم يتم إدخال مفتاح Google Gemini API. يرجى إدخال المفتاح في شاشة الإعدادات أولاً (المفتاح مجاني 100%).');
    }

    // Clear any obsolete cached model like gemini-2.5-flash
    const cachedModel = await window.clinicDB.getSetting('gemini_working_model', null);
    if (cachedModel === 'gemini-2.5-flash' || cachedModel === 'gemini-2.5-pro' || (cachedModel && cachedModel.includes('tts'))) {
      await window.clinicDB.setSetting('gemini_working_model', null);
      this.activeModel = null;
    }

    // Attempt model discovery & prioritized ranking
    let candidateList = [];
    try {
      const discovered = await this.listSupportedModels(key);
      candidateList = this.filterAndRankModels(discovered);
    } catch (discoveryErr) {
      console.warn('Discovery error:', discoveryErr);
      candidateList = [...this.fallbackModels];
    }

    if (!candidateList || candidateList.length === 0) {
      candidateList = [...this.fallbackModels];
    }

    const prompt = `
You are an expert medical transcriptionist and rheumatology consultant assisting Dr. Mahmoud Ghanema (Consultant of Rheumatology & Clinical Immunology).
Analyze the attached handwritten medical examination sheets carefully.
Decipher the doctor's handwriting, medical abbreviations, and terminology (e.g., RA, SLE, MTX, Prednisolone, ESR, CRP, DXA, ANA, Anti-CCP).

CRITICAL LANGUAGE REQUIREMENT:
- Patient Name: Keep the exact patient name in Arabic (or English if written in English) as written on the sheet.
- ALL OTHER CLINICAL & MEDICAL FIELDS (Diagnosis, Chief Complaint, HPI, Past History, Examination, Joint Exam, Lab results, Treatment/Medications, Plan): MUST BE TRANSCRIBED AND WRITTEN IN 100% MEDICAL ENGLISH ONLY. Do NOT output any Arabic words in medical fields under any circumstance. Translate any Arabic clinical notes into professional medical English terminology.

Extract all available fields and output ONLY a valid, single JSON object without markdown code blocks, backticks, or extra text.

The JSON schema must be strictly:
{
  "code": "Patient File Number or Code from sheet, e.g., 594",
  "name": "Patient Full Name in Arabic (or English if written on sheet)",
  "age": "Age as string or number",
  "date": "Visit date written on sheet, e.g. Sep 14, 2026",
  "phone": "Phone number",
  "address": "Address",
  "diagnosis": "100% English medical diagnosis, e.g. Rheumatoid Arthritis (RA) - active flare",
  "sex": "Female or Male",
  "dob": "Date of birth if present",
  "marital": "Married / Single / Divorced / Widow",
  "children": "Children info in English, e.g. 1 son, 6 yrs",
  "occupation": "Occupation in English, e.g. Housewife, Teacher, etc.",
  "smoking": "Non-smoker / Smoker / Ex-smoker",
  "gpl": "Obstetric history in English (Gravida, Para, Living, e.g. G1 P1 L1)",
  "menses": "Menstrual history in English (Regular / Irregular / Menopause)",
  "contraception": "Contraceptive method if noted in English",
  "allergy": "Drug or food allergies in English (or None)",
  "operations": "Past surgical operations in English, e.g. C-Section x 1, Appendectomy",
  "familyHistory": "Family history in English, e.g. Mother has RA, Hypothyroidism",
  "currentTTT": "Current medications before this visit in English, e.g. Prednisolone 5mg daily",
  "mainComplaint": "100% English detailed transcript of the Main Complaint and symptoms (e.g. Morning stiffness > 1 hour, bilateral hand joint pain, fatigue)",
  "vitals": {
    "weight": "Weight in kg if written",
    "height": "Height in cm if written",
    "pulse": "Pulse rate (bpm)",
    "temp": "Temperature in °C",
    "bp": "Blood pressure, e.g. 120/80"
  },
  "examNotes": "100% English physical examination and joint findings (e.g. Bilateral knee joint crepitus, left wrist synovitis and restricted flexion)",
  "jointAffected": ["array of affected joint keys if mentioned, e.g. wrist_l, knee_r, knee_l, shoulder_r, etc."],
  "labs": {
    "date": "Lab date",
    "hb": "",
    "mcv": "",
    "plt": "",
    "tlc": "",
    "staf": "",
    "seg": "",
    "esr": "",
    "crp": "",
    "alt": "ALT value",
    "ast": "AST value",
    "creatinine": "Creatinine value",
    "ca": "",
    "ca_plus": "",
    "tc": "",
    "ldl": "",
    "hdl": "",
    "tg": "",
    "uric_acid": "",
    "tsh": "",
    "hba1c": "",
    "vit_d": "",
    "hbsag": "Negative or Positive",
    "hcv": "Negative or Positive",
    "hiv": "Negative or Positive",
    "ana": "ANA result if present",
    "rf": "RF result if present",
    "anti_ccp": "Anti-CCP result if present"
  },
  "treatment": "100% English prescribed medications and prescriptions (TTT), e.g. Methotrexate 15mg weekly, Folic Acid 5mg weekly, Prednisolone 5mg daily",
  "plan": "100% English follow-up instructions and requested investigations"
}

If any field is not present or illegible, leave it as an empty string "". Never omit keys. Output ONLY valid JSON.
`;

    const parts = [{ text: prompt }];

    for (const img of images) {
      let base64Data = img.data || '';
      let mime = img.mimeType || 'image/jpeg';

      // If img.data is a relative path or remote URL, fetch and convert to base64
      if (typeof base64Data === 'string' && !base64Data.startsWith('data:image/')) {
        try {
          const res = await fetch(base64Data);
          const blob = await res.blob();
          base64Data = await new Promise((resFn, rejFn) => {
            const reader = new FileReader();
            reader.onloadend = () => resFn(reader.result);
            reader.onerror = rejFn;
            reader.readAsDataURL(blob);
          });
        } catch (fetchErr) {
          console.warn('Could not convert image path to base64:', base64Data, fetchErr);
        }
      }

      if (typeof base64Data === 'string') {
        const match = base64Data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
        if (match) {
          mime = match[1];
          base64Data = base64Data.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, '');
        }
      }

      parts.push({
        inline_data: {
          mime_type: mime,
          data: base64Data
        }
      });
    }

    const payload = {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 2500,
        responseMimeType: "application/json"
      }
    };

    let lastError = null;
    const versionsToTry = ['v1beta', 'v1'];

    // Try each candidate model
    for (const modelName of candidateList) {
      for (const ver of versionsToTry) {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${modelName}:generateContent?key=${key}`;
        console.log(`[Gemini Request] Trying: ${ver} / ${modelName}`);

        try {
          let response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          // If 400 Bad Request, retry without responseMimeType in case model doesn't support json mode
          if (!response.ok && response.status === 400) {
            const fallbackPayload = {
              contents: [{ parts }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 2500
              }
            };
            const retryRes = await fetch(endpoint, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fallbackPayload)
            });
            if (retryRes.ok) {
              response = retryRes;
            }
          }

          if (response.ok) {
            const resJson = await response.json();
            const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              this.activeModel = modelName;
              this.activeApiVersion = ver;
              await window.clinicDB.setSetting('gemini_working_model', modelName);
              console.log(`[Gemini Success] Active Model: ${ver} / ${modelName}`);

              const cleaned = rawText.trim()
                .replace(/^```json\s*/i, '')
                .replace(/^```\s*/i, '')
                .replace(/\s*```$/, '');
              return JSON.parse(cleaned);
            }
          } else {
            const err = await response.json().catch(() => ({}));
            const errMsg = err.error?.message || `HTTP ${response.status}`;
            lastError = new Error(`[${modelName} (${ver})] ${errMsg}`);
            console.warn(`[Gemini Fail] ${modelName} (${ver}):`, errMsg);

            // If it's a hard API key error (e.g. invalid key or blocked), stop and report immediately
            if (errMsg.includes('API key not valid') || errMsg.includes('PERMISSION_DENIED')) {
              throw new Error(`مفتاح API غير صالح أو غير مصرح له: ${errMsg}`);
            }

            // If model is discontinued or not found, skip trying it on other API versions
            if (errMsg.includes('no longer available') || errMsg.includes('not found') || errMsg.includes('is not supported')) {
              break;
            }
          }
        } catch (fetchErr) {
          if (fetchErr.message && fetchErr.message.includes('مفتاح API')) {
            throw fetchErr;
          }
          lastError = fetchErr;
        }
      }
    }

    throw new Error(lastError ? lastError.message : 'فشلت كافة نماذج الذكاء الاصطناعي في الاتصال.');
  }
}

window.geminiExtractor = new GeminiMedicalExtractor();
