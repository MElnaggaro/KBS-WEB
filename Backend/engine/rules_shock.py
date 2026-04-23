"""
CardKnowlogy — Cardiogenic Shock Rules (R63–R70)

R63–R68:  Disease inference rules
R69:      Urgency rule
R70:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Disease


class ShockRules:
    """Mixin: Cardiogenic Shock rules."""

    # ── R63: bp_lt_90 AND hr_gt_120 → Cardiogenic Shock (CF=0.95) ──
    @Rule(
        Vital(name="bp_lt_90", value=True),
        Vital(name="hr_gt_120", value=True),
        salience=12,
    )
    def r63_shock(self):
        cfs = [
            self._get_cf("bp_lt_90"),
            self._get_cf("hr_gt_120"),
        ]
        cf_rule = 0.95 * min(cfs)
        self._assert_disease("Cardiogenic Shock", cf_rule, "R63",
                             ["bp_lt_90", "hr_gt_120"])

    # ── R64: spo2_lt_85 AND bp_lt_90 → Cardiogenic Shock (CF=0.97) ──
    @Rule(
        Vital(name="spo2_lt_85", value=True),
        Vital(name="bp_lt_90", value=True),
        salience=12,
    )
    def r64_shock(self):
        cfs = [
            self._get_cf("spo2_lt_85"),
            self._get_cf("bp_lt_90"),
        ]
        cf_rule = 0.97 * min(cfs)
        self._assert_disease("Cardiogenic Shock", cf_rule, "R64",
                             ["spo2_lt_85", "bp_lt_90"])

    # ── R65: ADHF AND bp_lt_90 → Cardiogenic Shock (CF=0.94) ──
    @Rule(
        Disease(name="Acute Decompensated Heart Failure"),
        Vital(name="bp_lt_90", value=True),
        salience=10,
    )
    def r65_shock(self):
        cfs = [
            self.diseases_cf.get("Acute Decompensated Heart Failure", 0.5),
            self._get_cf("bp_lt_90"),
        ]
        cf_rule = 0.94 * min(cfs)
        self._assert_disease("Cardiogenic Shock", cf_rule, "R65",
                             ["Acute Decompensated Heart Failure (inferred)", "bp_lt_90"])

    # ── R66: MI AND bp_lt_90 → Cardiogenic Shock (CF=0.96) ──
    @Rule(
        Disease(name="Acute Myocardial Infarction"),
        Vital(name="bp_lt_90", value=True),
        salience=10,
    )
    def r66_shock(self):
        cfs = [
            self.diseases_cf.get("Acute Myocardial Infarction", 0.5),
            self._get_cf("bp_lt_90"),
        ]
        cf_rule = 0.96 * min(cfs)
        self._assert_disease("Cardiogenic Shock", cf_rule, "R66",
                             ["Acute Myocardial Infarction (inferred)", "bp_lt_90"])

    # ── R67: ADHF AND spo2_85_90 → Cardiogenic Shock (CF=0.93) ──
    @Rule(
        Disease(name="Acute Decompensated Heart Failure"),
        Vital(name="spo2_85_90", value=True),
        salience=10,
    )
    def r67_shock(self):
        cfs = [
            self.diseases_cf.get("Acute Decompensated Heart Failure", 0.5),
            self._get_cf("spo2_85_90"),
        ]
        cf_rule = 0.93 * min(cfs)
        self._assert_disease("Cardiogenic Shock", cf_rule, "R67",
                             ["Acute Decompensated Heart Failure (inferred)", "spo2_85_90"])

    # ── R68: Atrial Fibrillation AND hr_gt_120 AND dizziness → Cardiogenic Shock (CF=0.90) ──
    @Rule(
        Disease(name="Atrial Fibrillation"),
        Vital(name="hr_gt_120", value=True),
        Symptom(name="dizziness", value=True),
        salience=11,
    )
    def r68_shock(self):
        cfs = [
            self.diseases_cf.get("Atrial Fibrillation", 0.5),
            self._get_cf("hr_gt_120"),
            self._get_cf("dizziness"),
        ]
        cf_rule = 0.90 * min(cfs)
        self._assert_disease("Cardiogenic Shock", cf_rule, "R68",
                             ["Atrial Fibrillation (inferred)", "hr_gt_120", "dizziness"])

    # ── R69: Cardiogenic Shock → Urgency = CRITICAL ──
    @Rule(
        Disease(name="Cardiogenic Shock"),
        salience=5,
    )
    def r69_shock_urgency(self):
        self._assert_urgency("Cardiogenic Shock", "CRITICAL", "R69")

    # ── R70: Cardiogenic Shock → Recommendation ──
    @Rule(
        Disease(name="Cardiogenic Shock"),
        salience=4,
    )
    def r70_shock_recommendation(self):
        self._assert_recommendation(
            "Cardiogenic Shock",
            "Immediate emergency care required; patient in shock",
            "R70",
        )
