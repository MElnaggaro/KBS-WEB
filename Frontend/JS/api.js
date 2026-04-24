/**
 * ============================================
 * CARDKNOWLOGY — API Integration Module
 * ============================================
 *
 * Handles all communication with the Flask backend.
 * Frontend sends FLAT boolean inputs only — all medical
 * reasoning is performed server-side.
 */

const API_BASE_URL = "http://localhost:5000";

/**
 * Run a diagnosis via the backend expert system.
 *
 * @param {Object} payload — Flat boolean object:
 *   {
 *     "shortness_of_breath": true,
 *     "chest_pain": false,
 *     "bp_ge_180": true,
 *     "hypertension": true,
 *     "age_ge_60": true,
 *     ...
 *   }
 *
 * @returns {Promise<Object>} — Backend response:
 *   {
 *     disease, urgency, recommendation, confidence,
 *     confidence_level, explanation, disclaimer
 *   }
 *
 * @throws {Error} — On network failure or API error.
 */
async function diagnose(payload) {
	const url = `${API_BASE_URL}/diagnose`;

	let response;
	try {
		response = await fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});
	} catch (networkError) {
		throw new Error(
			"Unable to connect to the diagnostic server. " +
			"Please ensure the backend is running on " + API_BASE_URL
		);
	}

	const data = await response.json();

	if (!response.ok) {
		const message = data.error || data.details || "Unknown server error";
		const hint = data.hint || "";
		throw new Error(`${message}${hint ? " — " + hint : ""}`);
	}

	return data;
}
