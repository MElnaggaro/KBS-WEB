# CARDKNOWLOGY - Heart Failure Diagnosis Expert System

## Overview
Cardknowlogy is a futuristic, highly interactive, and cinematic web-based medical expert system designed to assist in the diagnosis of heart failure. Featuring a sophisticated, rule-based reasoning engine and an immersive 3D user interface, the application evaluates patient symptoms, vital signs, and medical history against clinical thresholds to provide an explainable AI-driven diagnosis with a calculated urgency level (Low, Moderate, High, Critical).

## Key Features

- **Interactive 3D Heart Model**: A responsive, high-fidelity 3D model of a human heart rendered using Three.js. It features scroll-driven animations, an exploded anatomical "Breakdown Mode", and reactive heartbeat pacing, blood flow, and emissive effects based on diagnostic urgency.
- **Cinematic Experience**: Immersive intro sequence, synchronized heartbeat audio-visuals, particle systems, dynamic ambient glowing, and a premium dark-themed minimalist design aesthetic.
- **Expert System Engine**: A forward-chaining rule-based engine built in pure JavaScript that processes patient inputs and provides categorized, reasoned medical insights.
- **Multi-Step Diagnostic Form**: A modern, split-step interactive form (Symptoms, Vitals, Background) guided smoothly with GSAP animations and real-time validation.
- **Urgency Representation**: The system delivers cohesive visual and auditory feedback corresponding to the diagnostic results (e.g., intense red glows and rapid audio heartbeats for critical conditions).

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **3D Graphics & Animations**: 
  - [Three.js](https://threejs.org/) for 3D model rendering and interactions.
  - [GSAP](https://gsap.com/) for fluid multi-step form transitions and UI animations.
- **Architecture**: Rule-based expert system logic (Forward-Chaining).

## Project Structure

```text
d:\KBS WEB
├── Frontend/
│   ├── index.html        # Main application entry point featuring the cinematic presentation and form
│   ├── CSS/              # Application styling, dark theme, and glassmorphism utilities
│   │   └── style.css
│   ├── JS/               # Core logic and system functions
│   │   ├── expert-engine.js  # Medical diagnostic rule-base and reasoning engine
│   │   ├── heart3d.js        # Three.js 3D model initialization, breakdown mode, and interactivity
│   │   ├── intro.js          # Intro sequence cinematic orchestrator
│   │   ├── particles.js      # Background and ambient particle systems
│   │   ├── script.js         # DOM manipulation, multi-step form logic, audio syncing
│   │   └── scroll-effects.js # Sticky headers and scroll-triggered transitions
│   ├── assets/           # Audio files, icons, fonts, and images
│   └── models/           # 3D assets for the heart model
```

## Setup & Running Locally

1. Clone or download the repository and navigate to the project folder.
2. Since this project loads 3D models and local assets, you must run it via a local web server to avoid CORS issues.
3. You can use tools like:
   - **VS Code Live Server Extension**
   - **Python Simple HTTP Server**:
     ```bash
     python -m http.server 8000
     ```
   - **Node `http-server`**:
     ```bash
     npx http-server
     ```
4. Open the displayed local address (e.g., `http://localhost:8000/Frontend/index.html` or `http://127.0.0.1:8000/Frontend/index.html` depending on your server setup) in a modern web browser.

## Usage Guide

1. **Launch**: On load, you will experience the cinematic intro sequence.
2. **Explore**: Scroll down to view the 3D heart's scroll-linked breakdown mode.
3. **Assess**: Click "Start Assessment" to begin the diagnosis. The 3D heart model will undergo a dynamic transition.
4. **Input Data**: Flow through the form steps, providing plausible Symptoms, Vitals, and Medical History details.
5. **Analyze Result**: Submit the diagnosis to view the computed urgency level and the detailed reasoning output. Observe the 3D heart dynamically reacting to the severity of the resulting diagnosis.

## Disclaimer

**Educational / Demonstration Purposes Only**: Cardknowlogy is a conceptual demonstration of a medical expert system. It is not a certified medical device or diagnostic tool. The rules, logic, and thresholds used are for demonstration and project purposes and should never be used as clinical medical advice.
