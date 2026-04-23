"""
CardKnowlogy — Engine Runner / Orchestrator

Receives boolean inputs, declares facts in the engine's working memory,
runs forward chaining, and collects results.

This is the bridge between the REST API and the Experta engine.
"""

from .facts import Symptom, Vital, Background
from .cf_config import SYMPTOM_CF, VITAL_CF, BACKGROUND_CF
from .cardknowlogy import CardKnowlogyEngine


def run_diagnosis(inputs):
    """Run a complete diagnostic session.

    Args:
        inputs (dict): Dictionary with three categories:
            {
                "symptoms": {"shortness_of_breath": True, ...},
                "vitals": {"bp_gte_180": False, ...},
                "background": {"hypertension": True, ...}
            }

    Returns:
        dict: Complete diagnosis result from the engine.
    """
    engine = CardKnowlogyEngine()
    engine.reset()

    symptoms = inputs.get("symptoms", {})
    vitals = inputs.get("vitals", {})
    background = inputs.get("background", {})

    # ── Declare Symptom facts ──────────────────────────────────────────────
    for name, value in symptoms.items():
        if value and name in SYMPTOM_CF:
            cf = SYMPTOM_CF[name]
            engine.fact_cfs[name] = cf
            engine.declare(Symptom(name=name, value=True, cf=cf))

    # ── Declare Vital sign facts ───────────────────────────────────────────
    for name, value in vitals.items():
        if value and name in VITAL_CF:
            cf = VITAL_CF[name]
            engine.fact_cfs[name] = cf
            engine.declare(Vital(name=name, value=True, cf=cf))

    # ── Declare Background facts ───────────────────────────────────────────
    for name, value in background.items():
        if value and name in BACKGROUND_CF:
            cf = BACKGROUND_CF[name]
            engine.fact_cfs[name] = cf
            engine.declare(Background(name=name, value=True, cf=cf))

    # ── Run the inference engine (forward chaining) ────────────────────────
    engine.run()

    # ── Collect and return results ─────────────────────────────────────────
    return engine.get_results()


def get_input_schema():
    """Return the full input schema with all accepted fields and their CFs.

    Returns:
        dict: Input schema organized by category with CF values.
    """
    return {
        "symptoms": {
            name: {
                "description": name.replace("_", " ").title(),
                "cf": cf,
                "type": "boolean",
            }
            for name, cf in SYMPTOM_CF.items()
        },
        "vitals": {
            name: {
                "description": _vital_description(name),
                "cf": cf,
                "type": "boolean",
            }
            for name, cf in VITAL_CF.items()
        },
        "background": {
            name: {
                "description": _background_description(name),
                "cf": cf,
                "type": "boolean",
            }
            for name, cf in BACKGROUND_CF.items()
        },
    }


def _vital_description(name):
    """Human-readable description for vital sign field names."""
    descriptions = {
        "bp_gte_180": "Blood Pressure ≥ 180 mmHg",
        "bp_140_179": "Blood Pressure 140–179 mmHg",
        "bp_lt_90": "Blood Pressure < 90 mmHg",
        "hr_gt_120": "Heart Rate > 120 bpm",
        "hr_100_120": "Heart Rate 100–120 bpm",
        "hr_lt_50": "Heart Rate < 50 bpm",
        "rr_gt_22": "Respiratory Rate > 22 breaths/min",
        "spo2_lt_85": "Oxygen Saturation < 85%",
        "spo2_85_90": "Oxygen Saturation 85–90%",
        "spo2_90_94": "Oxygen Saturation 90–94%",
        "hemoglobin_lt_10": "Hemoglobin < 10 g/dL",
        "temp_gt_38": "Temperature > 38°C",
    }
    return descriptions.get(name, name.replace("_", " ").title())


def _background_description(name):
    """Human-readable description for background information field names."""
    descriptions = {
        "hypertension": "History of Hypertension",
        "diabetes": "History of Diabetes",
        "heart_disease": "Known Heart Disease",
        "obesity": "Obesity (BMI ≥ 30)",
        "smoking": "Current or Former Smoker",
        "family_history": "Family History of Heart Disease",
        "previous_heart_attack": "Previous Heart Attack",
        "chronic_lung_disease": "Chronic Lung Disease (e.g., COPD)",
        "kidney_disease": "Chronic Kidney Disease",
        "dilated_cardiomyopathy": "Dilated Cardiomyopathy",
        "age_gt_60": "Age > 60 years",
        "age_40_60": "Age 40–60 years",
        "age_lt_40": "Age < 40 years",
    }
    return descriptions.get(name, name.replace("_", " ").title())
