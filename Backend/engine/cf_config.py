"""
CardKnowlogy Expert System — Certainty Factor Configuration

All CF values are STATIC and predefined. The system does NOT calculate thresholds
or accept numeric values. All inputs are preprocessed into boolean form before
being fed into the expert system.
"""

# ─── Clinical Symptoms ─────────────────────────────────────────────────────────
SYMPTOM_CF = {
    "shortness_of_breath": 0.80,
    "orthopnea":           0.85,
    "edema":               0.75,
    "chest_pain":          0.90,
    "cough":               0.60,
    "low_activity":        0.55,
    "palpitations":        0.65,
    "dizziness":           0.60,
    "syncope":             0.95,
    "chest_tightness":     0.75,
}

# ─── Vital Signs (Boolean Thresholds) ──────────────────────────────────────────
VITAL_CF = {
    "bp_gte_180":       0.95,   # Blood Pressure ≥ 180
    "bp_140_179":       0.70,   # Blood Pressure 140–179
    "bp_lt_90":         0.95,   # Blood Pressure < 90
    "hr_gt_120":        0.90,   # Heart Rate > 120
    "hr_100_120":       0.75,   # Heart Rate 100–120
    "hr_lt_50":         0.95,   # Heart Rate < 50
    "rr_gt_22":         0.80,   # Respiratory Rate > 22
    "spo2_lt_85":       0.98,   # Oxygen Saturation < 85
    "spo2_85_90":       0.90,   # Oxygen Saturation 85–90
    "spo2_90_94":       0.75,   # Oxygen Saturation 90–94
    "hemoglobin_lt_10": 0.70,   # Hemoglobin < 10
    "temp_gt_38":       0.60,   # Temperature > 38
}

# ─── Background Information ────────────────────────────────────────────────────
BACKGROUND_CF = {
    "hypertension":         0.75,
    "diabetes":             0.70,
    "heart_disease":        0.85,
    "obesity":              0.65,
    "smoking":              0.60,
    "family_history":       0.55,
    "previous_heart_attack": 0.95,
    "chronic_lung_disease":  0.70,
    "kidney_disease":       0.75,
    "dilated_cardiomyopathy": 0.80,  # For R8
    "age_gt_60":            0.70,
    "age_40_60":            0.50,   # Also used as proxy for age > 50 and age > 55
    "age_lt_40":            0.30,
}

# ─── Unified lookup (all categories merged) ────────────────────────────────────
ALL_CF = {}
ALL_CF.update(SYMPTOM_CF)
ALL_CF.update(VITAL_CF)
ALL_CF.update(BACKGROUND_CF)
