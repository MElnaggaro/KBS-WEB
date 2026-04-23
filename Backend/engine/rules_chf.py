"""
CardKnowlogy — Chronic Heart Failure (Stable) Rules (R12–R18)

R12–R16:  Disease inference rules
R17:      Urgency rule
R18:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Background, Disease


class CHFRules:
    """Mixin: Chronic Heart Failure (CHF) rules."""

    # ── R12: shortness_of_breath AND low_activity AND edema → CHF (CF=0.80) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Symptom(name="low_activity", value=True),
        Symptom(name="edema", value=True),
        salience=13,
    )
    def r12_chf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("low_activity"),
            self._get_cf("edema"),
        ]
        cf_rule = 0.80 * min(cfs)
        self._assert_disease("Chronic Heart Failure", cf_rule, "R12",
                             ["shortness_of_breath", "low_activity", "edema"])

    # ── R13: shortness_of_breath AND hypertension AND low_activity → CHF (CF=0.78) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Background(name="hypertension", value=True),
        Symptom(name="low_activity", value=True),
        salience=13,
    )
    def r13_chf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("hypertension"),
            self._get_cf("low_activity"),
        ]
        cf_rule = 0.78 * min(cfs)
        self._assert_disease("Chronic Heart Failure", cf_rule, "R13",
                             ["shortness_of_breath", "hypertension", "low_activity"])

    # ── R14: edema AND age_gt_60 AND hypertension → CHF (CF=0.82) ──
    @Rule(
        Symptom(name="edema", value=True),
        Background(name="age_gt_60", value=True),
        Background(name="hypertension", value=True),
        salience=13,
    )
    def r14_chf(self):
        cfs = [
            self._get_cf("edema"),
            self._get_cf("age_gt_60"),
            self._get_cf("hypertension"),
        ]
        cf_rule = 0.82 * min(cfs)
        self._assert_disease("Chronic Heart Failure", cf_rule, "R14",
                             ["edema", "age_gt_60", "hypertension"])

    # ── R15: edema AND kidney_disease AND hypertension → CHF (CF=0.80) ──
    @Rule(
        Symptom(name="edema", value=True),
        Background(name="kidney_disease", value=True),
        Background(name="hypertension", value=True),
        salience=13,
    )
    def r15_chf(self):
        cfs = [
            self._get_cf("edema"),
            self._get_cf("kidney_disease"),
            self._get_cf("hypertension"),
        ]
        cf_rule = 0.80 * min(cfs)
        self._assert_disease("Chronic Heart Failure", cf_rule, "R15",
                             ["edema", "kidney_disease", "hypertension"])

    # ── R16: shortness_of_breath AND hemoglobin_lt_10 → CHF (CF=0.70) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Vital(name="hemoglobin_lt_10", value=True),
        salience=12,
    )
    def r16_chf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("hemoglobin_lt_10"),
        ]
        cf_rule = 0.70 * min(cfs)
        self._assert_disease("Chronic Heart Failure", cf_rule, "R16",
                             ["shortness_of_breath", "hemoglobin_lt_10"])

    # ── R17: CHF → Urgency = MODERATE ──
    @Rule(
        Disease(name="Chronic Heart Failure"),
        salience=5,
    )
    def r17_chf_urgency(self):
        self._assert_urgency("Chronic Heart Failure", "MODERATE", "R17")

    # ── R18: CHF → Recommendation ──
    @Rule(
        Disease(name="Chronic Heart Failure"),
        salience=4,
    )
    def r18_chf_recommendation(self):
        self._assert_recommendation(
            "Chronic Heart Failure",
            "Follow up with doctor and maintain medication compliance",
            "R18",
        )
