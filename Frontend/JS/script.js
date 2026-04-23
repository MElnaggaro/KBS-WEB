document.addEventListener("DOMContentLoaded", () => {
	// ═════════════════════════════════════════════
	// EMERGENCY MODE CONTROLLER
	// ═════════════════════════════════════════════
	let emergencyActive = false;
	const emergencyAlert = document.getElementById("emergency-alert");

	function activateEmergencyMode() {
		if (emergencyActive) return;
		emergencyActive = true;
		document.body.classList.add("emergency-mode");
		// Slide the alert banner in
		requestAnimationFrame(() => {
			emergencyAlert.classList.add("alert-visible");
		});
	}

	function deactivateEmergencyMode() {
		if (!emergencyActive) return;
		emergencyActive = false;
		document.body.classList.remove("emergency-mode");
		emergencyAlert.classList.remove("alert-visible");
	}

	// --- Fade-in Observer ---
	const fadeInObserver = new IntersectionObserver((entries) => {
		entries.forEach(entry => {
			if (entry.isIntersecting) {
				entry.target.classList.add("active");
			}
		});
	}, { threshold: 0.1 });

	document.querySelectorAll(".fade-in").forEach(el => fadeInObserver.observe(el));

	// --- Navigation & Scrolling ---
	const startBtn = document.getElementById("start-btn");
	const assessmentSection = document.getElementById("assessment");
	const resultsSection = document.getElementById("results");
	const resetBtn = document.getElementById("reset-btn");

	startBtn.addEventListener("click", () => {
		assessmentSection.style.display = "flex";
		// Add a tiny delay to allow display flex to apply before transitioning opacity
		setTimeout(() => {
			assessmentSection.classList.add("section-visible");
			assessmentSection.scrollIntoView({ behavior: "smooth" });
		}, 50);
	});

	resetBtn.addEventListener("click", () => {
		document.getElementById("diagnosis-form").reset();
		resultsSection.classList.remove("section-visible");
		setTimeout(() => {
			resultsSection.style.display = "none";
			assessmentSection.scrollIntoView({ behavior: "smooth" });

			// Reset states
			const urgencyCard = document.getElementById("urgency-card");
			urgencyCard.className = "result-card dramatic-reveal";

			// Reset confidence bar
			const confBar = document.getElementById("confidence-bar-fill");
			if (confBar) confBar.style.width = "0%";
			const confText = document.getElementById("confidence-percentage");
			if (confText) confText.textContent = "0%";

			// Collapse explain details
			const details = document.getElementById("explanation-details");
			if (details) details.style.display = "none";
			const toggleBtn = document.getElementById("explain-toggle-btn");
			if (toggleBtn) toggleBtn.classList.remove("expanded");
		}, 500);

		// Reset Multi-step Form
		currentStep = 1;
		document
			.querySelectorAll(".step")
			.forEach((s) => (s.style.display = "none"));
		document.getElementById("step-1").style.display = "block";

		// Reset Progress UI
		document.querySelectorAll(".progress-step").forEach((prog, idx) => {
			prog.className = idx === 0 ? "progress-step active" : "progress-step";
		});
		document.querySelectorAll(".progress-line").forEach((line) => {
			line.classList.remove("filled");
		});
		document
			.querySelectorAll(".step-error")
			.forEach((e) => (e.style.display = "none"));

		// Disable submit button
		updateSubmitButtonState();

		// Deactivate emergency mode if active
		deactivateEmergencyMode();

		// Reset 3D heart to calm state
		window.dispatchEvent(new CustomEvent("diagnosisReset"));
	});

	// ═════════════════════════════════════════════
	// MULTI-STEP FORM CONTROLLER
	// ═════════════════════════════════════════════
	let currentStep = 1;
	const totalSteps = 3;

	window.goToStep = function (nextStep) {
		// Update progress bar UI
		for (let i = 1; i <= totalSteps; i++) {
			const prog = document.getElementById(`prog-${i}`);
			if (i < nextStep) {
				prog.className = "progress-step completed";
			} else if (i === nextStep) {
				prog.className = "progress-step active";
			} else {
				prog.className = "progress-step";
			}
		}

		// Update Progress Lines
		const lines = document.querySelectorAll(".progress-line");
		lines.forEach((line, index) => {
			if (index < nextStep - 1) {
				line.classList.add("filled");
			} else {
				line.classList.remove("filled");
			}
		});

		const oldStepEl = document.getElementById(`step-${currentStep}`);
		const newStepEl = document.getElementById(`step-${nextStep}`);

		// Hide old, show new with GSAP
		// If moving forward: slide in from right
		// If moving backward: slide in from left
		const xOffset = nextStep > currentStep ? 50 : -50;

		oldStepEl.style.display = "none";
		newStepEl.style.display = "block";

		if (typeof gsap !== "undefined") {
			gsap.fromTo(
				newStepEl,
				{ opacity: 0, x: xOffset },
				{ opacity: 1, x: 0, duration: 0.5, ease: "power2.out" },
			);
		}

		currentStep = nextStep;
	};

	// ═════════════════════════════════════════════
	// SUBMIT BUTTON STATE — At least 1 input required
	// ═════════════════════════════════════════════
	const submitBtn = document.getElementById("submit-btn");
	const allInputs = document.querySelectorAll(
		'#diagnosis-form input[type="checkbox"], #diagnosis-form input[type="radio"]'
	);

	function updateSubmitButtonState() {
		const hasAnyInput = Array.from(allInputs).some((input) => input.checked);
		submitBtn.disabled = !hasAnyInput;
	}

	allInputs.forEach((input) => {
		input.addEventListener("change", updateSubmitButtonState);
	});

	// ═════════════════════════════════════════════
	// LOADING / ERROR UI CONTROLLERS
	// ═════════════════════════════════════════════
	const loadingOverlay = document.getElementById("loading-overlay");
	const errorToast = document.getElementById("error-toast");
	const errorDismissBtn = document.getElementById("error-dismiss-btn");

	function showLoading() {
		loadingOverlay.classList.add("visible");
	}

	function hideLoading() {
		loadingOverlay.classList.remove("visible");
	}

	function showError(title, detail) {
		document.getElementById("error-title").textContent = title;
		document.getElementById("error-detail").textContent = detail;
		errorToast.classList.add("visible");

		// Auto-dismiss after 8s
		clearTimeout(showError._timer);
		showError._timer = setTimeout(() => {
			errorToast.classList.remove("visible");
		}, 8000);
	}

	errorDismissBtn.addEventListener("click", () => {
		errorToast.classList.remove("visible");
	});

	// ═════════════════════════════════════════════
	// DATA COLLECTION — Gather all boolean inputs
	// ═════════════════════════════════════════════

	function collectPatientData() {
		const payload = {
			symptoms: {},
			vitals: {},
			background: {},
		};

		// Collect all checkboxes with data-category
		document
			.querySelectorAll('#diagnosis-form input[type="checkbox"][data-category]')
			.forEach((input) => {
				const category = input.dataset.category;
				const name = input.name;
				if (category && name) {
					payload[category][name] = input.checked;
				}
			});

		// Collect age radio (goes into background)
		const ageRadio = document.querySelector(
			'input[name="age_category"]:checked'
		);
		if (ageRadio) {
			// Set the selected age category to true, others to false
			payload.background.age_gt_60 = ageRadio.value === "age_gt_60";
			payload.background.age_40_60 = ageRadio.value === "age_40_60";
			payload.background.age_lt_40 = ageRadio.value === "age_lt_40";
		}

		return payload;
	}

	// ═════════════════════════════════════════════
	// FORM SUBMISSION — API INTEGRATION
	// ═════════════════════════════════════════════
	const form = document.getElementById("diagnosis-form");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		// ─── 1. Collect data ─────────────────────
		const payload = collectPatientData();

		// ─── 2. Validate at least one True input ─
		const hasInput = Object.values(payload).some((category) =>
			Object.values(category).some((v) => v === true)
		);

		if (!hasInput) {
			const errorEl = document.getElementById("error-3");
			if (errorEl) errorEl.style.display = "block";
			return;
		}

		// ─── 3. Diagnostic scan animation ────────
		const originalBtnHtml = submitBtn.innerHTML;
		submitBtn.innerHTML = "<span>Analyzing...</span>";
		submitBtn.style.opacity = "0.7";
		submitBtn.style.pointerEvents = "none";

		if (window.runDiagnosticScan) {
			await window.runDiagnosticScan();
		}

		// ─── 4. Show loading state ───────────────
		showLoading();

		// ─── 5. Call backend API ─────────────────
		try {
			const result = await diagnose(payload);

			hideLoading();

			// Restore button
			submitBtn.innerHTML = originalBtnHtml;
			submitBtn.style.opacity = "";
			submitBtn.style.pointerEvents = "";

			// ─── 6. Handle "no disease" response ─
			if (result.primary_disease === null) {
				renderNoDiagnosisResult(result);
			} else {
				renderResults(result);
			}

			// ─── 7. Emergency mode ───────────────
			if (result.urgency === "CRITICAL") {
				activateEmergencyMode();
			} else {
				deactivateEmergencyMode();
			}

			// ─── 8. Update 3D heart ──────────────
			const severityMap = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };
			window.dispatchEvent(
				new CustomEvent("diagnosisResult", {
					detail: {
						urgency: result.urgency || "LOW",
						severityScore: severityMap[result.urgency] || 0,
					},
				}),
			);
		} catch (error) {
			hideLoading();

			// Restore button
			submitBtn.innerHTML = originalBtnHtml;
			submitBtn.style.opacity = "";
			submitBtn.style.pointerEvents = "";

			showError("Diagnosis Failed", error.message);
		}
	});

	// ═════════════════════════════════════════════
	// SEVERITY METER
	// ═════════════════════════════════════════════
	function updateSeverityMeter(level) {
		const indicator = document.getElementById("severity-indicator");
		if (!indicator) return;

		let position = 0;
		let className = "meter-indicator indicator-low";

		switch (level.toUpperCase()) {
			case "LOW":
				position = 0;
				className = "meter-indicator indicator-low";
				break;
			case "MODERATE":
				position = 33.33;
				className = "meter-indicator indicator-moderate";
				break;
			case "HIGH":
				position = 66.66;
				className = "meter-indicator indicator-high";
				break;
			case "CRITICAL":
				position = 100;
				className = "meter-indicator indicator-critical";
				break;
		}

		requestAnimationFrame(() => {
			indicator.style.left = position + "%";
			indicator.className = className;
		});
	}

	// ═════════════════════════════════════════════
	// RENDER RESULTS (from backend response)
	// ═════════════════════════════════════════════

	function renderResults(result) {
		const urgencyCard = document.getElementById("urgency-card");
		const urgencyValue = document.getElementById("urgency-value");
		const urgencyAction = document.getElementById("urgency-action");
		const conditionValue = document.getElementById("condition-value");
		const actionValue = document.getElementById("action-value");

		// ── Reset urgency card state ──
		urgencyCard.className = "result-card";

		// ── Map urgency string to CSS state class ──
		const urgencyLevel = (result.urgency || "LOW").toUpperCase();
		const stateClass = `state-${urgencyLevel.toLowerCase()}`;

		// ── Urgency action text mapping ──
		const urgencyActions = {
			CRITICAL: "Go to the emergency room immediately",
			HIGH: "See a doctor today",
			MODERATE: "Visit a doctor within a few days",
			LOW: "Routine follow-up recommended",
		};

		// ── Set urgency card ──
		urgencyValue.textContent = urgencyLevel;
		urgencyAction.textContent = urgencyActions[urgencyLevel] || result.recommendation;

		// ── Set primary condition ──
		conditionValue.textContent = result.primary_disease;
		actionValue.textContent = result.recommendation;

		// ── Color the action text based on urgency ──
		const urgencyColors = {
			critical: "var(--urgency-critical)",
			high: "var(--urgency-high)",
			moderate: "var(--urgency-moderate)",
			low: "var(--urgency-low)",
		};
		actionValue.style.color =
			urgencyColors[urgencyLevel.toLowerCase()] || "var(--color-text-main)";

		// ── Render confidence ──
		renderConfidence(result.confidence, result.confidence_level);

		// ── Render additional conditions ──
		renderAdditionalConditions(result.explanation);

		// ── Render explanation ──
		renderExplanation(result);

		// ── Render engine meta ──
		const firedRules = result.explanation?.fired_rules || [];
		document.getElementById("meta-rules-fired").textContent = firedRules.length;
		document.getElementById("meta-confidence").textContent =
			`${Math.round((result.confidence || 0) * 100)}% (${result.confidence_level || "—"})`;

		// ── Update Severity Meter ──
		updateSeverityMeter(urgencyLevel);

		// ── Update disclaimer ──
		if (result.disclaimer) {
			document.getElementById("disclaimer-text").textContent = result.disclaimer;
		}

		// ── Animate urgency card ──
		requestAnimationFrame(() => {
			urgencyCard.classList.add(stateClass);
			urgencyCard.classList.add("dramatic-reveal");
			urgencyCard.classList.add("reveal-animate");
		});

		// ── Show results section ──
		resultsSection.style.display = "flex";
		setTimeout(() => {
			resultsSection.classList.add("section-visible");
			resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 50);
	}

	// ═════════════════════════════════════════════
	// RENDER NO-DIAGNOSIS RESULT
	// ═════════════════════════════════════════════

	function renderNoDiagnosisResult(result) {
		const urgencyCard = document.getElementById("urgency-card");
		urgencyCard.className = "result-card";

		document.getElementById("urgency-value").textContent = "CLEAR";
		document.getElementById("urgency-action").textContent =
			"No acute condition detected";
		document.getElementById("condition-value").textContent =
			"No Cardiac Condition Inferred";
		document.getElementById("action-value").textContent =
			result.message || "Please ensure all relevant data is provided.";
		document.getElementById("action-value").style.color = "var(--urgency-low)";

		// Show low confidence
		renderConfidence(0, "None");

		// Hide additional panels
		document.getElementById("additional-panel").style.display = "none";

		// Clear explanation
		document.getElementById("explanation-summary").innerHTML =
			`<div class="explanation-block primary-explanation">
				<div class="explanation-icon">ℹ</div>
				<div class="explanation-body">
					<strong>No Condition Detected</strong>
					<p>${result.message || "No cardiac condition could be inferred from the provided inputs."}</p>
				</div>
			</div>`;

		document.getElementById("meta-rules-fired").textContent = "0";
		document.getElementById("meta-confidence").textContent = "0%";

		if (result.disclaimer) {
			document.getElementById("disclaimer-text").textContent = result.disclaimer;
		}

		updateSeverityMeter("LOW");

		requestAnimationFrame(() => {
			urgencyCard.classList.add("state-low");
			urgencyCard.classList.add("dramatic-reveal");
			urgencyCard.classList.add("reveal-animate");
		});

		resultsSection.style.display = "flex";
		setTimeout(() => {
			resultsSection.classList.add("section-visible");
			resultsSection.scrollIntoView({ behavior: "smooth", block: "start" });
		}, 50);
	}

	// ═════════════════════════════════════════════
	// RENDER CONFIDENCE
	// ═════════════════════════════════════════════

	function renderConfidence(confidence, level) {
		const percentage = Math.round((confidence || 0) * 100);
		const percentEl = document.getElementById("confidence-percentage");
		const levelEl = document.getElementById("confidence-level-text");
		const barEl = document.getElementById("confidence-bar-fill");

		if (percentEl) percentEl.textContent = `${percentage}%`;
		if (levelEl) levelEl.textContent = level || "—";

		if (barEl) {
			// Determine color based on confidence
			let barColor;
			if (percentage >= 90) {
				barColor = "linear-gradient(90deg, var(--urgency-high), var(--urgency-critical))";
			} else if (percentage >= 75) {
				barColor = "linear-gradient(90deg, var(--urgency-moderate), var(--urgency-high))";
			} else if (percentage >= 50) {
				barColor = "linear-gradient(90deg, var(--urgency-low), var(--urgency-moderate))";
			} else {
				barColor = "linear-gradient(90deg, rgba(255,255,255,0.2), var(--urgency-low))";
			}

			setTimeout(() => {
				barEl.style.width = `${percentage}%`;
				barEl.style.background = barColor;
			}, 300);
		}
	}

	// ═════════════════════════════════════════════
	// RENDER ADDITIONAL CONDITIONS
	// ═════════════════════════════════════════════

	function renderAdditionalConditions(explanation) {
		const panel = document.getElementById("additional-panel");
		const list = document.getElementById("additional-conditions-list");
		list.innerHTML = "";

		const allConditions = explanation?.all_conditions || {};
		const entries = Object.entries(allConditions);

		// Show only if there are multiple conditions (skip the primary)
		if (entries.length <= 1) {
			panel.style.display = "none";
			return;
		}

		panel.style.display = "block";

		// Skip the first (primary) condition
		entries.slice(1).forEach(([disease, cf]) => {
			const card = document.createElement("div");
			const cfPercent = Math.round(cf * 100);

			// Estimate urgency from CF for coloring
			let urgencyColor = "low";
			if (cfPercent >= 90) urgencyColor = "critical";
			else if (cfPercent >= 75) urgencyColor = "high";
			else if (cfPercent >= 50) urgencyColor = "moderate";

			card.className = `additional-condition-card urgency-border-${urgencyColor}`;
			card.innerHTML = `
                <div class="add-cond-header">
                    <span class="add-cond-badge urgency-bg-${urgencyColor}">${cfPercent}%</span>
                    <span class="add-cond-name">${disease}</span>
                </div>
                <div class="add-cond-cf-bar">
                    <div class="add-cond-cf-fill" style="width: ${cfPercent}%"></div>
                </div>
            `;
			list.appendChild(card);
		});

		// Staggered reveal for additional conditions
		if (typeof gsap !== "undefined") {
			gsap.from(list.querySelectorAll(".additional-condition-card"), {
				opacity: 0,
				y: 20,
				duration: 0.6,
				stagger: 0.15,
				ease: "power2.out",
			});
		}
	}

	// ═════════════════════════════════════════════
	// RENDER EXPLANATION
	// ═════════════════════════════════════════════

	function renderExplanation(result) {
		const summaryEl = document.getElementById("explanation-summary");
		const explanation = result.explanation || {};

		// ── Summary (always visible) ──
		let html = `<div class="explanation-block primary-explanation">`;
		html += `<div class="explanation-icon">⚕</div>`;
		html += `<div class="explanation-body">`;
		html += `<strong>Primary Finding — ${result.primary_disease}</strong>`;
		html += `<p>${result.recommendation}</p>`;
		html += `</div></div>`;

		// Clinical notes
		if (explanation.clinical_notes) {
			html += `<div class="explanation-block secondary-explanation">`;
			html += `<div class="explanation-icon">◆</div>`;
			html += `<div class="explanation-body">`;
			html += `<strong>Clinical Notes</strong>`;
			html += `<p>${explanation.clinical_notes}</p>`;
			html += `</div></div>`;
		}

		summaryEl.innerHTML = html;

		// ── Detailed explanation (toggle) ──
		const firedRules = explanation.fired_rules || [];
		const keyFacts = explanation.key_facts || [];
		const clinicalNotes = explanation.clinical_notes || "--";

		// Fired rules
		const firedRulesEl = document.getElementById("fired-rules-list");
		if (firedRules.length > 0) {
			firedRulesEl.innerHTML =
				`<span class="rule-chain-label">Inference Chain: </span>` +
				firedRules
					.map((id) => `<span class="rule-id">${id}</span>`)
					.join(" → ");
		} else {
			firedRulesEl.innerHTML =
				'<span class="rule-chain-label">No rules fired</span>';
		}

		// Key facts
		const keyFactsEl = document.getElementById("key-facts-list");
		if (keyFacts.length > 0) {
			keyFactsEl.innerHTML = keyFacts
				.map((fact) => `<span class="key-fact-tag">${fact}</span>`)
				.join("");
		} else {
			keyFactsEl.innerHTML = '<span class="key-fact-tag">No key facts</span>';
		}

		// Clinical notes
		document.getElementById("clinical-notes-text").textContent = clinicalNotes;
	}

	// ═════════════════════════════════════════════
	// EXPLAIN TOGGLE BUTTON
	// ═════════════════════════════════════════════

	const explainToggle = document.getElementById("explain-toggle-btn");
	const explanationDetails = document.getElementById("explanation-details");

	if (explainToggle && explanationDetails) {
		explainToggle.addEventListener("click", () => {
			const isExpanded = explainToggle.classList.toggle("expanded");
			explanationDetails.style.display = isExpanded ? "block" : "none";

			const textEl = explainToggle.querySelector(".explain-toggle-text");
			const iconEl = explainToggle.querySelector(".explain-toggle-icon");
			if (textEl) textEl.textContent = isExpanded ? "Hide Details" : "Show Details";
			if (iconEl) iconEl.textContent = isExpanded ? "▲" : "▼";

			if (isExpanded && typeof gsap !== "undefined") {
				gsap.from(explanationDetails, {
					opacity: 0,
					y: -10,
					duration: 0.4,
					ease: "power2.out",
				});
			}
		});
	}
});
