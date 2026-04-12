/**
 * ============================================
 * CARDKNOWLOGY — Rule-Based Expert System Engine
 * ============================================
 * 
 * Architecture: Forward Chaining (data-driven reasoning)
 * Rules: IF–THEN production rules with clinical thresholds
 * Output: Deterministic, explainable diagnoses
 */

// ============================================
// 1. CLINICAL THRESHOLD CLASSIFIER
// ============================================

function classifyVitals(vitals) {
    const facts = {};

    // Blood Pressure (systolic)
    if (vitals.bp_systolic < 90) {
        facts.bp_status = 'low';
        facts.bp_label = 'Hypotension';
    } else if (vitals.bp_systolic >= 90 && vitals.bp_systolic <= 139) {
        facts.bp_status = 'normal';
        facts.bp_label = 'Normal';
    } else {
        facts.bp_status = 'high';
        facts.bp_label = 'Hypertension Stage';
    }

    // Heart Rate
    if (vitals.heart_rate < 60) {
        facts.hr_status = 'slow';
        facts.hr_label = 'Bradycardia';
    } else if (vitals.heart_rate >= 60 && vitals.heart_rate <= 100) {
        facts.hr_status = 'normal';
        facts.hr_label = 'Normal';
    } else {
        facts.hr_status = 'fast';
        facts.hr_label = 'Tachycardia';
    }

    // Respiratory Rate
    if (vitals.respiratory_rate < 12) {
        facts.rr_status = 'low';
        facts.rr_label = 'Bradypnea';
    } else if (vitals.respiratory_rate >= 12 && vitals.respiratory_rate <= 20) {
        facts.rr_status = 'normal';
        facts.rr_label = 'Normal';
    } else {
        facts.rr_status = 'high';
        facts.rr_label = 'Tachypnea';
    }

    // Oxygen Saturation
    if (vitals.oxygen_saturation >= 95) {
        facts.o2_status = 'normal';
        facts.o2_label = 'Normal';
    } else if (vitals.oxygen_saturation >= 90 && vitals.oxygen_saturation < 95) {
        facts.o2_status = 'low';
        facts.o2_label = 'Mild Hypoxemia';
    } else {
        facts.o2_status = 'critical';
        facts.o2_label = 'Critical Hypoxemia';
    }

    // Hemoglobin
    if (vitals.hemoglobin < 10) {
        facts.hb_status = 'critical';
        facts.hb_label = 'Severe Anemia';
    } else if (vitals.hemoglobin >= 10 && vitals.hemoglobin <= 12) {
        facts.hb_status = 'low';
        facts.hb_label = 'Mild Anemia';
    } else {
        facts.hb_status = 'normal';
        facts.hb_label = 'Normal';
    }

    return facts;
}


// ============================================
// 2. RISK FACTOR SCORING
// ============================================

function computeRiskProfile(background) {
    const riskFactors = [];
    let riskScore = 0;

    if (background.hypertension) { riskFactors.push('Hypertension'); riskScore += 2; }
    if (background.diabetes) { riskFactors.push('Diabetes'); riskScore += 2; }
    if (background.heart_disease) { riskFactors.push('Prior Heart Disease'); riskScore += 3; }
    if (background.obesity) { riskFactors.push('Obesity'); riskScore += 1; }
    if (background.smoking) { riskFactors.push('Smoking'); riskScore += 2; }
    if (background.family_history) { riskFactors.push('Family History'); riskScore += 1; }
    if (background.age >= 65) { riskFactors.push('Age ≥ 65'); riskScore += 2; }
    else if (background.age >= 50) { riskFactors.push('Age ≥ 50'); riskScore += 1; }

    return { riskFactors, riskScore };
}


// ============================================
// 3. URGENCY LEVELS  
// ============================================

const URGENCY = {
    CRITICAL: { level: 4, label: 'CRITICAL', color: 'critical', action: 'Go to the emergency room immediately' },
    HIGH:     { level: 3, label: 'HIGH',     color: 'high',     action: 'See a doctor today' },
    MODERATE: { level: 2, label: 'MODERATE', color: 'moderate', action: 'Visit a doctor within a few days' },
    LOW:      { level: 1, label: 'LOW',      color: 'low',      action: 'Routine follow-up recommended' }
};


// ============================================
// 4. PRODUCTION RULES (IF–THEN)
// ============================================

const RULES = [

    // ── CRITICAL RULES ──────────────────────────

    {
        id: 'R01',
        name: 'Acute Myocardial Infarction',
        condition: (s, v, b, f) =>
            s.chest_pain && f.hr_status === 'fast',
        result: {
            condition: 'Acute Myocardial Infarction (Heart Attack)',
            urgency: URGENCY.CRITICAL
        },
        explain: (s, v, b, f) =>
            `Chest pain combined with tachycardia (heart rate ${v.heart_rate} bpm > 100) strongly indicates a possible acute myocardial infarction. Immediate emergency intervention is required.`
    },

    {
        id: 'R02',
        name: 'Acute Heart Failure with Critical Hypoxemia',
        condition: (s, v, b, f) =>
            s.shortness_of_breath && f.o2_status === 'critical',
        result: {
            condition: 'Acute Decompensated Heart Failure',
            urgency: URGENCY.CRITICAL
        },
        explain: (s, v, b, f) =>
            `Shortness of breath with critically low oxygen saturation (${v.oxygen_saturation}% < 90%) indicates acute decompensated heart failure with severe respiratory compromise. Immediate oxygenation and emergency care required.`
    },

    {
        id: 'R03',
        name: 'Cardiogenic Shock',
        condition: (s, v, b, f) =>
            f.bp_status === 'low' && f.hr_status === 'fast' && s.shortness_of_breath,
        result: {
            condition: 'Suspected Cardiogenic Shock',
            urgency: URGENCY.CRITICAL
        },
        explain: (s, v, b, f) =>
            `Hypotension (BP ${v.bp_systolic} mmHg < 90) with tachycardia (HR ${v.heart_rate} bpm) and dyspnea suggests cardiogenic shock — the heart is failing to pump adequately. This is a life-threatening emergency.`
    },

    {
        id: 'R04',
        name: 'Severe Anemia with Cardiac Symptoms',
        condition: (s, v, b, f) =>
            f.hb_status === 'critical' && (s.shortness_of_breath || s.fatigue) && f.hr_status === 'fast',
        result: {
            condition: 'Severe Anemia with Cardiac Compensation',
            urgency: URGENCY.CRITICAL
        },
        explain: (s, v, b, f) =>
            `Critically low hemoglobin (${v.hemoglobin} g/dL < 10) with ${s.shortness_of_breath ? 'shortness of breath' : 'fatigue'} and compensatory tachycardia (HR ${v.heart_rate} bpm). The heart is overworking to compensate for inadequate oxygen-carrying capacity. Urgent transfusion may be needed.`
    },

    // ── HIGH URGENCY RULES ──────────────────────

    {
        id: 'R05',
        name: 'Chronic Heart Failure Exacerbation',
        condition: (s, v, b, f) =>
            s.shortness_of_breath && s.edema && b.hypertension,
        result: {
            condition: 'Chronic Heart Failure (Exacerbation)',
            urgency: URGENCY.HIGH
        },
        explain: (s, v, b, f) =>
            `The combination of shortness of breath, peripheral edema (fluid retention), and a history of hypertension is a classic presentation of chronic heart failure exacerbation. Fluid overload is likely, requiring urgent diuretic therapy and clinical evaluation.`
    },

    {
        id: 'R06',
        name: 'Congestive Heart Failure',
        condition: (s, v, b, f) =>
            s.shortness_of_breath && s.edema && s.fatigue && s.cough,
        result: {
            condition: 'Congestive Heart Failure',
            urgency: URGENCY.HIGH
        },
        explain: (s, v, b, f) =>
            `Four concurrent symptoms — shortness of breath, edema, fatigue, and cough — are hallmark signs of congestive heart failure. Pulmonary congestion and systemic fluid overload require prompt medical management.`
    },

    {
        id: 'R07',
        name: 'Hypertensive Crisis',
        condition: (s, v, b, f) =>
            f.bp_status === 'high' && v.bp_systolic >= 180 && (s.chest_pain || s.shortness_of_breath),
        result: {
            condition: 'Hypertensive Emergency',
            urgency: URGENCY.HIGH
        },
        explain: (s, v, b, f) =>
            `Severely elevated blood pressure (${v.bp_systolic} mmHg ≥ 180) with ${s.chest_pain ? 'chest pain' : 'shortness of breath'} constitutes a hypertensive emergency with risk of end-organ damage. Immediate blood pressure management required.`
    },

    {
        id: 'R08',
        name: 'Pulmonary Edema',
        condition: (s, v, b, f) =>
            s.shortness_of_breath && s.cough && f.o2_status === 'low' && f.rr_status === 'high',
        result: {
            condition: 'Suspected Pulmonary Edema',
            urgency: URGENCY.HIGH
        },
        explain: (s, v, b, f) =>
            `Shortness of breath and cough with reduced oxygen saturation (${v.oxygen_saturation}%) and elevated respiratory rate (${v.respiratory_rate}/min) suggest pulmonary edema — fluid accumulation in the lungs. Often secondary to heart failure.`
    },

    {
        id: 'R09',
        name: 'Unstable Angina',
        condition: (s, v, b, f) =>
            s.chest_pain && b.heart_disease && (s.shortness_of_breath || s.fatigue),
        result: {
            condition: 'Unstable Angina',
            urgency: URGENCY.HIGH
        },
        explain: (s, v, b, f) =>
            `Chest pain in a patient with prior heart disease history, accompanied by ${s.shortness_of_breath ? 'shortness of breath' : 'fatigue'}, suggests unstable angina. This could progress to myocardial infarction without prompt intervention.`
    },

    {
        id: 'R10',
        name: 'Right Heart Failure',
        condition: (s, v, b, f) =>
            s.edema && s.fatigue && f.hr_status === 'fast' && f.bp_status !== 'high',
        result: {
            condition: 'Suspected Right-Sided Heart Failure',
            urgency: URGENCY.HIGH
        },
        explain: (s, v, b, f) =>
            `Peripheral edema with fatigue and tachycardia (HR ${v.heart_rate} bpm) without hypertension suggests the right ventricle is failing to adequately pump blood to the lungs, causing fluid backup in the extremities.`
    },

    // ── MODERATE URGENCY RULES ──────────────────

    {
        id: 'R11',
        name: 'Compensated Heart Failure',
        condition: (s, v, b, f) =>
            s.shortness_of_breath && s.fatigue && b.hypertension && !s.chest_pain,
        result: {
            condition: 'Compensated Heart Failure',
            urgency: URGENCY.MODERATE
        },
        explain: (s, v, b, f) =>
            `Shortness of breath and fatigue in a hypertensive patient, without acute chest pain, suggests compensated heart failure. The heart is working harder to maintain output. Medical optimization of heart failure medications is recommended.`
    },

    {
        id: 'R12',
        name: 'Exercise Intolerance with Risk Factors',
        condition: (s, v, b, f) =>
            s.low_activity && s.fatigue && (b.obesity || b.diabetes),
        result: {
            condition: 'Exercise Intolerance — Cardiac Risk',
            urgency: URGENCY.MODERATE
        },
        explain: (s, v, b, f) =>
            `Reduced exercise tolerance with persistent fatigue in a patient with ${b.obesity ? 'obesity' : ''}${b.obesity && b.diabetes ? ' and ' : ''}${b.diabetes ? 'diabetes' : ''} raises concern for subclinical cardiac dysfunction. Cardiac stress testing recommended.`
    },

    {
        id: 'R13',
        name: 'Mild Hypoxemia with Respiratory Symptoms',
        condition: (s, v, b, f) =>
            f.o2_status === 'low' && s.cough && !s.chest_pain,
        result: {
            condition: 'Respiratory Compromise (Mild Hypoxemia)',
            urgency: URGENCY.MODERATE
        },
        explain: (s, v, b, f) =>
            `Oxygen saturation of ${v.oxygen_saturation}% (between 90–94%) with a persistent cough, without chest pain, may indicate a pulmonary origin (e.g., COPD exacerbation or early pneumonia). Rule out cardiac causes with further workup.`
    },

    {
        id: 'R14',
        name: 'Hypertension with Multiple Risk Factors',
        condition: (s, v, b, f) =>
            f.bp_status === 'high' && (b.smoking || b.diabetes) && b.age >= 50,
        result: {
            condition: 'Hypertensive Cardiovascular Risk',
            urgency: URGENCY.MODERATE
        },
        explain: (s, v, b, f) =>
            `Elevated blood pressure (${v.bp_systolic} mmHg) in a patient aged ${b.age} with ${b.smoking ? 'smoking history' : ''}${b.smoking && b.diabetes ? ' and ' : ''}${b.diabetes ? 'diabetes' : ''} places them at significantly elevated cardiovascular risk. Medication adjustment and lifestyle changes recommended.`
    },

    {
        id: 'R15',
        name: 'Anemia with Fatigue',
        condition: (s, v, b, f) =>
            f.hb_status === 'low' && s.fatigue,
        result: {
            condition: 'Symptomatic Anemia',
            urgency: URGENCY.MODERATE
        },
        explain: (s, v, b, f) =>
            `Hemoglobin of ${v.hemoglobin} g/dL (10–12 range, mild anemia) with symptomatic fatigue. Anemia reduces oxygen delivery and can exacerbate cardiac conditions. Iron studies and further evaluation recommended.`
    },

    {
        id: 'R16',
        name: 'Bradycardia with Symptoms',
        condition: (s, v, b, f) =>
            f.hr_status === 'slow' && (s.fatigue || s.shortness_of_breath || s.low_activity),
        result: {
            condition: 'Symptomatic Bradycardia',
            urgency: URGENCY.MODERATE
        },
        explain: (s, v, b, f) =>
            `Heart rate of ${v.heart_rate} bpm (< 60) with ${s.fatigue ? 'fatigue' : s.shortness_of_breath ? 'shortness of breath' : 'reduced activity tolerance'}. Symptomatic bradycardia may indicate conduction system disease. ECG and Holter monitoring recommended.`
    },

    // ── LOW URGENCY RULES ───────────────────────

    {
        id: 'R17',
        name: 'Mild Edema — Monitoring',
        condition: (s, v, b, f) =>
            s.edema && !s.shortness_of_breath && !s.chest_pain && f.hr_status === 'normal',
        result: {
            condition: 'Peripheral Edema — Non-Cardiac Origin Likely',
            urgency: URGENCY.LOW
        },
        explain: (s, v, b, f) =>
            `Isolated peripheral edema without shortness of breath, chest pain, or heart rate abnormalities. This may be due to non-cardiac causes (e.g., venous insufficiency, medication side effects). Recommend monitoring and routine follow-up.`
    },

    {
        id: 'R18',
        name: 'Single Symptom with Risk Factor',
        condition: (s, v, b, f) => {
            const symptomCount = [s.shortness_of_breath, s.chest_pain, s.edema, s.fatigue, s.cough, s.low_activity].filter(Boolean).length;
            return symptomCount === 1 && (b.smoking || b.family_history) && f.hr_status === 'normal' && f.o2_status === 'normal';
        },
        result: {
            condition: 'Minor Cardiac Risk — Lifestyle Factors',
            urgency: URGENCY.LOW
        },
        explain: (s, v, b, f) =>
            `A single reported symptom with background risk factors (${b.smoking ? 'smoking' : ''}${b.family_history ? 'family history of cardiac disease' : ''}) but otherwise normal vitals. Recommend lifestyle modifications, smoking cessation if applicable, and routine cardiac screening.`
    },

    {
        id: 'R19',
        name: 'Asymptomatic Hypertension',
        condition: (s, v, b, f) => {
            const symptomCount = [s.shortness_of_breath, s.chest_pain, s.edema, s.fatigue, s.cough, s.low_activity].filter(Boolean).length;
            return f.bp_status === 'high' && symptomCount === 0;
        },
        result: {
            condition: 'Asymptomatic Hypertension',
            urgency: URGENCY.LOW
        },
        explain: (s, v, b, f) =>
            `Elevated blood pressure (${v.bp_systolic} mmHg ≥ 140) without any reported symptoms. While not immediately dangerous, long-term uncontrolled hypertension significantly increases risk of heart failure, stroke, and kidney disease. Routine follow-up with blood pressure management recommended.`
    },

    {
        id: 'R20',
        name: 'Isolated Fatigue with Normal Vitals',
        condition: (s, v, b, f) => {
            const symptomCount = [s.shortness_of_breath, s.chest_pain, s.edema, s.fatigue, s.cough, s.low_activity].filter(Boolean).length;
            return s.fatigue && symptomCount <= 2 && f.hr_status === 'normal' && f.o2_status === 'normal' && f.bp_status === 'normal';
        },
        result: {
            condition: 'Non-Specific Fatigue',
            urgency: URGENCY.LOW
        },
        explain: (s, v, b, f) =>
            `Fatigue reported with otherwise normal vitals does not currently suggest an acute cardiac cause. Consider non-cardiac etiologies (e.g., sleep quality, thyroid function, mental health). A routine check-up is recommended.`
    }
];


// ============================================
// 5. FORWARD CHAINING ENGINE
// ============================================

function runExpertSystem(patientData) {
    const { symptoms, vitals, background } = patientData;

    // ── Step 1: Classify raw vitals into clinical facts ──
    const vitalFacts = classifyVitals(vitals);

    // ── Step 2: Compute risk profile ──
    const { riskFactors, riskScore } = computeRiskProfile(background);

    // ── Step 3: Apply all rules (forward chaining) ──
    const firedRules = [];

    for (const rule of RULES) {
        try {
            if (rule.condition(symptoms, vitals, background, vitalFacts)) {
                firedRules.push({
                    id: rule.id,
                    condition: rule.result.condition,
                    urgency: rule.result.urgency,
                    explanation: rule.explain(symptoms, vitals, background, vitalFacts)
                });
            }
        } catch (e) {
            // Rule evaluation error — skip silently
        }
    }

    // ── Step 4: Determine overall result ──
    if (firedRules.length === 0) {
        // No rules fired — produce a baseline assessment
        return buildBaselineResult(symptoms, vitals, background, vitalFacts, riskFactors, riskScore);
    }

    // Sort by urgency level descending (highest priority first)
    firedRules.sort((a, b) => b.urgency.level - a.urgency.level);

    // Deduplicate conditions (keep highest urgency per unique condition)
    const seen = new Set();
    const uniqueResults = firedRules.filter(r => {
        if (seen.has(r.condition)) return false;
        seen.add(r.condition);
        return true;
    });

    const primary = uniqueResults[0];
    const additional = uniqueResults.slice(1);

    // ── Step 5: Build the clinical summary ──
    const vitalsSummary = buildVitalsSummary(vitals, vitalFacts);

    // Map urgency level to severity score (0-3) for 3D heart visualization
    const severityMap = { 1: 0, 2: 1, 3: 2, 4: 3 };

    return {
        primaryCondition: primary.condition,
        urgency: primary.urgency,
        suggestedAction: primary.urgency.action,
        explanation: primary.explanation,
        severityScore: severityMap[primary.urgency.level] ?? 0,
        additionalConditions: additional.map(r => ({
            condition: r.condition,
            urgency: r.urgency,
            explanation: r.explanation
        })),
        vitalsSummary,
        riskFactors,
        riskScore,
        rulesEvaluated: RULES.length,
        rulesFired: firedRules.length,
        firedRuleIds: firedRules.map(r => r.id)
    };
}


// ============================================
// 6. BASELINE (NO RULES FIRED)
// ============================================

function buildBaselineResult(symptoms, vitals, background, vitalFacts, riskFactors, riskScore) {
    const symptomCount = [
        symptoms.shortness_of_breath, symptoms.chest_pain, symptoms.edema,
        symptoms.fatigue, symptoms.cough, symptoms.low_activity
    ].filter(Boolean).length;

    const vitalsSummary = buildVitalsSummary(vitals, vitalFacts);

    let explanation = 'No clinical rules were triggered based on the provided data. ';

    if (symptomCount === 0) {
        explanation += 'No symptoms were reported. ';
    } else {
        explanation += `${symptomCount} symptom(s) reported but without matching vital sign abnormalities to indicate a specific cardiac condition. `;
    }

    if (riskScore > 0) {
        explanation += `Background risk factors present (${riskFactors.join(', ')}), which warrant ongoing monitoring. `;
    }

    explanation += 'All vital signs appear within acceptable clinical ranges for this assessment. Continue standard health monitoring and attend routine check-ups.';

    return {
        primaryCondition: 'No Acute Cardiac Condition Detected',
        urgency: URGENCY.LOW,
        suggestedAction: URGENCY.LOW.action,
        explanation,
        severityScore: 0,
        additionalConditions: [],
        vitalsSummary,
        riskFactors,
        riskScore,
        rulesEvaluated: RULES.length,
        rulesFired: 0,
        firedRuleIds: []
    };
}


// ============================================
// 7. VITALS SUMMARY BUILDER
// ============================================

function buildVitalsSummary(vitals, facts) {
    return [
        { name: 'Blood Pressure',     value: `${vitals.bp_systolic} mmHg (systolic)`, status: facts.bp_status, label: facts.bp_label },
        { name: 'Heart Rate',          value: `${vitals.heart_rate} bpm`,              status: facts.hr_status === 'fast' || facts.hr_status === 'slow' ? (facts.hr_status === 'fast' ? 'high' : 'low') : 'normal', label: facts.hr_label },
        { name: 'Respiratory Rate',    value: `${vitals.respiratory_rate}/min`,         status: facts.rr_status, label: facts.rr_label },
        { name: 'Oxygen Saturation',   value: `${vitals.oxygen_saturation}%`,           status: facts.o2_status === 'critical' ? 'critical' : facts.o2_status, label: facts.o2_label },
        { name: 'Hemoglobin',          value: `${vitals.hemoglobin} g/dL`,              status: facts.hb_status === 'critical' ? 'critical' : facts.hb_status, label: facts.hb_label }
    ];
}
