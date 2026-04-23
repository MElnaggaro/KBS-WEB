"""
CardKnowlogy — Final Output Rule (R0)

R0: IF recommendation exists THEN print disease, urgency, recommendation
    CF = 1.0

This rule fires last (lowest salience among output rules) after a
recommendation has been generated. In the engine, it simply logs that
R0 has fired; the actual output collection is done by the runner.
"""

from experta import Rule
from .facts import Recommendation


class OutputRule:
    """Mixin: R0 — Final output trigger rule."""

    # ── R0: recommendation exists → signal output ready ──
    @Rule(
        Recommendation(text=lambda t: t is not None),
        salience=3,  # Fires after urgency (5) and recommendation (4) rules
    )
    def r0_output(self):
        """Signal that the output is ready to be collected."""
        self.output_ready = True
        self._log_rule("R0", ["recommendation exists"])
