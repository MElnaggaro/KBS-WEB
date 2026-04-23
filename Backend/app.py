"""
CardKnowlogy Expert System — Flask REST API

Endpoints:
  POST /api/diagnose  — Accept boolean inputs, return diagnosis
  GET  /api/inputs    — Return the full input schema with CF values
  GET  /api/health    — Health check

CORS is enabled for frontend integration.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS

from engine.runner import run_diagnosis, get_input_schema

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes


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
            "Send a POST request to /api/diagnose with boolean values "
            "for each field. Only include fields that are True (present). "
            "All CF values are predefined and cannot be modified."
        ),
    })


@app.route("/api/diagnose", methods=["POST"])
def diagnose():
    """Run a diagnosis based on boolean inputs.

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
