"""
CardKnowlogy — Acute Coronary Syndrome (ACS) Rules (R35–R40)

R35–R38:  Disease inference rules
R39:      Urgency rule
R40:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Background, Disease


class ACSRules:
    """Mixin: Acute Coronary Syndrome (ACS) rules."""

    # ── R35: chest_pain AND shortness_of_breath → ACS (CF=0.85) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Symptom(name="shortness_of_breath", value=True),
        salience=12,
    )
    def r35_acs(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("shortness_of_breath"),
        ]
        cf_rule = 0.85 * min(cfs)
        self._assert_disease("Acute Coronary Syndrome", cf_rule, "R35",
                             ["chest_pain", "shortness_of_breath"])

    # ── R36: chest_tightness AND hr_100_120 → ACS (CF=0.80) ──
    @Rule(
        Symptom(name="chest_tightness", value=True),
        Vital(name="hr_100_120", value=True),
        salience=12,
    )
    def r36_acs(self):
        cfs = [
            self._get_cf("chest_tightness"),
            self._get_cf("hr_100_120"),
        ]
        cf_rule = 0.80 * min(cfs)
        self._assert_disease("Acute Coronary Syndrome", cf_rule, "R36",
                             ["chest_tightness", "hr_100_120"])

    # ── R37: chest_pain AND diabetes → ACS (CF=0.78) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Background(name="diabetes", value=True),
        salience=12,
    )
    def r37_acs(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("diabetes"),
        ]
        cf_rule = 0.78 * min(cfs)
        self._assert_disease("Acute Coronary Syndrome", cf_rule, "R37",
                             ["chest_pain", "diabetes"])

    # ── R38: chest_pain AND hypertension → ACS (CF=0.78) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Background(name="hypertension", value=True),
        salience=12,
    )
    def r38_acs(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("hypertension"),
        ]
        cf_rule = 0.78 * min(cfs)
        self._assert_disease("Acute Coronary Syndrome", cf_rule, "R38",
                             ["chest_pain", "hypertension"])

    # ── R39: ACS → Urgency = HIGH ──
    @Rule(
        Disease(name="Acute Coronary Syndrome"),
        salience=5,
    )
    def r39_acs_urgency(self):
        self._assert_urgency("Acute Coronary Syndrome", "HIGH", "R39")

    # ── R40: ACS → Recommendation ──
    @Rule(
        Disease(name="Acute Coronary Syndrome"),
        salience=4,
    )
    def r40_acs_recommendation(self):
        self._assert_recommendation(
            "Acute Coronary Syndrome",
            "Seek urgent evaluation to rule out heart attack",
            "R40",
        )
