"""
CardKnowlogy — Stable Angina Rules (R41–R44)

R41–R42:  Disease inference rules
R43:      Urgency rule
R44:      Recommendation rule
"""

from experta import Rule
from .facts import Symptom, Background, Disease


class AnginaRules:
    """Mixin: Stable Angina rules."""

    # ── R41: chest_pain AND low_activity AND heart_disease → Stable Angina (CF=0.80) ──
    @Rule(
        Symptom(name="chest_pain", value=True),
        Symptom(name="low_activity", value=True),
        Background(name="heart_disease", value=True),
        salience=13,
    )
    def r41_angina(self):
        cfs = [
            self._get_cf("chest_pain"),
            self._get_cf("low_activity"),
            self._get_cf("heart_disease"),
        ]
        cf_rule = 0.80 * min(cfs)
        self._assert_disease("Stable Angina", cf_rule, "R41",
                             ["chest_pain", "low_activity", "heart_disease"])

    # ── R42: chest_tightness AND age_40_60 → Stable Angina (CF=0.75) ──
    #    (age_40_60 used as proxy for age > 50)
    @Rule(
        Symptom(name="chest_tightness", value=True),
        Background(name="age_40_60", value=True),
        salience=12,
    )
    def r42_angina(self):
        cfs = [
            self._get_cf("chest_tightness"),
            self._get_cf("age_40_60"),
        ]
        cf_rule = 0.75 * min(cfs)
        self._assert_disease("Stable Angina", cf_rule, "R42",
                             ["chest_tightness", "age_40_60"])

    # ── R43: Stable Angina → Urgency = LOW ──
    @Rule(
        Disease(name="Stable Angina"),
        salience=5,
    )
    def r43_angina_urgency(self):
        self._assert_urgency("Stable Angina", "LOW", "R43")

    # ── R44: Stable Angina → Recommendation ──
    @Rule(
        Disease(name="Stable Angina"),
        salience=4,
    )
    def r44_angina_recommendation(self):
        self._assert_recommendation(
            "Stable Angina",
            "Rest and avoid exertion; schedule medical check-up",
            "R44",
        )
