/**
 * ============================================
 * CARDKNOWLOGY — API Integration Module
 * ============================================
 *
 * Handles all communication with the Flask backend.
 * Frontend sends boolean inputs only — all medical
 * reasoning is performed server-side.
 */

const API_BASE_URL = "http://localhost:5000";

/**
 * Run a diagnosis via the backend expert system.
 *
 * @param {Object} payload — Patient data with three categories:
 *   {
 *     symptoms:   { shortness_of_breath: true, chest_pain: false, ... },
 *     vitals:     { bp_gte_180: false, hr_gt_120: true, ... },
 *     background: { hypertension: true, age_gt_60: true, ... }
 *   }
 *
 * @returns {Promise<Object>} — Backend response:
 *   {
 *     primary_disease, confidence, confidence_level,
 *     urgency, recommendation, explanation, disclaimer
 *   }
 *
 * @throws {Error} — On network failure or API error.
 */
async function diagnose(payload) {
	const url = `${API_BASE_URL}/api/diagnose`;

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
		// 4xx / 5xx — backend returned an error object
		const message = data.error || data.details || "Unknown server error";
		const hint = data.hint || "";
		throw new Error(`${message}${hint ? " — " + hint : ""}`);
	}

	return data;
}

/**
 * Health check — verify backend is reachable.
 *
 * @returns {Promise<boolean>}
 */
async function checkBackendHealth() {
	try {
		const response = await fetch(`${API_BASE_URL}/api/health`, {
			method: "GET",
			signal: AbortSignal.timeout(5000),
		});
		return response.ok;
	} catch {
		return false;
	}
}
