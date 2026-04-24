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

			// Reset urgency card
			document.getElementById("urgency-card").className = "result-card dramatic-reveal";

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

		// Reset multi-step form to step 1
		currentStep = 1;
		document.querySelectorAll(".step").forEach((s) => (s.style.display = "none"));
		document.getElementById("step-1").style.display = "block";

		// Reset progress bar
		document.querySelectorAll(".progress-step").forEach((prog, idx) => {
			prog.className = idx === 0 ? "progress-step active" : "progress-step";
		});
		document.querySelectorAll(".progress-line").forEach((line) => {
			line.classList.remove("filled");
		});
		document.querySelectorAll(".step-error").forEach((e) => (e.style.display = "none"));

		// Disable submit button
		updateSubmitButtonState();

		// Deactivate emergency mode
		deactivateEmergencyMode();

		// Reset 3D heart
		window.dispatchEvent(new CustomEvent("diagnosisReset"));
	});

	// ═════════════════════════════════════════════
	// MULTI-STEP FORM CONTROLLER (4 steps)
	// ═════════════════════════════════════════════
	let currentStep = 1;
	const totalSteps = 4;

	window.goToStep = function (nextStep) {
		// Update progress bar
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

		// Update progress lines
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
	// SUBMIT BUTTON STATE — Disabled until input
	// ═════════════════════════════════════════════
	const submitBtn = document.getElementById("submit-btn");
	const allCheckboxes = document.querySelectorAll(
		'#diagnosis-form input[type="checkbox"]'
	);

	function updateSubmitButtonState() {
		const hasAnyInput = Array.from(allCheckboxes).some((cb) => cb.checked);
		submitBtn.disabled = !hasAnyInput;
	}

	allCheckboxes.forEach((cb) => {
		cb.addEventListener("change", updateSubmitButtonState);
	});

	// ═════════════════════════════════════════════
	// LOADING / ERROR UI
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
		clearTimeout(showError._timer);
		showError._timer = setTimeout(() => {
			errorToast.classList.remove("visible");
		}, 8000);
	}

	errorDismissBtn.addEventListener("click", () => {
		errorToast.classList.remove("visible");
	});

	// ═════════════════════════════════════════════
	// DATA COLLECTION — Flat boolean payload
	// ═════════════════════════════════════════════

	function collectPatientData() {
		const payload = {};

		// Collect ALL checkboxes in the form by name
		document
			.querySelectorAll('#diagnosis-form input[type="checkbox"]')
			.forEach((cb) => {
				if (cb.name) {
					payload[cb.name] = cb.checked;
				}
			});

		return payload;
	}

	// ═════════════════════════════════════════════
	// FORM SUBMISSION — API CALL
	// ═════════════════════════════════════════════
	const form = document.getElementById("diagnosis-form");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		// 1. Collect flat boolean data
		const payload = collectPatientData();

		// 2. Validate at least one true
		const hasInput = Object.values(payload).some((v) => v === true);
		if (!hasInput) {
			const errorEl = document.getElementById("error-submit");
			if (errorEl) errorEl.style.display = "block";
			return;
		}

		// 3. Button loading state
		const originalBtnHtml = submitBtn.innerHTML;
		submitBtn.innerHTML = "<span>Analyzing...</span>";
		submitBtn.style.opacity = "0.7";
		submitBtn.style.pointerEvents = "none";

		// 4. 3D heart scan animation (if available)
		if (window.runDiagnosticScan) {
			await window.runDiagnosticScan();
		}

		// 5. Show loading spinner
		showLoading();

		// 6. Call backend
		try {
			const result = await diagnose(payload);

			hideLoading();
			submitBtn.innerHTML = originalBtnHtml;
			submitBtn.style.opacity = "";
			submitBtn.style.pointerEvents = "";

			// 7. Handle null disease
			if (result.disease === null) {
				renderNoDiagnosisResult(result);
			} else {
				renderResults(result);
			}

			// 8. Emergency mode
			if (result.urgency === "CRITICAL") {
				activateEmergencyMode();
			} else {
				deactivateEmergencyMode();
			}

			// 9. Update 3D heart
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

		switch (level) {
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
	// RENDER RESULTS
	// ═════════════════════════════════════════════
	// Backend response: { disease, urgency, recommendation, confidence,
	//                     confidence_level, explanation, disclaimer }

	function renderResults(result) {
		const urgencyCard = document.getElementById("urgency-card");
		const urgencyValue = document.getElementById("urgency-value");
		const urgencyAction = document.getElementById("urgency-action");
		const diseaseValue = document.getElementById("disease-value");
		const recommendationValue = document.getElementById("recommendation-value");

		// Reset urgency card
		urgencyCard.className = "result-card";

		const urgencyLevel = (result.urgency || "LOW").toUpperCase();
		const stateClass = `state-${urgencyLevel.toLowerCase()}`;

		// Urgency action mapping
		const urgencyActions = {
			CRITICAL: "Go to the emergency room immediately",
			HIGH: "See a doctor today",
			MODERATE: "Visit a doctor within a few days",
			LOW: "Routine follow-up recommended",
		};

		// Set urgency card content
		urgencyValue.textContent = urgencyLevel;
		urgencyAction.textContent = urgencyActions[urgencyLevel] || "";

		// Set disease & recommendation
		diseaseValue.textContent = result.disease;
		recommendationValue.textContent = result.recommendation;

		// Color recommendation text
		const urgencyColors = {
			critical: "var(--urgency-critical)",
			high: "var(--urgency-high)",
			moderate: "var(--urgency-moderate)",
			low: "var(--urgency-low)",
		};
		recommendationValue.style.color =
			urgencyColors[urgencyLevel.toLowerCase()] || "var(--color-text-main)";

		// Confidence
		renderConfidence(result.confidence, result.confidence_level);

		// Explanation
		renderExplanation(result);

		// Engine meta
		document.getElementById("meta-confidence").textContent =
			`${Math.round((result.confidence || 0) * 100)}% (${result.confidence_level || "—"})`;

		// Severity meter
		updateSeverityMeter(urgencyLevel);

		// Disclaimer
		if (result.disclaimer) {
			document.getElementById("disclaimer-text").textContent = result.disclaimer;
		}

		// Animate urgency card
		requestAnimationFrame(() => {
			urgencyCard.classList.add(stateClass);
			urgencyCard.classList.add("dramatic-reveal");
			urgencyCard.classList.add("reveal-animate");
		});

		// Show results section
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
		document.getElementById("urgency-action").textContent = "No acute condition detected";
		document.getElementById("disease-value").textContent = "No Cardiac Condition Inferred";
		document.getElementById("recommendation-value").textContent =
			result.recommendation || "Please ensure all relevant data is provided.";
		document.getElementById("recommendation-value").style.color = "var(--urgency-low)";

		renderConfidence(0, "None");

		document.getElementById("explanation-summary").innerHTML =
			`<div class="explanation-block primary-explanation">
				<div class="explanation-icon">ℹ</div>
				<div class="explanation-body">
					<strong>No Condition Detected</strong>
					<p>${result.recommendation || "No cardiac condition could be inferred."}</p>
				</div>
			</div>`;

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
	// RENDER EXPLANATION
	// ═════════════════════════════════════════════

	function renderExplanation(result) {
		const summaryEl = document.getElementById("explanation-summary");
		const explanation = result.explanation || {};

		// Summary (always visible)
		let html = `<div class="explanation-block primary-explanation">`;
		html += `<div class="explanation-icon">⚕</div>`;
		html += `<div class="explanation-body">`;
		html += `<strong>Primary Finding — ${result.disease}</strong>`;
		html += `<p>${result.recommendation}</p>`;
		html += `</div></div>`;

		if (explanation.clinical_notes) {
			html += `<div class="explanation-block secondary-explanation">`;
			html += `<div class="explanation-icon">◆</div>`;
			html += `<div class="explanation-body">`;
			html += `<strong>Clinical Notes</strong>`;
			html += `<p>${explanation.clinical_notes}</p>`;
			html += `</div></div>`;
		}

		summaryEl.innerHTML = html;

		// Fired rules (detail panel)
		const firedRules = explanation.fired_rules || [];
		const firedRulesEl = document.getElementById("fired-rules-list");
		if (firedRules.length > 0) {
			firedRulesEl.innerHTML =
				`<span class="rule-chain-label">Inference Chain: </span>` +
				firedRules.map((id) => `<span class="rule-id">${id}</span>`).join(" → ");
		} else {
			firedRulesEl.innerHTML = '<span class="rule-chain-label">No rules fired</span>';
		}

		// Key facts
		const keyFacts = explanation.key_facts || [];
		const keyFactsEl = document.getElementById("key-facts-list");
		if (keyFacts.length > 0) {
			keyFactsEl.innerHTML = keyFacts
				.map((fact) => `<span class="key-fact-tag">${fact}</span>`)
				.join("");
		} else {
			keyFactsEl.innerHTML = '<span class="key-fact-tag">No key facts</span>';
		}

		// All conditions
		const allConditions = explanation.all_conditions || {};
		const conditionsEl = document.getElementById("all-conditions-list");
		const condEntries = Object.entries(allConditions);
		if (condEntries.length > 0) {
			conditionsEl.innerHTML = condEntries
				.map(([disease, cf]) => {
					const cfPercent = Math.round(cf * 100);
					let badgeColor = "low";
					if (cfPercent >= 90) badgeColor = "critical";
					else if (cfPercent >= 75) badgeColor = "high";
					else if (cfPercent >= 50) badgeColor = "moderate";

					return `<div class="all-cond-item">
						<span class="add-cond-badge urgency-bg-${badgeColor}">${cfPercent}%</span>
						<span class="all-cond-name">${disease}</span>
					</div>`;
				})
				.join("");
		} else {
			conditionsEl.innerHTML = '<span class="all-cond-name">No conditions detected</span>';
		}
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
			if (textEl) textEl.textContent = isExpanded ? "Hide Details" : "Explain Result";
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
