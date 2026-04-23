"""
CardKnowlogy — Main Knowledge Engine

Assembles all rule mixins into a single KnowledgeEngine.
Provides helper methods for:
  - CF lookups
  - Disease assertion with CF combination
  - Urgency and recommendation assertion
  - Explanation trace logging
"""

from experta import KnowledgeEngine

from .facts import Symptom, Vital, Background, Disease, Urgency, Recommendation
from .cf_config import ALL_CF

# Import all rule mixins
from .rules_adhf import ADHFRules
from .rules_chf import CHFRules
from .rules_hfpef import HFpEFRules
from .rules_mi import MIRules
from .rules_acs import ACSRules
from .rules_angina import AnginaRules
from .rules_hypertensive import HypertensiveRules
from .rules_afib import AFibRules
from .rules_sca import SCARules
from .rules_shock import ShockRules
from .rules_output import OutputRule

# ─── Urgency Level Priority (for conflict resolution) ─────────────────────────
URGENCY_PRIORITY = {
    "CRITICAL": 4,
    "HIGH": 3,
    "MODERATE": 2,
    "LOW": 1,
}


class CardKnowlogyEngine(
    ADHFRules,
    CHFRules,
    HFpEFRules,
    MIRules,
    ACSRules,
    AnginaRules,
    HypertensiveRules,
    AFibRules,
    SCARules,
    ShockRules,
    OutputRule,
    KnowledgeEngine,
):
    """
    CardKnowlogy Expert System Engine.

    Combines all 71 production rules (R0–R70) via mixin inheritance.
    Uses forward chaining with salience-based conflict resolution
    (simulating the LEX strategy).

    Attributes:
        diseases_cf (dict): Possible Conditions Set — maps disease names to
                            their combined Certainty Factors.
        fired_rules (list): Ordered list of fired rule records for explanation.
        urgencies (dict): Maps disease names to their urgency levels.
        recommendations (dict): Maps disease names to recommendation text.
        fact_cfs (dict): Maps fact names to their CF values for lookups.
        output_ready (bool): Set to True when R0 fires.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._init_state()

    def _init_state(self):
        """Initialize/reset all tracking state."""
        self.diseases_cf = {}          # PCS: {disease_name: combined_cf}
        self.fired_rules = []          # [{rule_id, disease, cf, facts}]
        self.urgencies = {}            # {disease_name: urgency_level}
        self.recommendations = {}     # {disease_name: recommendation_text}
        self.fact_cfs = {}            # {fact_name: cf_value}
        self.output_ready = False
        self._declared_diseases = set()  # Track which diseases have been declared as facts

    def reset(self, *args, **kwargs):
        """Override reset to also clear our tracking state."""
        super().reset(*args, **kwargs)
        self._init_state()

    # ─── CF Lookup ─────────────────────────────────────────────────────────────

    def _get_cf(self, fact_name):
        """Get the predefined CF for a fact by name.

        First checks the runtime fact_cfs dict (populated at declaration time),
        then falls back to the static ALL_CF config.

        Args:
            fact_name: The fact identifier string.

        Returns:
            The CF value as a float.
        """
        if fact_name in self.fact_cfs:
            return self.fact_cfs[fact_name]
        return ALL_CF.get(fact_name, 0.5)

    # ─── Disease Assertion with CF Combination ─────────────────────────────────

    def _assert_disease(self, name, cf, rule_id, triggering_facts=None):
        """Assert or update a disease in the PCS with CF combination.

        If the disease already exists, CFs are combined using:
            CF_combined = CF_old + CF_new - (CF_old × CF_new)

        Also declares a Disease fact in working memory (only the first time)
        so that chained rules and urgency/recommendation rules can match.

        Args:
            name: Disease name string.
            cf: Computed CF for this rule firing.
            rule_id: The rule identifier (e.g., "R1").
            triggering_facts: List of fact names that triggered this rule.
        """
        if name in self.diseases_cf:
            old_cf = self.diseases_cf[name]
            # CF combination formula for concordant evidence
            combined = old_cf + cf - (old_cf * cf)
            self.diseases_cf[name] = round(combined, 6)
        else:
            self.diseases_cf[name] = round(cf, 6)

        # Declare Disease fact only once (to trigger urgency/recommendation rules)
        if name not in self._declared_diseases:
            self._declared_diseases.add(name)
            self.declare(Disease(name=name, cf=cf))

        # Log for explanation
        self.fired_rules.append({
            "rule_id": rule_id,
            "disease": name,
            "cf_contribution": round(cf, 6),
            "cf_combined": self.diseases_cf[name],
            "triggering_facts": triggering_facts or [],
        })

    # ─── Urgency Assertion ─────────────────────────────────────────────────────

    def _assert_urgency(self, disease_name, level, rule_id):
        """Assert an urgency level for a disease.

        If a higher urgency already exists, it is preserved (safety-first).

        Args:
            disease_name: The disease this urgency applies to.
            level: Urgency level string ('CRITICAL', 'HIGH', 'MODERATE', 'LOW').
            rule_id: The rule identifier.
        """
        current = self.urgencies.get(disease_name)
        if current is None or URGENCY_PRIORITY.get(level, 0) > URGENCY_PRIORITY.get(current, 0):
            self.urgencies[disease_name] = level

        # Declare urgency fact
        self.declare(Urgency(level=level))

        self._log_rule(rule_id, [f"{disease_name} → urgency={level}"])

    # ─── Recommendation Assertion ──────────────────────────────────────────────

    def _assert_recommendation(self, disease_name, text, rule_id):
        """Assert a recommendation for a disease.

        Args:
            disease_name: The disease this recommendation applies to.
            text: The recommendation text.
            rule_id: The rule identifier.
        """
        self.recommendations[disease_name] = text

        # Declare recommendation fact (triggers R0)
        self.declare(Recommendation(text=text))

        self._log_rule(rule_id, [f"{disease_name} → recommendation"])

    # ─── Rule Logging ──────────────────────────────────────────────────────────

    def _log_rule(self, rule_id, facts):
        """Log a rule firing for the explanation facility.

        Args:
            rule_id: The rule identifier string.
            facts: List of fact descriptions that triggered/resulted from this rule.
        """
        self.fired_rules.append({
            "rule_id": rule_id,
            "triggering_facts": facts,
        })

    # ─── Results Collection ────────────────────────────────────────────────────

    def get_results(self):
        """Collect and return the final diagnosis results.

        Returns:
            dict: Complete diagnosis result including primary disease,
                  confidence, urgency, recommendation, and explanation.
        """
        if not self.diseases_cf:
            return {
                "primary_disease": None,
                "confidence": 0.0,
                "urgency": None,
                "recommendation": None,
                "explanation": {
                    "fired_rules": [],
                    "key_facts": [],
                    "all_conditions": {},
                },
                "disclaimer": (
                    "This system is designed to support early assessment and "
                    "does not replace professional medical diagnosis or "
                    "consultation with a cardiologist."
                ),
            }

        # Primary disease = highest CF
        primary = max(self.diseases_cf, key=self.diseases_cf.get)
        primary_cf = self.diseases_cf[primary]

        # Get urgency and recommendation for primary disease
        urgency = self.urgencies.get(primary, "UNKNOWN")
        recommendation = self.recommendations.get(primary, "Consult a medical professional")

        # Build explanation
        fired_rule_ids = []
        key_facts_set = set()
        for entry in self.fired_rules:
            rid = entry.get("rule_id")
            if rid and rid not in fired_rule_ids:
                fired_rule_ids.append(rid)
            for f in entry.get("triggering_facts", []):
                if f and not f.endswith("(inferred)") and "→" not in f:
                    cf_val = self._get_cf(f)
                    key_facts_set.add(f"{f} (CF={cf_val})")

        # CF confidence interpretation
        if primary_cf >= 0.90:
            confidence_level = "Very High"
        elif primary_cf >= 0.75:
            confidence_level = "High"
        elif primary_cf >= 0.50:
            confidence_level = "Moderate"
        else:
            confidence_level = "Low"

        return {
            "primary_disease": primary,
            "confidence": round(primary_cf, 4),
            "confidence_level": confidence_level,
            "urgency": urgency,
            "recommendation": recommendation,
            "explanation": {
                "fired_rules": fired_rule_ids,
                "key_facts": sorted(key_facts_set),
                "all_conditions": {
                    k: round(v, 4) for k, v in sorted(
                        self.diseases_cf.items(),
                        key=lambda x: x[1],
                        reverse=True,
                    )
                },
                "clinical_notes": (
                    f"Based on: {', '.join(sorted(key_facts_set)[:5])}"
                    if key_facts_set else "No clinical notes available"
                ),
            },
            "disclaimer": (
                "This system is designed to support early assessment and "
                "does not replace professional medical diagnosis or "
                "consultation with a cardiologist."
            ),
        }
