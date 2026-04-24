<p align="center">
  <img src="https://img.shields.io/badge/Expert_System-Rule--Based-blueviolet?style=for-the-badge" alt="Rule-Based Expert System" />
  <img src="https://img.shields.io/badge/Inference-Forward_Chaining-blue?style=for-the-badge" alt="Forward Chaining" />
  <img src="https://img.shields.io/badge/Certainty_Factor-Enabled-green?style=for-the-badge" alt="Certainty Factor" />
  <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" alt="Active" />
</p>

# 🫀 CardKnowlogy — Heart Failure Diagnosis Expert System

> **An intelligent, rule-based clinical decision-support system that simulates expert-level cardiac triage using forward chaining and certainty factors.**

CardKnowlogy is a Knowledge-Based System (KBS) designed to assist in early triage and diagnosis of heart-related conditions. It evaluates patient symptoms, vital signs, and medical history through **71 production rules** to produce an explainable, confidence-scored diagnosis — complete with urgency classification and clinical recommendations.

> [!IMPORTANT]
> **CardKnowlogy is NOT a replacement for medical professionals.**
> This system is built for **educational and telemedicine demonstration purposes only**. It is not a certified medical device. All outputs should be validated by a qualified cardiologist before any clinical decision-making.

---

## ✨ Features

| Feature | Description |
|:--------|:------------|
| 🧠 **Rule-Based Expert System** | 71 production rules (R0–R70) covering 10 cardiac conditions |
| ⛓️ **Forward Chaining** | Data-driven inference — facts trigger rules automatically |
| 📊 **Certainty Factors** | Predefined CF values handle uncertainty in diagnosis (managed entirely server-side) |
| ⚡ **Real-Time Diagnosis** | Instant results via REST API upon form submission |
| 🔍 **Explainable Results** | Transparent reasoning — view fired rules, key facts, and all detected conditions |
| 🎯 **Urgency Classification** | Four-tier triage: `LOW` → `MODERATE` → `HIGH` → `CRITICAL` |
| 🫀 **3D Heart Visualization** | Interactive Three.js heart model with scroll-driven animations & urgency-reactive effects |
| 🎬 **Cinematic UI** | Immersive intro sequence, particle systems, ambient glows, and GSAP animations |
| 💓 **Reactive Audio-Visuals** | Heartbeat pacing, blood flow, and emissive effects adapt to diagnostic severity |

### 🏥 Covered Conditions

The system can diagnose the following cardiac conditions:

- Acute Decompensated Heart Failure (ADHF)
- Chronic Heart Failure (CHF)
- Heart Failure with Preserved Ejection Fraction (HFpEF)
- Myocardial Infarction (MI)
- Acute Coronary Syndrome (ACS)
- Stable & Unstable Angina
- Hypertensive Crisis / Emergency
- Atrial Fibrillation (AFib)
- Sudden Cardiac Arrest (SCA)
- Cardiogenic Shock

---

## 🏗️ System Architecture

CardKnowlogy follows a clean **client-server architecture** with strict separation of concerns:

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Client)                        │
│                                                                 │
│   ┌───────────┐    ┌──────────────┐    ┌────────────────────┐   │
│   │  User UI  │───▶│ Input Form   │───▶│  API Module (AJAX) │   │
│   │  (HTML/   │    │ (Symptoms,   │    │  POST /diagnose    │   │
│   │   CSS/JS) │    │  Vitals, BG) │    │                    │   │
│   └───────────┘    └──────────────┘    └────────┬───────────┘   │
│   ┌───────────┐    ┌──────────────┐             │               │
│   │  3D Heart │    │  Results     │◀────────────┘               │
│   │ (Three.js)│    │  Display     │  JSON Response              │
│   └───────────┘    └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                         HTTP / REST
                              │
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND (Flask + Experta)                   │
│                                                                 │
│   ┌───────────┐    ┌──────────────┐    ┌────────────────────┐   │
│   │  Flask    │───▶│  Runner /    │───▶│  CardKnowlogy      │   │
│   │  REST API │    │  Orchestrator│    │  Engine (Experta)   │   │
│   └───────────┘    └──────────────┘    │                    │   │
│                    ┌──────────────┐    │  • 71 Rules        │   │
│                    │  CF Config   │───▶│  • CF Combination   │   │
│                    │  (Static)    │    │  • Working Memory   │   │
│                    └──────────────┘    │  • Forward Chaining │   │
│                                       └────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 🖥️ Frontend — Deep Dive

The frontend is a **static single-page application** (HTML + CSS + Vanilla JS) — no frameworks, no build tools. It is responsible exclusively for **presentation and data collection**, containing **zero medical inference logic**.

#### Modules

| File | Role |
|:-----|:-----|
| `index.html` | Single entry point — defines the cinematic hero, the 3-step diagnostic form, and the results display panel |
| `style.css` | Complete design system (~48 KB) — dark theme, glassmorphism cards, custom checkboxes/radios, urgency color tokens, responsive breakpoints, and all animations |
| `api.js` | Thin API client — sends a `POST /diagnose` request to the Flask backend and returns the JSON response. Handles network errors gracefully |
| `script.js` | Core controller — manages the multi-step form (step navigation with GSAP transitions), collects all inputs into a **flat boolean payload**, calls `api.js`, and renders the full diagnostic results (urgency card, confidence bar, severity meter, explanation panel, emergency mode) |
| `heart3d.js` | Three.js module (~29 KB) — loads the `.glb` heart model, sets up cinematic lighting (5 lights), scroll-driven position/rotation states per section, blood flow particle system, diagnostic scan effect, and **severity-reactive presets** (pulse speed, emissive glow, vibration, fog density for LOW → CRITICAL) |
| `intro.js` | Orchestrates the fullscreen intro sequence — loading animation, model readiness detection, and click-to-enter transition |
| `particles.js` | Canvas-based interactive particle background — follows mouse movement for ambient atmosphere |
| `cursor.js` | Custom cursor with glow trail effect for a premium feel |
| `scroll-effects.js` | IntersectionObserver-based scroll reveal animations and sticky section detection |

#### Data Flow (Frontend Side)

```
User checks symptoms/vitals/background
         │
         ▼
  collectPatientData()          ← script.js
  Iterates ALL checkboxes → flat { name: true/false } object
  Converts age radio → 3 separate boolean fields
         │
         ▼
  diagnose(payload)             ← api.js
  POST http://localhost:5000/diagnose
  Content-Type: application/json
         │
         ▼
  renderResults(response)       ← script.js
  Populates: urgency card, disease name, recommendation,
  confidence bar (animated), severity meter, explanation panel
         │
         ▼
  CustomEvent("diagnosisResult") dispatched
         │
         ▼
  heart3d.js receives event → applies severity preset
  (pulsing, glow, vibration, fog, blood flow speed)
```

#### 3D Heart — Reactive Behavior

The 3D heart model dynamically reacts to the diagnosis urgency level:

| Urgency | Pulse Speed | Emissive Glow | Vibration | Blood Flow | Fog Density |
|:--------|:------------|:-------------|:----------|:-----------|:------------|
| **IDLE** | 0x | None | None | 0.1x | Normal |
| **LOW** | 0.5x | Subtle | None | 0.2x | Light |
| **MODERATE** | 1.0x | Mild | Micro | 0.4x | Medium |
| **HIGH** | 1.5x | Strong | Visible | 0.7x | Dense |
| **CRITICAL** | 3.0x | Intense red | Heavy | 1.2x | Heavy red |

On `CRITICAL`, the system also activates **"Inside the Body" mode** — the camera zooms into the heart with blur effects and intensified lighting.

---

### ⚙️ Backend — Deep Dive

The backend is a **Python Flask REST API** powered by the **Experta** library (a Python port of CLIPS). It contains the **entire Knowledge Base**, the **Inference Engine**, and all **Certainty Factor logic**. The frontend never performs any medical reasoning.

#### Architecture Layers

```
Flask REST API (app.py)
    │
    ├── Field Mapping: Translates frontend field names → engine field names
    │     e.g., "bp_ge_180" → "bp_gte_180", "age_ge_60" → "age_gt_60"
    │
    ├── Category Router: Assigns each field to symptoms / vitals / background
    │
    ▼
Runner / Orchestrator (runner.py)
    │
    ├── Creates a fresh CardKnowlogyEngine instance
    ├── Declares Experta Facts (Symptom, Vital, Background)
    │     with predefined CF values from cf_config.py
    ├── Calls engine.run() → Forward Chaining begins
    └── Returns engine.get_results()
    │
    ▼
CardKnowlogy Engine (cardknowlogy.py)
    │
    ├── Inherits 10 Rule Mixins + OutputRule + KnowledgeEngine
    ├── 71 Production Rules (R0–R70)
    ├── CF Combination: CF_combined = CF_old + CF_new - (CF_old × CF_new)
    ├── Salience-based conflict resolution (simulates LEX strategy)
    └── Collects: diseases_cf, urgencies, recommendations, fired_rules
```

#### Fact Types (Working Memory)

The system operates on six fact classes defined in `facts.py`:

| Fact Class | Fields | Purpose |
|:-----------|:-------|:--------|
| `Symptom` | `name`, `value`, `cf` | Clinical symptom presence (e.g., chest pain) |
| `Vital` | `name`, `value`, `cf` | Vital sign threshold status (e.g., BP ≥ 180) |
| `Background` | `name`, `value`, `cf` | Medical history / demographics (e.g., diabetes) |
| `Disease` | `name`, `cf` | **Inferred** condition — declared by disease rules |
| `Urgency` | `level` | Triage classification (CRITICAL/HIGH/MODERATE/LOW) |
| `Recommendation` | `text` | Clinical action recommendation |

> The first three (`Symptom`, `Vital`, `Background`) are declared from user inputs.
> The last three (`Disease`, `Urgency`, `Recommendation`) are **inferred by the engine** through forward chaining.

#### Rule Structure (Example — R1)

Each production rule follows this pattern:

```python
# R1: shortness_of_breath AND orthopnea AND edema → ADHF (CF=0.90)
@Rule(
    Symptom(name="shortness_of_breath", value=True),
    Symptom(name="orthopnea", value=True),
    Symptom(name="edema", value=True),
    salience=13,  # Priority: 10 (base) + 3 (conditions)
)
def r1_adhf(self):
    cfs = [
        self._get_cf("shortness_of_breath"),  # 0.80
        self._get_cf("orthopnea"),             # 0.85
        self._get_cf("edema"),                 # 0.75
    ]
    cf_rule = 0.90 * min(cfs)   # 0.90 × 0.75 = 0.675
    self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R1",
                         ["shortness_of_breath", "orthopnea", "edema"])
```

**Key details:**
- **Salience** = priority for conflict resolution (higher fires first)
- **CF computation** = `rule_CF × min(antecedent_CFs)`
- **CF combination** — when multiple rules infer the same disease:
  `CF_combined = CF_old + CF_new − (CF_old × CF_new)`

#### Rule Modules (10 Conditions)

| Module | Rules | Condition | Urgency |
|:-------|:------|:----------|:--------|
| `rules_adhf.py` | R1–R11 | Acute Decompensated Heart Failure | HIGH |
| `rules_chf.py` | R12–R19 | Chronic Heart Failure | MODERATE–HIGH |
| `rules_hfpef.py` | R20–R26 | HF with Preserved Ejection Fraction | MODERATE |
| `rules_mi.py` | R27–R36 | Myocardial Infarction | CRITICAL |
| `rules_acs.py` | R37–R42 | Acute Coronary Syndrome | HIGH–CRITICAL |
| `rules_angina.py` | R43–R47 | Stable & Unstable Angina | LOW–MODERATE |
| `rules_hypertensive.py` | R48–R53 | Hypertensive Crisis / Emergency | HIGH–CRITICAL |
| `rules_afib.py` | R54–R59 | Atrial Fibrillation | MODERATE–HIGH |
| `rules_sca.py` | R60–R65 | Sudden Cardiac Arrest | CRITICAL |
| `rules_shock.py` | R66–R70 | Cardiogenic Shock | CRITICAL |
| `rules_output.py` | R0 | Output aggregation trigger | — |

#### Certainty Factor Configuration

All CF values are **static and predefined** in `cf_config.py` — the user never provides or modifies CFs:

```python
SYMPTOM_CF = {
    "chest_pain":          0.90,   # High diagnostic weight
    "syncope":             0.95,   # Very high — fainting is critical
    "shortness_of_breath": 0.80,
    "low_activity":        0.55,   # Lower weight — non-specific
    ...
}
```

Three separate dictionaries (`SYMPTOM_CF`, `VITAL_CF`, `BACKGROUND_CF`) are merged into `ALL_CF` for unified lookup during rule execution.

#### API Endpoints

| Method | Endpoint | Description |
|:-------|:---------|:------------|
| `POST` | `/diagnose` | **Primary** — accepts flat boolean JSON, returns diagnosis |
| `POST` | `/api/diagnose` | Legacy — accepts categorized JSON (`{symptoms, vitals, background}`) |
| `GET` | `/api/inputs` | Returns full input schema with CF values and descriptions |
| `GET` | `/api/health` | Health check — returns system status and version |

#### Inference Pipeline (End-to-End)

```
1. Frontend sends flat JSON → POST /diagnose
2. app.py translates field names (FIELD_MAP) and categorizes inputs
3. runner.py creates engine, declares facts with CFs into Working Memory
4. engine.run() triggers Forward Chaining:
   a. Match rules against Working Memory
   b. Conflict Set → resolved by salience (LEX simulation)
   c. Fire highest-priority rule → may declare new Disease facts
   d. New facts trigger more rules (chaining)
   e. Repeat until no more rules can fire
5. engine.get_results() selects primary disease (highest CF),
   its urgency, recommendation, and builds explanation trace
6. Flask returns JSON response to frontend
```

---

## 📥 Input Structure

The system accepts **three categories** of patient data, all as **boolean inputs**:

### A. Clinical Symptoms (10 inputs)

| Input | Description |
|:------|:------------|
| `shortness_of_breath` | Patient reports difficulty breathing |
| `orthopnea` | Difficulty breathing while lying down |
| `edema` | Swelling in legs/ankles |
| `chest_pain` | Chest pain present |
| `cough` | Persistent cough |
| `low_activity` | Reduced physical activity tolerance |
| `palpitations` | Irregular heartbeat sensation |
| `dizziness` | Experiencing dizziness |
| `syncope` | Fainting or near-fainting |
| `chest_tightness` | Sensation of chest tightness |

### B. Vital Signs (12 threshold-based boolean inputs)

| Input | Threshold | Severity |
|:------|:----------|:---------|
| `bp_ge_180` | Systolic BP ≥ 180 mmHg | 🔴 Critical |
| `bp_140_179` | Systolic BP 140–179 mmHg | 🟠 High |
| `bp_lt_90` | Systolic BP < 90 mmHg | 🔴 Critical |
| `hr_ge_120` | Heart Rate ≥ 120 bpm | 🔴 Critical |
| `hr_100_120` | Heart Rate 100–120 bpm | 🟠 High |
| `hr_lt_50` | Heart Rate < 50 bpm | 🔴 Critical |
| `rr_ge_22` | Respiratory Rate ≥ 22/min | 🟠 High |
| `spo2_lt_85` | SpO₂ < 85% | 🔴 Critical |
| `spo2_85_90` | SpO₂ 85–90% | 🟠 High |
| `spo2_90_94` | SpO₂ 90–94% | 🟡 Moderate |
| `hemoglobin_lt_10` | Hemoglobin < 10 g/dL | 🟠 High |
| `temp_ge_38` | Temperature ≥ 38°C | 🟡 Moderate |

### C. Background Information (7 checkboxes + 3 age radio options)

| Input | Description |
|:------|:------------|
| `hypertension` | History of hypertension |
| `diabetes` | History of diabetes |
| `heart_disease` | Known prior heart disease |
| `obesity` | BMI ≥ 30 |
| `previous_heart_attack` | Previous heart attack |
| `chronic_lung_disease` | COPD or similar |
| `kidney_disease` | Chronic kidney disease |
| `age_ge_60` | Age ≥ 60 years *(radio)* |
| `age_40_60` | Age 40–60 years *(radio)* |
| `age_lt_40` | Age < 40 years *(radio)* |

> [!NOTE]
> **Certainty Factors are NOT provided by the user.** All CF values are **predefined and static** in the backend configuration (`cf_config.py`). The user only provides boolean selections — the system internally assigns the appropriate CF to each input.

---

## 📤 Output

For every diagnosis, CardKnowlogy returns:

| Output | Description | Example |
|:-------|:------------|:--------|
| 🏷️ **Disease** | The primary inferred cardiac condition | `Acute Decompensated Heart Failure` |
| 🚨 **Urgency Level** | Four-tier triage classification | `CRITICAL` / `HIGH` / `MODERATE` / `LOW` |
| 💊 **Recommendation** | Actionable clinical recommendation | `Immediate hospitalization and IV diuretics required` |
| 📊 **Confidence Score** | Combined CF as a percentage (0–100%) | `92%` (Very High) |
| 🔍 **Explanation** | Fired rules, key facts, and all detected conditions | Transparent reasoning chain |

### Confidence Level Interpretation

| Range | Level |
|:------|:------|
| ≥ 90% | 🟢 Very High |
| 75–89% | 🔵 High |
| 50–74% | 🟡 Moderate |
| < 50% | 🔴 Low |

---

## 🛠️ Technologies Used

### Frontend
| Technology | Purpose |
|:-----------|:--------|
| **HTML5** | Semantic page structure |
| **CSS3** | Styling, dark theme, glassmorphism, responsive design |
| **Vanilla JavaScript** | DOM manipulation, form logic, API communication |
| **[Three.js](https://threejs.org/) v0.163** | 3D heart model rendering, animations, and interactions |
| **[GSAP](https://gsap.com/) v3.12** | Smooth UI transitions, multi-step form animations |
| **[Inter + Orbitron](https://fonts.google.com/)** | Modern typography (Google Fonts) |

### Backend
| Technology | Purpose |
|:-----------|:--------|
| **Python 3.10+** | Backend runtime |
| **[Flask](https://flask.palletsprojects.com/) ≥ 3.0** | REST API framework |
| **[Flask-CORS](https://flask-cors.readthedocs.io/) ≥ 4.0** | Cross-origin request handling |
| **[Experta](https://experta.readthedocs.io/) ≥ 1.9.4** | Rule-based expert system engine (CLIPS-inspired) |
| **frozendict 1.2** | Immutable dictionary support for Experta |

### Other
| Technology | Purpose |
|:-----------|:--------|
| **GLB/glTF** | 3D heart model format |
| **Web Audio API** | Heartbeat audio synchronization |
| **Canvas API** | Particle system background effects |

---

## 🚀 Installation & Setup

### Prerequisites

Ensure the following are installed on your system:

- **Python** 3.10 or higher — [Download Python](https://www.python.org/downloads/)
- **pip** (comes with Python)
- A modern web browser (Chrome, Firefox, Edge)
- A local HTTP server (VS Code Live Server, Python, or Node.js)

### Step 1 — Clone the Repository

```bash
git clone https://github.com/MElnaggaro/KBS-WEB.git
cd KBS-WEB
```

### Step 2 — Set Up the Backend

```bash
# Navigate to the backend directory
cd Backend

# Create a virtual environment (recommended)
python -m venv .venv

# Activate the virtual environment
# Linux / macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 3 — Start the Backend Server

```bash
# From the Backend/ directory
python app.py
```

The Flask API will start on `http://localhost:5000`

You should see output similar to:
```
 * Running on all addresses (0.0.0.0)
 * Running on http://127.0.0.1:5000
 * Running on http://localhost:5000
```

### Step 4 — Serve the Frontend

Open a **new terminal** and serve the frontend using any local HTTP server:

**Option A — VS Code Live Server** (recommended)
> Open `Frontend/index.html` in VS Code → Right click → "Open with Live Server"

**Option B — Python HTTP Server**
```bash
# From the project root (KBS-WEB/)
python -m http.server 8080
```
Then open: `http://localhost:8080/Frontend/index.html`

**Option C — Node.js HTTP Server**
```bash
npx -y http-server ./Frontend -p 8080
```
Then open: `http://localhost:8080`

> [!WARNING]
> You **must** use a local web server. Opening `index.html` directly via `file://` will cause CORS errors with the 3D model and API requests.

---

## 🔧 Environment Variables

The frontend API base URL is configured in `Frontend/JS/api.js`:

```javascript
const API_BASE_URL = "http://localhost:5000";
```

If your backend runs on a different host or port, update this value accordingly.

> No `.env` file is required for default local development.

---

## 📖 How to Use

1. **Launch** the application — experience the cinematic intro sequence
2. **Scroll** through the 3D heart showcase section
3. **Click** "Start Assessment" to begin the diagnostic form
4. **Step 1 — Symptoms:** Select all clinical symptoms the patient is experiencing
5. **Step 2 — Vitals:** Check all abnormal vital sign readings that apply
6. **Step 3 — Background:** Select relevant medical history and age group
7. **Submit** — Click "Analyze Patient Data"
8. **View Results** — See the diagnosis, urgency level, confidence score, and recommendation
9. **Explore** the "Explain Result" panel to view fired rules and reasoning chain
10. **Observe** the 3D heart model reacting dynamically to the diagnosis severity

---

## 💡 Example Scenario

### Input

A 65-year-old patient presents with the following:

| Category | Selections |
|:---------|:-----------|
| **Symptoms** | ✅ Shortness of breath · ✅ Orthopnea · ✅ Edema |
| **Vitals** | *(none abnormal)* |
| **Background** | ✅ Prior heart disease · 🔘 Age ≥ 60 years |

### Output

| Field | Result |
|:------|:-------|
| **Disease** | Chronic Heart Failure (CHF) |
| **Urgency** | 🟠 HIGH |
| **Recommendation** | Refer to cardiologist. Start standard CHF medication protocol. |
| **Confidence** | 96.27% (Very High) |
| **Fired Rules** | R3, R4, R7, R49, R50 |

### API Request

```bash
curl -X POST http://localhost:5000/diagnose \
  -H "Content-Type: application/json" \
  -d '{
    "shortness_of_breath": true,
    "orthopnea": true,
    "edema": true,
    "heart_disease": true,
    "age_ge_60": true
  }'
```

---

## 📂 Project Structure

```
KBS-WEB/
│
├── 📁 Frontend/                     # Client-side application
│   ├── index.html                   # Main entry point — cinematic UI + diagnostic form
│   ├── 📁 CSS/
│   │   └── style.css                # Complete design system — dark theme, glassmorphism
│   ├── 📁 JS/
│   │   ├── api.js                   # REST API client — communicates with Flask backend
│   │   ├── script.js                # Core app logic — form steps, result rendering
│   │   ├── heart3d.js               # Three.js 3D heart — model, animations, reactive states
│   │   ├── intro.js                 # Cinematic intro sequence orchestrator
│   │   ├── particles.js             # Interactive particle canvas background
│   │   ├── cursor.js                # Custom cursor with glow effects
│   │   └── scroll-effects.js        # Scroll-triggered animations & transitions
│   ├── 📁 assets/
│   │   └── 📁 audio/
│   │       └── heartbeat.mp3        # Heartbeat audio for reactive feedback
│   └── 📁 models/
│       └── heart.glb                # 3D heart model (glTF binary)
│
├── 📁 Backend/                      # Server-side expert system
│   ├── app.py                       # Flask REST API — endpoints & CORS config
│   ├── requirements.txt             # Python dependencies
│   ├── test_engine.py               # Engine test / demo script
│   └── 📁 engine/                   # Expert system core
│       ├── __init__.py
│       ├── cardknowlogy.py          # Main engine — assembles rules, CF combination, results
│       ├── runner.py                 # Orchestrator — bridges API ↔ Engine
│       ├── cf_config.py             # Static CF values for all 35 inputs
│       ├── facts.py                 # Experta fact definitions (Symptom, Vital, Background, etc.)
│       ├── rules_adhf.py            # Acute Decompensated Heart Failure rules
│       ├── rules_chf.py             # Chronic Heart Failure rules
│       ├── rules_hfpef.py           # HFpEF rules
│       ├── rules_mi.py              # Myocardial Infarction rules
│       ├── rules_acs.py             # Acute Coronary Syndrome rules
│       ├── rules_angina.py          # Stable & Unstable Angina rules
│       ├── rules_hypertensive.py    # Hypertensive Crisis rules
│       ├── rules_afib.py            # Atrial Fibrillation rules
│       ├── rules_sca.py             # Sudden Cardiac Arrest rules
│       ├── rules_shock.py           # Cardiogenic Shock rules
│       └── rules_output.py          # Output aggregation rule (R0)
│
└── README.md                        # 📄 You are here
```

---

## ⚠️ Limitations

- 🚫 **Not a medical device** — This system is for educational and demonstration purposes only. It must not be used for real clinical decision-making.
- 📐 **Rule-dependent** — Diagnosis quality is limited to the predefined 71 production rules. Edge cases or rare conditions may not be covered.
- 📦 **Fixed knowledge base** — The system does not learn or adapt. All rules and CF values are manually configured.
- 🔢 **Boolean-only inputs** — Vital signs are simplified to threshold categories rather than accepting continuous numeric values.
- 🌐 **No patient data persistence** — No database integration; each session is stateless.
- 🏥 **Limited to 10 cardiac conditions** — Does not cover the full spectrum of cardiovascular diseases.

---

## 🔮 Future Improvements

- 🤖 **Machine Learning Integration** — Train classification models on real clinical datasets to complement or enhance rule-based reasoning
- 📈 **Continuous Vital Sign Input** — Accept raw numeric values and perform threshold classification automatically
- 🗃️ **Patient History Database** — Store and retrieve past assessments for longitudinal tracking
- 🌍 **Multi-Language Support** — Internationalize the UI for broader accessibility
- 📱 **Mobile-Responsive Redesign** — Fully optimized mobile-first experience
- 🔬 **Expand Knowledge Base** — Add rules for additional cardiovascular and comorbid conditions
- 🩺 **FHIR / HL7 Integration** — Interoperate with Electronic Health Record systems
- 📊 **Analytics Dashboard** — Track diagnostic trends and system usage statistics

---

## 👥 Team Members

<table>
  <tr>
    <td align="center"><strong>MElnaggaro</strong><br/><sub>Lead Developer</sub></td>
  </tr>
</table>

---

## 📝 License

This project is intended for **academic and educational purposes**.

All rights reserved by the project authors. Unauthorized use for clinical or commercial applications is prohibited.

---

<p align="center">
  <strong>CardKnowlogy</strong> — Where Knowledge Meets Cardiology 🫀
</p>

<p align="center">
  <em>Built with ❤️ as a Knowledge-Based Systems (KBS) course project</em>
</p>
