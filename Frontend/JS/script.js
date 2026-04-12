document.addEventListener('DOMContentLoaded', () => {
    
    // --- Navigation & Scrolling ---
    const startBtn = document.getElementById('start-btn');
    const assessmentSection = document.getElementById('assessment');
    const resultsSection = document.getElementById('results');
    const resetBtn = document.getElementById('reset-btn');

    startBtn.addEventListener('click', () => {
        assessmentSection.style.display = 'flex';
        // Add a tiny delay to allow display flex to apply before transitioning opacity
        setTimeout(() => {
            assessmentSection.classList.add('section-visible');
            assessmentSection.scrollIntoView({ behavior: 'smooth' });
        }, 50);
    });

    resetBtn.addEventListener('click', () => {
        document.getElementById('diagnosis-form').reset();
        resultsSection.classList.remove('section-visible');
        setTimeout(() => {
            resultsSection.style.display = 'none';
            assessmentSection.scrollIntoView({ behavior: 'smooth' });
            
            // Reset states
            const urgencyCard = document.getElementById('urgency-card');
            urgencyCard.className = 'result-card dramatic-reveal';
        }, 500);
    });

    // --- Diagnostic Logic Simulation ---
    const form = document.getElementById('diagnosis-form');
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // 1. Gather Data
        const data = {
            symptoms: {
                sob: document.getElementById('sym-sob').checked,
                cp: document.getElementById('sym-cp').checked,
                fatigue: document.getElementById('sym-fatigue').checked,
                edema: document.getElementById('sym-edema').checked,
            },
            vitals: {
                bp: document.getElementById('vital-bp').value,
                hr: parseInt(document.getElementById('vital-hr').value, 10),
                o2: parseInt(document.getElementById('vital-o2').value, 10)
            },
            background: {
                age: parseInt(document.getElementById('bg-age').value, 10),
                hypertension: document.querySelector('input[name="bg-ht"]:checked')?.value === 'yes',
                smoking: document.querySelector('input[name="bg-smoke"]:checked')?.value === 'yes'
            }
        };

        // 2. Mock Logic Rules
        let urgency = 'green'; // green, yellow, red
        let condition = 'Normal / Low Risk';
        let action = 'Routine follow-up';
        let explanation = 'Patient vitals and symptoms do not indicate acute cardiac distress. ';

        // Rules evaluation
        let symptomCount = Object.values(data.symptoms).filter(Boolean).length;

        // RED Rules: High Heart Rate + Chest Pain OR Severe O2 drop + Shortness of breath
        if ((data.vitals.hr > 100 && data.symptoms.cp) || (data.vitals.o2 < 92 && data.symptoms.sob)) {
            urgency = 'red';
            condition = 'Suspected Acute Heart Failure / Ischemia';
            action = 'IMMEDIATE EMERGENCY RESPONSE';
            explanation = 'Critical combination detected: ' + 
                          (data.symptoms.cp ? 'Chest pain paired with tachycardia. ' : 'Severe hypoxemia with dyspnea. ') +
                          'High probability of acute cardiac event requiring immediate medical intervention.';
        } 
        // YELLOW Rules: Elevated HR, Low O2, or multiple mild symptoms
        else if (data.vitals.hr > 90 || data.vitals.o2 < 95 || symptomCount >= 2 || data.background.hypertension) {
            urgency = 'yellow';
            condition = 'Elevated Risk / Compensated HF';
            action = 'Urgent Clinical Evaluation';
            explanation = 'Patient exhibits signs of potential cardiac stress. ' + 
                          (symptomCount >= 2 ? 'Multiple symptoms reported. ' : '') + 
                          (data.vitals.o2 < 95 ? 'Mild hypoxemia noted. ' : '') + 
                          'Requires urgent but non-emergency clinical review to rule out progressing failure.';
        }
        else {
             explanation += 'Vitals are within acceptable ranges for the reported age group. Continue standard health monitoring.';
        }

        // 3. Update DOM
        updateResultsPanel(urgency, condition, action, explanation);
    });

    function updateResultsPanel(urgency, condition, action, explanation) {
        const urgencyCard = document.getElementById('urgency-card');
        const urgencyValue = document.getElementById('urgency-value');
        const conditionValue = document.getElementById('condition-value');
        const actionValue = document.getElementById('action-value');
        const actionContainer = document.getElementById('action-container');
        const explanationText = document.getElementById('explanation-text');

        // Reset state
        urgencyCard.className = 'result-card'; // remove previous states
        
        // Set content
        urgencyValue.textContent = urgency.toUpperCase();
        conditionValue.textContent = condition;
        actionValue.textContent = action;
        explanationText.textContent = explanation;

        // Wait a frame, then apply new state and dramatic reveal animation
        requestAnimationFrame(() => {
            urgencyCard.classList.add(`state-${urgency}`);
            urgencyCard.classList.add('dramatic-reveal');
            urgencyCard.classList.add('reveal-animate');
            
            // Adjust action text color based on urgency
            if(urgency === 'red') actionValue.style.color = 'var(--urgency-red)';
            else if(urgency === 'yellow') actionValue.style.color = 'var(--urgency-yellow)';
            else actionValue.style.color = 'var(--urgency-green)';
        });

        // Show section
        resultsSection.style.display = 'flex';
        setTimeout(() => {
            resultsSection.classList.add('section-visible');
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 50);
    }
});
