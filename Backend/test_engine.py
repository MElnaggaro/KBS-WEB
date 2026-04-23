
import sys
import json
sys.path.insert(0, '/home/elorgg/KKKK/KBS-WEB/Backend')

from engine.runner import run_diagnosis

print("=" * 70)
print("  DESIGN DOCUMENT EXAMPLE — CardKnowlogy Expert System")
print("=" * 70)
print()
print("Initial Facts (Working Memory):")
print("  F1: Heart disease      (CF = 0.85) - Oldest")
print("  F2: Edema              (CF = 0.75)")
print("  F3: Shortness of breath (CF = 0.80)")
print("  F4: Orthopnea          (CF = 0.85) - Newest")
print()
print("-" * 70)

inputs = {
    "symptoms": {
        "shortness_of_breath": True,
        "orthopnea": True,
        "edema": True,
    },
    "vitals": {},
    "background": {
        "heart_disease": True,
    },
}

result = run_diagnosis(inputs)

print()
print("  SYSTEM OUTPUT")
print("-" * 70)
print(f"  Inferred Disease  : {result['primary_disease']}")
print(f"  Confidence (CF)   : {result['confidence']}")
print(f"  Confidence Level  : {result['confidence_level']}")
print(f"  Urgency Level     : {result['urgency']}")
print(f"  Recommendation    : {result['recommendation']}")
print()
print("-" * 70)
print("  EXPLANATION")
print("-" * 70)
print(f"  Fired Rules       : {', '.join(result['explanation']['fired_rules'])}")
print(f"  Key Facts         :")
for fact in result['explanation']['key_facts']:
    print(f"    • {fact}")
print()
print(f"  All Conditions (PCS):")
for disease, cf in result['explanation']['all_conditions'].items():
    print(f"    • {disease}: CF = {cf}")
print()
print(f"  Clinical Notes    : {result['explanation']['clinical_notes']}")
print()
print("-" * 70)
print(f"  Disclaimer: {result['disclaimer']}")
print("=" * 70)
