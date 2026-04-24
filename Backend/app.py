"""
CardKnowlogy Expert System — Flask REST API

Endpoints:
  POST /diagnose       — Accept FLAT boolean inputs, return diagnosis (primary)
  POST /api/diagnose   — Accept categorized boolean inputs, return diagnosis (legacy)
  GET  /api/inputs     — Return the full input schema with CF values
  GET  /api/health     — Health check

CORS is enabled for frontend integration.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

from engine.runner import run_diagnosis, get_input_schema

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# ─── Field name mapping (frontend → backend internal) ──────────────────────────
# The frontend uses slightly different naming conventions.
# This map translates them to the internal engine field names.
FIELD_MAP = {
    # Vitals: frontend uses _ge_ / backend uses _gte_ or _gt_
    "bp_ge_180":   "bp_gte_180",
    "hr_ge_120":   "hr_gt_120",
    "rr_ge_22":    "rr_gt_22",
    "temp_ge_38":  "temp_gt_38",
    # Age: frontend uses _ge_ / backend uses _gt_
    "age_ge_60":   "age_gt_60",
    # Fields that are the same on both sides (identity mapping):
    # bp_140_179, bp_lt_90, hr_100_120, hr_lt_50, spo2_lt_85,
    # spo2_85_90, spo2_90_94, hemoglobin_lt_10, age_40_60, age_lt_40,
    # all symptoms, all background fields
}

# ─── Category lookup ───────────────────────────────────────────────────────────
from engine.cf_config import SYMPTOM_CF, VITAL_CF, BACKGROUND_CF

_SYMPTOMS = set(SYMPTOM_CF.keys())
_VITALS = set(VITAL_CF.keys())
_BACKGROUND = set(BACKGROUND_CF.keys())


def _flat_to_categorized(flat_data):
    """Convert a flat boolean dict into the categorized format the engine expects.

    Handles field name translation and category assignment.

    Args:
        flat_data (dict): e.g. {"shortness_of_breath": True, "bp_ge_180": True, ...}

    Returns:
        dict: {"symptoms": {...}, "vitals": {...}, "background": {...}}
    """
    categorized = {"symptoms": {}, "vitals": {}, "background": {}}

    for key, value in flat_data.items():
        # Translate field name if needed
        internal_key = FIELD_MAP.get(key, key)

        # Assign to the correct category
        if internal_key in _SYMPTOMS:
            categorized["symptoms"][internal_key] = value
        elif internal_key in _VITALS:
            categorized["vitals"][internal_key] = value
        elif internal_key in _BACKGROUND:
            categorized["background"][internal_key] = value
        # Unknown fields are silently ignored

    return categorized


@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "system": "CardKnowlogy Expert System",
        "version": "1.0.0",
    })


@app.route("/api/inputs", methods=["GET"])
def get_inputs():
    """Return the full input schema.

    Response contains all accepted input fields organized by category
    (symptoms, vitals, background) with their predefined CF values
    and human-readable descriptions.
    """
    schema = get_input_schema()
    return jsonify({
        "inputs": schema,
        "instructions": (
            "Send a POST request to /diagnose with boolean values "
            "for each field. Only include fields that are True (present). "
            "All CF values are predefined and cannot be modified."
        ),
    })


@app.route("/diagnose", methods=["POST"])
def diagnose_flat():
    """Run a diagnosis based on FLAT boolean inputs.

    This is the primary endpoint used by the frontend.
    Accepts a flat JSON object with all boolean fields at the top level.

    Request Body (JSON):
        {
            "shortness_of_breath": true,
            "chest_pain": true,
            "bp_ge_180": true,
            "hypertension": true,
            "age_ge_60": true,
            ...
        }

    Response (JSON):
        {
            "disease": "...",
            "urgency": "CRITICAL",
            "recommendation": "...",
            "confidence": 0.92
        }
    """
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No input data provided",
            "hint": "Send a JSON body with boolean fields.",
        }), 400

    # Check that at least one True value exists
    has_input = any(v is True for v in data.values())
    if not has_input:
        return jsonify({
            "error": "No active inputs detected",
            "hint": "At least one input must be set to true for diagnosis.",
        }), 400

    # Convert flat → categorized for the engine
    categorized = _flat_to_categorized(data)

    # Run the expert system
    try:
        result = run_diagnosis(categorized)
    except Exception as e:
        return jsonify({
            "error": "Diagnosis engine error",
            "details": str(e),
        }), 500

    # Handle case where no disease was inferred
    if result.get("primary_disease") is None:
        return jsonify({
            "disease": None,
            "urgency": None,
            "recommendation": (
                "No cardiac condition could be inferred from the provided inputs. "
                "Please ensure all relevant symptoms, vital signs, and background "
                "information are provided."
            ),
            "confidence": 0.0,
        }), 200

    # Map internal result to the simplified frontend response format
    return jsonify({
        "disease": result["primary_disease"],
        "urgency": result.get("urgency", "UNKNOWN"),
        "recommendation": result.get("recommendation", "Consult a medical professional"),
        "confidence": result.get("confidence", 0.0),
        # Include extra details for the "Explain Result" feature
        "confidence_level": result.get("confidence_level", ""),
        "explanation": result.get("explanation", {}),
        "disclaimer": result.get("disclaimer", ""),
    }), 200


@app.route("/api/diagnose", methods=["POST"])
def diagnose_categorized():
    """Run a diagnosis based on CATEGORIZED boolean inputs (legacy).

    Request Body (JSON):
        {
            "symptoms": {"shortness_of_breath": true, "edema": true, ...},
            "vitals": {"bp_gte_180": false, ...},
            "background": {"hypertension": true, ...}
        }

    Response (JSON):
        {
            "primary_disease": "...",
            "confidence": 0.99,
            "confidence_level": "Very High",
            "urgency": "HIGH",
            "recommendation": "...",
            "explanation": {...},
            "disclaimer": "..."
        }
    """
    data = request.get_json()

    if not data:
        return jsonify({
            "error": "No input data provided",
            "hint": "Send a JSON body with 'symptoms', 'vitals', and/or 'background' keys.",
        }), 400

    # Validate that at least one True input exists
    has_input = False
    for category in ["symptoms", "vitals", "background"]:
        category_data = data.get(category, {})
        if any(v is True for v in category_data.values()):
            has_input = True
            break

    if not has_input:
        return jsonify({
            "error": "No active inputs detected",
            "hint": "At least one input must be set to true for diagnosis.",
        }), 400

    # Run the expert system
    try:
        result = run_diagnosis(data)
    except Exception as e:
        return jsonify({
            "error": "Diagnosis engine error",
            "details": str(e),
        }), 500

    # Handle case where no disease was inferred
    if result.get("primary_disease") is None:
        return jsonify({
            "primary_disease": None,
            "confidence": 0.0,
            "message": (
                "No cardiac condition could be inferred from the provided inputs. "
                "Please ensure all relevant symptoms, vital signs, and background "
                "information are provided."
            ),
            "disclaimer": result.get("disclaimer", ""),
        }), 200

    return jsonify(result), 200


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
