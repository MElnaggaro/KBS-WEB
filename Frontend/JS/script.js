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
		document
			.querySelectorAll("input[required]")
			.forEach((input) => (input.style.borderColor = "var(--color-border)"));

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

	function validateStep(step) {
		const stepEl = document.getElementById(`step-${step}`);
		const inputs = stepEl.querySelectorAll("input[required]");
		let isValid = true;

		inputs.forEach((input) => {
			if (!input.checkValidity()) {
				isValid = false;
				input.style.borderColor = "var(--urgency-critical)";
				input.style.boxShadow = "0 0 10px rgba(239, 68, 68, 0.2)";
			} else {
				input.style.borderColor = "var(--color-border)";
				input.style.boxShadow = "none";
			}
		});

		const errorEl = document.getElementById(`error-${step}`);
		if (!isValid && errorEl) {
			errorEl.style.display = "block";
		} else if (errorEl) {
			errorEl.style.display = "none";
		}

		return isValid;
	}

	window.goToStep = function (nextStep) {
		// Validate current step if moving forward
		if (nextStep > currentStep) {
			if (!validateStep(currentStep)) return;
		}

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

	// --- Expert System Integration ---
	const form = document.getElementById("diagnosis-form");

	form.addEventListener("submit", async (e) => {
		e.preventDefault();

		// ═══════════════════════════════════
		// 1. GATHER ALL PATIENT DATA
		// ═══════════════════════════════════
		const patientData = {
			symptoms: {
				shortness_of_breath: document.getElementById("sym-sob").checked,
				chest_pain: document.getElementById("sym-cp").checked,
				fatigue: document.getElementById("sym-fatigue").checked,
				edema: document.getElementById("sym-edema").checked,
				cough: document.getElementById("sym-cough").checked,
				low_activity: document.getElementById("sym-low-activity").checked,
			},
			vitals: {
				bp_systolic: parseInt(document.getElementById("vital-bp").value, 10),
				heart_rate: parseInt(document.getElementById("vital-hr").value, 10),
				respiratory_rate: parseInt(
					document.getElementById("vital-rr").value,
					10,
				),
				oxygen_saturation: parseInt(
					document.getElementById("vital-o2").value,
					10,
				),
				hemoglobin: parseFloat(document.getElementById("vital-hb").value),
			},
			background: {
				age: parseInt(document.getElementById("bg-age").value, 10),
				hypertension: document.getElementById("bg-ht").checked,
				diabetes: document.getElementById("bg-diabetes").checked,
				heart_disease: document.getElementById("bg-heart-disease").checked,
				obesity: document.getElementById("bg-obesity").checked,
				smoking: document.getElementById("bg-smoke").checked,
				family_history: document.getElementById("bg-family").checked,
			},
		};

		// ═══════════════════════════════════
		// 2. DIAGNOSTIC SCAN ANIMATION
		// ═══════════════════════════════════
		const submitBtn = form.querySelector('button[type="submit"]');
		const originalBtnText = submitBtn.innerHTML;

		if (window.runDiagnosticScan) {
			// Update button state
			submitBtn.innerHTML = "<span>Analyzing...</span>";
			submitBtn.style.opacity = "0.7";
			submitBtn.style.pointerEvents = "none";

			// Wait for scan animation to complete
			await window.runDiagnosticScan();

			// Restore button state
			submitBtn.innerHTML = originalBtnText;
			submitBtn.style.opacity = "";
			submitBtn.style.pointerEvents = "";
		}

		// ═══════════════════════════════════
		// 3. RUN THE EXPERT ENGINE
		// ═══════════════════════════════════
		const result = runExpertSystem(patientData);

		// ═══════════════════════════════════
		// 4. UPDATE THE RESULTS UI
		// ═══════════════════════════════════
		renderResults(result);

		// ═══════════════════════════════════
		// 5. EMERGENCY MODE CHECK
		// ═══════════════════════════════════
		if (result.urgency.label === "CRITICAL") {
			activateEmergencyMode();
		} else {
			deactivateEmergencyMode();
		}

		// ═══════════════════════════════════
		// 6. UPDATE 3D HEART VISUALIZATION
		// ═══════════════════════════════════
		window.dispatchEvent(
			new CustomEvent("diagnosisResult", {
				detail: {
					urgency: result.urgency.label,
					severityScore: result.severityScore,
				},
			}),
		);
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
	// RENDER RESULTS
	// ═════════════════════════════════════════════

	function renderResults(result) {
		const urgencyCard = document.getElementById("urgency-card");
		const urgencyValue = document.getElementById("urgency-value");
		const urgencyAction = document.getElementById("urgency-action");
		const conditionValue = document.getElementById("condition-value");
		const actionValue = document.getElementById("action-value");
		const explanationEl = document.getElementById("explanation-text");

		// ── Reset urgency card state ──
		urgencyCard.className = "result-card";

		// ── Map urgency color to CSS state class ──
		const stateClass = `state-${result.urgency.color}`;

		// ── Set urgency card ──
		urgencyValue.textContent = result.urgency.label;
		urgencyAction.textContent = result.suggestedAction;

		// ── Set primary condition ──
		conditionValue.textContent = result.primaryCondition;
		actionValue.textContent = result.suggestedAction;

		// ── Color the action text based on urgency ──
		const urgencyColors = {
			critical: "var(--urgency-critical)",
			high: "var(--urgency-high)",
			moderate: "var(--urgency-moderate)",
			low: "var(--urgency-low)",
		};
		actionValue.style.color =
			urgencyColors[result.urgency.color] || "var(--color-text-main)";

		// ── Render vitals summary ──
		renderVitalsSummary(result.vitalsSummary);

		// ── Render additional conditions ──
		renderAdditionalConditions(result.additionalConditions);

		// ── Render risk factors ──
		renderRiskFactors(result.riskFactors, result.riskScore);

		// ── Render explanation ──
		renderExplanation(result);

		// ── Render engine meta ──
		document.getElementById("meta-rules-evaluated").textContent =
			result.rulesEvaluated;
		document.getElementById("meta-rules-fired").textContent = result.rulesFired;

		// ── Update Severity Meter ──
		updateSeverityMeter(result.urgency.label);

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
	// RENDER VITALS SUMMARY
	// ═════════════════════════════════════════════

	function renderVitalsSummary(vitalsSummary) {
		const grid = document.getElementById("vitals-summary-grid");
		grid.innerHTML = "";

		vitalsSummary.forEach((vital) => {
			const item = document.createElement("div");
			item.className = `vital-item vital-status-${vital.status}`;

			const statusDot =
				vital.status === "normal"
					? "●"
					: vital.status === "critical"
						? "◉"
						: "◎";

			item.innerHTML = `
                <div class="vital-header">
                    <span class="vital-name">${vital.name}</span>
                    <span class="vital-status-dot">${statusDot}</span>
                </div>
                <div class="vital-value">${vital.value}</div>
                <div class="vital-label">${vital.label}</div>
            `;
			grid.appendChild(item);
		});

		// Staggered reveal for vitals
		gsap.from(grid.querySelectorAll(".vital-item"), {
			opacity: 0,
			y: 20,
			duration: 0.6,
			stagger: 0.1,
			ease: "power2.out"
		});
	}


	// ═════════════════════════════════════════════
	// RENDER ADDITIONAL CONDITIONS
	// ═════════════════════════════════════════════

	function renderAdditionalConditions(conditions) {
		const panel = document.getElementById("additional-panel");
		const list = document.getElementById("additional-conditions-list");
		list.innerHTML = "";

		if (!conditions || conditions.length === 0) {
			panel.style.display = "none";
			return;
		}

		panel.style.display = "block";

		conditions.forEach((cond) => {
			const card = document.createElement("div");
			card.className = `additional-condition-card urgency-border-${cond.urgency.color}`;
			card.innerHTML = `
                <div class="add-cond-header">
                    <span class="add-cond-badge urgency-bg-${cond.urgency.color}">${cond.urgency.label}</span>
                    <span class="add-cond-name">${cond.condition}</span>
                </div>
                <p class="add-cond-explanation">${cond.explanation}</p>
            `;
			list.appendChild(card);
		});

		// Staggered reveal for additional conditions
		gsap.from(list.querySelectorAll(".additional-condition-card"), {
			opacity: 0,
			y: 20,
			duration: 0.6,
			stagger: 0.15,
			ease: "power2.out"
		});
	}


	// ═════════════════════════════════════════════
	// RENDER RISK FACTORS
	// ═════════════════════════════════════════════

	function renderRiskFactors(riskFactors, riskScore) {
		const panel = document.getElementById("risk-panel");
		const tags = document.getElementById("risk-factors-tags");
		const bar = document.getElementById("risk-bar-fill");
		const score = document.getElementById("risk-score-value");
		tags.innerHTML = "";

		if (!riskFactors || riskFactors.length === 0) {
			panel.style.display = "none";
			return;
		}

		panel.style.display = "block";

		// Max risk score is around 13 (all factors max)
		const maxScore = 13;
		const percentage = Math.min((riskScore / maxScore) * 100, 100);

		score.textContent = riskScore;

		// Animate bar fill
		setTimeout(() => {
			bar.style.width = `${percentage}%`;

			// Color based on score
			if (riskScore >= 8) {
				bar.style.background =
					"linear-gradient(90deg, var(--urgency-high), var(--urgency-critical))";
			} else if (riskScore >= 5) {
				bar.style.background =
					"linear-gradient(90deg, var(--urgency-moderate), var(--urgency-high))";
			} else {
				bar.style.background =
					"linear-gradient(90deg, var(--urgency-low), var(--urgency-moderate))";
			}
		}, 300);

		riskFactors.forEach((factor) => {
			const tag = document.createElement("span");
			tag.className = "risk-tag";
			tag.textContent = factor;
			tags.appendChild(tag);
		});

		// Staggered reveal for risk tags
		gsap.from(tags.querySelectorAll(".risk-tag"), {
			opacity: 0,
			scale: 0.8,
			duration: 0.4,
			stagger: 0.05,
			ease: "back.out(1.7)"
		});
	}


	// ═════════════════════════════════════════════
	// RENDER EXPLANATION
	// ═════════════════════════════════════════════

	function renderExplanation(result) {
		const el = document.getElementById("explanation-text");

		let html = `<div class="explanation-block primary-explanation">`;
		html += `<div class="explanation-icon">⚕</div>`;
		html += `<div class="explanation-body">`;
		html += `<strong>Primary Finding — ${result.primaryCondition}</strong>`;
		html += `<p>${result.explanation}</p>`;
		html += `</div></div>`;

		if (result.additionalConditions && result.additionalConditions.length > 0) {
			result.additionalConditions.forEach((cond) => {
				html += `<div class="explanation-block secondary-explanation">`;
				html += `<div class="explanation-icon">◆</div>`;
				html += `<div class="explanation-body">`;
				html += `<strong>${cond.condition}</strong>`;
				html += `<p>${cond.explanation}</p>`;
				html += `</div></div>`;
			});
		}

		// Rule chain summary
		if (result.firedRuleIds && result.firedRuleIds.length > 0) {
			html += `<div class="rule-chain">`;
			html += `<span class="rule-chain-label">Inference Chain: </span>`;
			html += result.firedRuleIds
				.map((id) => `<span class="rule-id">${id}</span>`)
				.join(" → ");
			html += `</div>`;
		}

		el.innerHTML = html;
	}
});
