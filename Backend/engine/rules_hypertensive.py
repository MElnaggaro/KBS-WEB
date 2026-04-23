"""
CardKnowlogy — Hypertensive Emergency Rules (R45–R50)

R45–R48:  Disease inference rules
R49:      Urgency rule
R50:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Background, Disease


class HypertensiveRules:
    """Mixin: Hypertensive Emergency rules."""

    # ── R45: bp_gte_180 AND chest_pain → Hypertensive Emergency (CF=0.92) ──
    @Rule(
        Vital(name="bp_gte_180", value=True),
        Symptom(name="chest_pain", value=True),
        salience=12,
    )
    def r45_hypertensive(self):
        cfs = [
            self._get_cf("bp_gte_180"),
            self._get_cf("chest_pain"),
        ]
        cf_rule = 0.92 * min(cfs)
        self._assert_disease("Hypertensive Emergency", cf_rule, "R45",
                             ["bp_gte_180", "chest_pain"])

    # ── R46: bp_gte_180 AND shortness_of_breath → Hypertensive Emergency (CF=0.90) ──
    @Rule(
        Vital(name="bp_gte_180", value=True),
        Symptom(name="shortness_of_breath", value=True),
        salience=12,
    )
    def r46_hypertensive(self):
        cfs = [
            self._get_cf("bp_gte_180"),
            self._get_cf("shortness_of_breath"),
        ]
        cf_rule = 0.90 * min(cfs)
        self._assert_disease("Hypertensive Emergency", cf_rule, "R46",
                             ["bp_gte_180", "shortness_of_breath"])

    # ── R47: bp_gte_180 AND syncope → Hypertensive Emergency (CF=0.95) ──
    @Rule(
        Vital(name="bp_gte_180", value=True),
        Symptom(name="syncope", value=True),
        salience=12,
    )
    def r47_hypertensive(self):
        cfs = [
            self._get_cf("bp_gte_180"),
            self._get_cf("syncope"),
        ]
        cf_rule = 0.95 * min(cfs)
        self._assert_disease("Hypertensive Emergency", cf_rule, "R47",
                             ["bp_gte_180", "syncope"])

    # ── R48: hypertension AND bp_gte_180 → Hypertensive Emergency (CF=0.93) ──
    @Rule(
        Background(name="hypertension", value=True),
        Vital(name="bp_gte_180", value=True),
        salience=12,
    )
    def r48_hypertensive(self):
        cfs = [
            self._get_cf("hypertension"),
            self._get_cf("bp_gte_180"),
        ]
        cf_rule = 0.93 * min(cfs)
        self._assert_disease("Hypertensive Emergency", cf_rule, "R48",
                             ["hypertension", "bp_gte_180"])

    # ── R49: Hypertensive Emergency → Urgency = HIGH ──
    @Rule(
        Disease(name="Hypertensive Emergency"),
        salience=5,
    )
    def r49_hypertensive_urgency(self):
        self._assert_urgency("Hypertensive Emergency", "HIGH", "R49")

    # ── R50: Hypertensive Emergency → Recommendation ──
    @Rule(
        Disease(name="Hypertensive Emergency"),
        salience=4,
    )
    def r50_hypertensive_recommendation(self):
        self._assert_recommendation(
            "Hypertensive Emergency",
            "Seek immediate medical care to control blood pressure",
            "R50",
        )
