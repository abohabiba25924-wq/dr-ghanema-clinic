/**
 * seed-data.js - Pre-populated sample patient for Dr. Mahmoud Ghanema Clinic
 * Exactly based on the real uploaded clinic sheet (Patient No. 594 - Fatima Ismail Mohamed).
 */

const SEED_PATIENT_ID = 'patient_sample_594';

async function checkAndSeedInitialData() {
  const existing = await window.clinicDB.getAllPatients();
  if (existing && existing.length > 0) {
    return; // Already initialized
  }

  // Initial Patient Data from Image 1 & 2
  const samplePatient = {
    id: SEED_PATIENT_ID,
    code: '594',
    name: 'فاطمة إسماعيل محمد',
    age: '36',
    sex: 'أنثى',
    phone: '0122167724',
    address: 'أخر فيصل - شارع التيسير - كفر غطاطي - الهرم',
    diagnosis: 'التهاب المفاصل الروماتويدي (Rheumatoid Arthritis - Relapse)',
    dob: '1990-05-12',
    marital: 'متزوجة',
    children: '1 (ولد 6 سنوات)',
    occupation: 'ربة منزل (H.W.)',
    smoking: 'لا تدخن (Negative)',
    gpl: 'G1 P1 L1 (حمل 1 - ولادة 1 - طفل 1)',
    menses: 'منتظمة (Regular)',
    contraception: 'لا يوجد',
    allergy: 'لا يوجد تحسس دوائي (Negative)',
    operations: 'C.S. x 1 (ولادة قيصرية) - كسر بالساق اليسرى Lower leg lt fracture - جراحة غضروف قطني Lumbar disc operation',
    familyHistory: 'الأم مصابة بالروماتويد RA وقصور الغدة الدرقية Hypothyroidism',
    currentTTT: 'Steroid 5mg (كورتيزون 5 مجم)',
    mainComplaint: `• بداية المرض منذ 18 سنة (18 yr ago): تشخيص روماتويد RA وكان مستقراً على ميثوتريكسات MTX.
• أوقفت العلاج 4 سنوات لاستقرار الحالة، ثم حدثت انتكاسة بعد الولادة (Post delivery -> relapse).
• أعيد وصف MTX لكن لم تستمر عليه بانتظام.
• جفاف بالعين والفم والجلد (Eye dryness, Mouth dryness, Skin dryness).
• تيبس صباحي بالمفاصل يستمر حوالي 10 دقائق (Morning stiffness ~ 10 min).
• تساقط بالشعر (Alopecia)، حساسية للضوء (Photosensitivity)، تقرحات بالفم (Oral ulcers)، فقدان بعض الأسنان (Loss of teeth).
• ظاهرة رينود بالأطراف (Raynaud's).
• تقلصات عضلية وتشنج بالساقين (Muscle cramps, Carpopedal spasm legs).
• أرق وآلام بالجسم ونقص استمتاع (Insomnia, Allodynia, Anhedonia).
• فحص هشاشة العظام (25/8/26 DXA): L4 فقرات قطنية -2.7 (T-Score هشاشة).`,
    createdAt: '2026-09-14T10:00:00.000Z',
    updatedAt: '2026-09-14T10:00:00.000Z'
  };

  // Visit 1 (Initial Visit)
  const visit1 = {
    id: 'visit_sample_594_1',
    patientId: SEED_PATIENT_ID,
    date: '2026-09-14',
    type: 'كشف أول (Initial Evaluation)',
    vitals: {
      weight: '68',
      height: '162',
      pulse: '78',
      temp: '37.0',
      bp: '170/100'
    },
    history: 'متابعة انتكاسة روماتويد بعد الولادة مع أعراض جفاف وتيبس صباحي وتشنجات ساقين.',
    examNotes: 'حقن Adrenocortin injection منذ يومين. لا يوجد التهاب مفاصل حاد نشط حالياً (No arthritis). خشونة واحتكاك بالركبتين (Bilat knee crepitus). محدودية حركة وثني بالرسغ الأيسر (Lt wrist => No flexion).',
    jointStates: {
      wrist_l: 'tender',
      knee_r: 'tender',
      knee_l: 'tender'
    },
    labs: {
      date: '2026-09-07',
      alt: '107/31 (مرتفع)',
      ast: '74/34 (مرتفع)',
      creatinine: '0.83',
      uric_acid: '7.3 (مرتفع)',
      ldl: 'INR 1',
      hbsag: 'سلبي (Negative)',
      hcv: 'سلبي (Negative)',
      hiv: 'سلبي (Negative)',
      esr: '45',
      crp: '18',
      hb: '11.8',
      plt: '280,000'
    },
    treatment: `1. Vit E 400 mg (كبسولة مرة واحدة يومياً 1x1)
2. Essential Forte (كبسولة مرة واحدة يومياً 1x1)
3. مراجعة علاج الضغط (BP: 170/100)
4. إعادة تقييم جرعة الكورتيزون وخطة تثبيط المناعة (DMARDs) بعد هدوء إنزيمات الكبد`,
    plan: 'إعادة وظائف الكبد ALT/AST خلال أسبوعين، فحص قاع العين، وعمل تحليل فيتامين D والكالسيوم بالدم.',
    images: [
      'assets/sample_sheet_page1.png',
      'assets/sample_sheet_page2.png'
    ],
    createdAt: '2026-09-14T10:30:00.000Z'
  };

  await window.clinicDB.savePatient(samplePatient);
  await window.clinicDB.saveVisit(visit1);
  console.log('Sample clinic patient seeded successfully.');
}

window.checkAndSeedInitialData = checkAndSeedInitialData;
