"""
CardKnowlogy — Atrial Fibrillation Rules (R51–R55)

R51–R53:  Disease inference rules
R54:      Urgency rule
R55:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Disease


class AFibRules:
    """Mixin: Atrial Fibrillation rules."""

    # ── R51: palpitations AND hr_100_120 → Atrial Fibrillation (CF=0.85) ──
    @Rule(
        Symptom(name="palpitations", value=True),
        Vital(name="hr_100_120", value=True),
        salience=12,
    )
    def r51_afib(self):
        cfs = [
            self._get_cf("palpitations"),
            self._get_cf("hr_100_120"),
        ]
        cf_rule = 0.85 * min(cfs)
        self._assert_disease("Atrial Fibrillation", cf_rule, "R51",
                             ["palpitations", "hr_100_120"])

    # ── R52: palpitations AND dizziness AND hr_gt_120 → Atrial Fibrillation (CF=0.88) ──
    @Rule(
        Symptom(name="palpitations", value=True),
        Symptom(name="dizziness", value=True),
        Vital(name="hr_gt_120", value=True),
        salience=13,
    )
    def r52_afib(self):
        cfs = [
            self._get_cf("palpitations"),
            self._get_cf("dizziness"),
            self._get_cf("hr_gt_120"),
        ]
        cf_rule = 0.88 * min(cfs)
        self._assert_disease("Atrial Fibrillation", cf_rule, "R52",
                             ["palpitations", "dizziness", "hr_gt_120"])

    # ── R53: palpitations AND syncope → Atrial Fibrillation (CF=0.90) ──
    @Rule(
        Symptom(name="palpitations", value=True),
        Symptom(name="syncope", value=True),
        salience=12,
    )
    def r53_afib(self):
        cfs = [
            self._get_cf("palpitations"),
            self._get_cf("syncope"),
        ]
        cf_rule = 0.90 * min(cfs)
        self._assert_disease("Atrial Fibrillation", cf_rule, "R53",
                             ["palpitations", "syncope"])

    # ── R54: Atrial Fibrillation → Urgency = MODERATE ──
    @Rule(
        Disease(name="Atrial Fibrillation"),
        salience=5,
    )
    def r54_afib_urgency(self):
        self._assert_urgency("Atrial Fibrillation", "MODERATE", "R54")

    # ── R55: Atrial Fibrillation → Recommendation ──
    @Rule(
        Disease(name="Atrial Fibrillation"),
        salience=4,
    )
    def r55_afib_recommendation(self):
        self._assert_recommendation(
            "Atrial Fibrillation",
            "Consult cardiologist for heart rhythm management",
            "R55",
        )
