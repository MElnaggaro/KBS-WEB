"""
CardKnowlogy — Heart Failure with Preserved EF (HFpEF) Rules (R19–R24)

R19–R22:  Disease inference rules
R23:      Urgency rule
R24:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Background, Disease


class HFpEFRules:
    """Mixin: Heart Failure with Preserved Ejection Fraction (HFpEF) rules."""

    # ── R19: shortness_of_breath AND hypertension AND age_gt_60 → HFpEF (CF=0.82) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Background(name="hypertension", value=True),
        Background(name="age_gt_60", value=True),
        salience=13,
    )
    def r19_hfpef(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("hypertension"),
            self._get_cf("age_gt_60"),
        ]
        cf_rule = 0.82 * min(cfs)
        self._assert_disease("HFpEF", cf_rule, "R19",
                             ["shortness_of_breath", "hypertension", "age_gt_60"])

    # ── R20: shortness_of_breath AND obesity AND hypertension → HFpEF (CF=0.80) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Background(name="obesity", value=True),
        Background(name="hypertension", value=True),
        salience=13,
    )
    def r20_hfpef(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("obesity"),
            self._get_cf("hypertension"),
        ]
        cf_rule = 0.80 * min(cfs)
        self._assert_disease("HFpEF", cf_rule, "R20",
                             ["shortness_of_breath", "obesity", "hypertension"])

    # ── R21: shortness_of_breath AND diabetes AND age_40_60 → HFpEF (CF=0.78) ──
    #    (age_40_60 used as proxy for age > 55)
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Background(name="diabetes", value=True),
        Background(name="age_40_60", value=True),
        salience=13,
    )
    def r21_hfpef(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("diabetes"),
            self._get_cf("age_40_60"),
        ]
        cf_rule = 0.78 * min(cfs)
        self._assert_disease("HFpEF", cf_rule, "R21",
                             ["shortness_of_breath", "diabetes", "age_40_60"])

    # ── R22: edema AND hypertension AND age_gt_60 → HFpEF (CF=0.83) ──
    @Rule(
        Symptom(name="edema", value=True),
        Background(name="hypertension", value=True),
        Background(name="age_gt_60", value=True),
        salience=13,
    )
    def r22_hfpef(self):
        cfs = [
            self._get_cf("edema"),
            self._get_cf("hypertension"),
            self._get_cf("age_gt_60"),
        ]
        cf_rule = 0.83 * min(cfs)
        self._assert_disease("HFpEF", cf_rule, "R22",
                             ["edema", "hypertension", "age_gt_60"])

    # ── R23: HFpEF → Urgency = MODERATE ──
    @Rule(
        Disease(name="HFpEF"),
        salience=5,
    )
    def r23_hfpef_urgency(self):
        self._assert_urgency("HFpEF", "MODERATE", "R23")

    # ── R24: HFpEF → Recommendation ──
    @Rule(
        Disease(name="HFpEF"),
        salience=4,
    )
    def r24_hfpef_recommendation(self):
        self._assert_recommendation(
            "HFpEF",
            "Control blood pressure and schedule cardiology follow-up",
            "R24",
        )
