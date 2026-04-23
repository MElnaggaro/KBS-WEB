"""
CardKnowlogy — Acute Decompensated Heart Failure Rules (R1–R11)

R1–R9:   Disease inference rules
R10:     Urgency rule
R11:     Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Background, Disease


class ADHFRules:
    """Mixin: Acute Decompensated Heart Failure (ADHF) rules."""

    # ── R1: shortness_of_breath AND orthopnea AND edema → ADHF (CF=0.90) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Symptom(name="orthopnea", value=True),
        Symptom(name="edema", value=True),
        salience=13,  # 10 + 3 conditions
    )
    def r1_adhf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("orthopnea"),
            self._get_cf("edema"),
        ]
        cf_rule = 0.90 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R1",
                             ["shortness_of_breath", "orthopnea", "edema"])

    # ── R2: shortness_of_breath AND edema AND spo2_90_94 → ADHF (CF=0.88) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Symptom(name="edema", value=True),
        Vital(name="spo2_90_94", value=True),
        salience=13,
    )
    def r2_adhf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("edema"),
            self._get_cf("spo2_90_94"),
        ]
        cf_rule = 0.88 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R2",
                             ["shortness_of_breath", "edema", "spo2_90_94"])

    # ── R3: orthopnea AND edema AND heart_disease → ADHF (CF=0.87) ──
    @Rule(
        Symptom(name="orthopnea", value=True),
        Symptom(name="edema", value=True),
        Background(name="heart_disease", value=True),
        salience=13,
    )
    def r3_adhf(self):
        cfs = [
            self._get_cf("orthopnea"),
            self._get_cf("edema"),
            self._get_cf("heart_disease"),
        ]
        cf_rule = 0.87 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R3",
                             ["orthopnea", "edema", "heart_disease"])

    # ── R4: shortness_of_breath AND rr_gt_22 AND edema → ADHF (CF=0.85) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Vital(name="rr_gt_22", value=True),
        Symptom(name="edema", value=True),
        salience=13,
    )
    def r4_adhf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("rr_gt_22"),
            self._get_cf("edema"),
        ]
        cf_rule = 0.85 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R4",
                             ["shortness_of_breath", "rr_gt_22", "edema"])

    # ── R5: shortness_of_breath AND cough AND edema → ADHF (CF=0.80) ──
    @Rule(
        Symptom(name="shortness_of_breath", value=True),
        Symptom(name="cough", value=True),
        Symptom(name="edema", value=True),
        salience=13,
    )
    def r5_adhf(self):
        cfs = [
            self._get_cf("shortness_of_breath"),
            self._get_cf("cough"),
            self._get_cf("edema"),
        ]
        cf_rule = 0.80 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R5",
                             ["shortness_of_breath", "cough", "edema"])

    # ── R6: Chronic Heart Failure AND spo2_85_90 → ADHF (CF=0.88) ──
    #    (Chained: requires CHF to be inferred first)
    @Rule(
        Disease(name="Chronic Heart Failure"),
        Vital(name="spo2_85_90", value=True),
        salience=10,  # 8 + 2 conditions (chained rule, lower base)
    )
    def r6_adhf(self):
        cfs = [
            self.diseases_cf.get("Chronic Heart Failure", 0.5),
            self._get_cf("spo2_85_90"),
        ]
        cf_rule = 0.88 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R6",
                             ["Chronic Heart Failure (inferred)", "spo2_85_90"])

    # ── R7: Hypertensive Emergency AND shortness_of_breath → ADHF (CF=0.82) ──
    @Rule(
        Disease(name="Hypertensive Emergency"),
        Symptom(name="shortness_of_breath", value=True),
        salience=10,
    )
    def r7_adhf(self):
        cfs = [
            self.diseases_cf.get("Hypertensive Emergency", 0.5),
            self._get_cf("shortness_of_breath"),
        ]
        cf_rule = 0.82 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R7",
                             ["Hypertensive Emergency (inferred)", "shortness_of_breath"])

    # ── R8: Dilated Cardiomyopathy AND edema AND shortness_of_breath → ADHF (CF=0.90) ──
    @Rule(
        Background(name="dilated_cardiomyopathy", value=True),
        Symptom(name="edema", value=True),
        Symptom(name="shortness_of_breath", value=True),
        salience=13,
    )
    def r8_adhf(self):
        cfs = [
            self._get_cf("dilated_cardiomyopathy"),
            self._get_cf("edema"),
            self._get_cf("shortness_of_breath"),
        ]
        cf_rule = 0.90 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R8",
                             ["dilated_cardiomyopathy", "edema", "shortness_of_breath"])

    # ── R9: Chronic Heart Failure AND shortness_of_breath AND edema → ADHF (CF=0.92) ──
    @Rule(
        Disease(name="Chronic Heart Failure"),
        Symptom(name="shortness_of_breath", value=True),
        Symptom(name="edema", value=True),
        salience=11,  # 8 + 3 conditions (chained)
    )
    def r9_adhf(self):
        cfs = [
            self.diseases_cf.get("Chronic Heart Failure", 0.5),
            self._get_cf("shortness_of_breath"),
            self._get_cf("edema"),
        ]
        cf_rule = 0.92 * min(cfs)
        self._assert_disease("Acute Decompensated Heart Failure", cf_rule, "R9",
                             ["Chronic Heart Failure (inferred)", "shortness_of_breath", "edema"])

    # ── R10: ADHF → Urgency = HIGH ──
    @Rule(
        Disease(name="Acute Decompensated Heart Failure"),
        salience=5,
    )
    def r10_adhf_urgency(self):
        self._assert_urgency("Acute Decompensated Heart Failure", "HIGH", "R10")

    # ── R11: ADHF → Recommendation ──
    @Rule(
        Disease(name="Acute Decompensated Heart Failure"),
        salience=4,
    )
    def r11_adhf_recommendation(self):
        self._assert_recommendation(
            "Acute Decompensated Heart Failure",
            "Seek urgent medical care and reduce fluid intake",
            "R11",
        )
