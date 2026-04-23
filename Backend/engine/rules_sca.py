"""
CardKnowlogy — Sudden Cardiac Arrest Rules (R56–R62)

R56–R60:  Disease inference rules
R61:      Urgency rule
R62:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Vital, Disease


class SCARules:
    """Mixin: Sudden Cardiac Arrest rules."""

    # ── R56: syncope AND spo2_lt_85 → Sudden Cardiac Arrest (CF=0.98) ──
    @Rule(
        Symptom(name="syncope", value=True),
        Vital(name="spo2_lt_85", value=True),
        salience=12,
    )
    def r56_sca(self):
        cfs = [
            self._get_cf("syncope"),
            self._get_cf("spo2_lt_85"),
        ]
        cf_rule = 0.98 * min(cfs)
        self._assert_disease("Sudden Cardiac Arrest", cf_rule, "R56",
                             ["syncope", "spo2_lt_85"])

    # ── R57: syncope AND hr_lt_50 → Sudden Cardiac Arrest (CF=0.97) ──
    @Rule(
        Symptom(name="syncope", value=True),
        Vital(name="hr_lt_50", value=True),
        salience=12,
    )
    def r57_sca(self):
        cfs = [
            self._get_cf("syncope"),
            self._get_cf("hr_lt_50"),
        ]
        cf_rule = 0.97 * min(cfs)
        self._assert_disease("Sudden Cardiac Arrest", cf_rule, "R57",
                             ["syncope", "hr_lt_50"])

    # ── R58: MI AND syncope AND hr_lt_50 → Sudden Cardiac Arrest (CF=0.99) ──
    @Rule(
        Disease(name="Acute Myocardial Infarction"),
        Symptom(name="syncope", value=True),
        Vital(name="hr_lt_50", value=True),
        salience=11,
    )
    def r58_sca(self):
        cfs = [
            self.diseases_cf.get("Acute Myocardial Infarction", 0.5),
            self._get_cf("syncope"),
            self._get_cf("hr_lt_50"),
        ]
        cf_rule = 0.99 * min(cfs)
        self._assert_disease("Sudden Cardiac Arrest", cf_rule, "R58",
                             ["Acute Myocardial Infarction (inferred)", "syncope", "hr_lt_50"])

    # ── R59: ADHF AND spo2_lt_85 → Sudden Cardiac Arrest (CF=0.97) ──
    @Rule(
        Disease(name="Acute Decompensated Heart Failure"),
        Vital(name="spo2_lt_85", value=True),
        salience=10,
    )
    def r59_sca(self):
        cfs = [
            self.diseases_cf.get("Acute Decompensated Heart Failure", 0.5),
            self._get_cf("spo2_lt_85"),
        ]
        cf_rule = 0.97 * min(cfs)
        self._assert_disease("Sudden Cardiac Arrest", cf_rule, "R59",
                             ["Acute Decompensated Heart Failure (inferred)", "spo2_lt_85"])

    # ── R60: Cardiogenic Shock AND spo2_lt_85 → Sudden Cardiac Arrest (CF=0.97) ──
    @Rule(
        Disease(name="Cardiogenic Shock"),
        Vital(name="spo2_lt_85", value=True),
        salience=10,
    )
    def r60_sca(self):
        cfs = [
            self.diseases_cf.get("Cardiogenic Shock", 0.5),
            self._get_cf("spo2_lt_85"),
        ]
        cf_rule = 0.97 * min(cfs)
        self._assert_disease("Sudden Cardiac Arrest", cf_rule, "R60",
                             ["Cardiogenic Shock (inferred)", "spo2_lt_85"])

    # ── R61: Sudden Cardiac Arrest → Urgency = CRITICAL ──
    @Rule(
        Disease(name="Sudden Cardiac Arrest"),
        salience=5,
    )
    def r61_sca_urgency(self):
        self._assert_urgency("Sudden Cardiac Arrest", "CRITICAL", "R61")

    # ── R62: Sudden Cardiac Arrest → Recommendation ──
    @Rule(
        Disease(name="Sudden Cardiac Arrest"),
        salience=4,
    )
    def r62_sca_recommendation(self):
        self._assert_recommendation(
            "Sudden Cardiac Arrest",
            "Call emergency services immediately and start CPR if trained",
            "R62",
        )
