"""
CardKnowlogy — Acute Myocardial Infarction (MI) Rules (R25–R34)

R25–R32:  Disease inference rules
R33:      Urgency rule
R34:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Background, Disease


class MIRules:
    """Mixin: Acute Myocardial Infarction rules."""

    # ── R25: chest_pain AND chest_tightness AND shortness_of_breath → MI (CF=0.95) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Symptom(name="chest_tightness", value=True),
        Symptom(name="shortness_of_breath", value=True),
        salience=13,
    )
    def r25_mi(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("chest_tightness"),
            self._get_cf("shortness_of_breath"),
        ]
        cf_rule = 0.95 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R25",
                             ["chest_pain", "chest_tightness", "shortness_of_breath"])

    # ── R26: chest_pain AND hr_100_120 AND spo2_90_94 → MI (CF=0.93) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Vital(name="hr_100_120", value=True),
        Vital(name="spo2_90_94", value=True),
        salience=13,
    )
    def r26_mi(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("hr_100_120"),
            self._get_cf("spo2_90_94"),
        ]
        cf_rule = 0.93 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R26",
                             ["chest_pain", "hr_100_120", "spo2_90_94"])

    # ── R27: chest_pain AND diabetes AND hypertension → MI (CF=0.88) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Background(name="diabetes", value=True),
        Background(name="hypertension", value=True),
        salience=13,
    )
    def r27_mi(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("diabetes"),
            self._get_cf("hypertension"),
        ]
        cf_rule = 0.88 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R27",
                             ["chest_pain", "diabetes", "hypertension"])

    # ── R28: chest_pain AND previous_heart_attack → MI (CF=0.92) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Background(name="previous_heart_attack", value=True),
        salience=12,
    )
    def r28_mi(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("previous_heart_attack"),
        ]
        cf_rule = 0.92 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R28",
                             ["chest_pain", "previous_heart_attack"])

    # ── R29: chest_pain AND syncope → MI (CF=0.94) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Symptom(name="syncope", value=True),
        salience=12,
    )
    def r29_mi(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("syncope"),
        ]
        cf_rule = 0.94 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R29",
                             ["chest_pain", "syncope"])

    # ── R30: ACS AND hr_gt_120 → MI (CF=0.85) ──
    #    (Chained: requires ACS to be inferred first; hr_gt_120 used for > 110)
    @Rule(
        Disease(name="Acute Coronary Syndrome"),
        Vital(name="hr_gt_120", value=True),
        salience=10,
    )
    def r30_mi(self):
        cfs = [
            self.diseases_cf.get("Acute Coronary Syndrome", 0.5),
            self._get_cf("hr_gt_120"),
        ]
        cf_rule = 0.85 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R30",
                             ["Acute Coronary Syndrome (inferred)", "hr_gt_120"])

    # ── R31: ACS AND chest_pain AND syncope → MI (CF=0.90) ──
    @Rule(
        Disease(name="Acute Coronary Syndrome"),
        Symptom(name="chest_pain", value=True),
        Symptom(name="syncope", value=True),
        salience=11,
    )
    def r31_mi(self):
        cfs = [
            self.diseases_cf.get("Acute Coronary Syndrome", 0.5),
            self._get_cf("chest_pain"),
            self._get_cf("syncope"),
        ]
        cf_rule = 0.90 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R31",
                             ["Acute Coronary Syndrome (inferred)", "chest_pain", "syncope"])

    # ── R32: Hypertensive Emergency AND chest_pain AND shortness_of_breath → MI (CF=0.88) ──
    @Rule(
        Disease(name="Hypertensive Emergency"),
        Symptom(name="chest_pain", value=True),
        Symptom(name="shortness_of_breath", value=True),
        salience=11,
    )
    def r32_mi(self):
        cfs = [
            self.diseases_cf.get("Hypertensive Emergency", 0.5),
            self._get_cf("chest_pain"),
            self._get_cf("shortness_of_breath"),
        ]
        cf_rule = 0.88 * min(cfs)
        self._assert_disease("Acute Myocardial Infarction", cf_rule, "R32",
                             ["Hypertensive Emergency (inferred)", "chest_pain", "shortness_of_breath"])

    # ── R33: MI → Urgency = CRITICAL ──
    @Rule(
        Disease(name="Acute Myocardial Infarction"),
        salience=5,
    )
    def r33_mi_urgency(self):
        self._assert_urgency("Acute Myocardial Infarction", "CRITICAL", "R33")

    # ── R34: MI → Recommendation ──
    @Rule(
        Disease(name="Acute Myocardial Infarction"),
        salience=4,
    )
    def r34_mi_recommendation(self):
        self._assert_recommendation(
            "Acute Myocardial Infarction",
            "Go to emergency room immediately and avoid physical activity",
            "R34",
        )
