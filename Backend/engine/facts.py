"""
CardKnowlogy Expert System — Fact Definitions

Defines the fact classes used in the Working Memory:
  - Symptom: Clinical symptoms (boolean + CF)
  - Vital: Vital signs (boolean thresholds + CF)
  - Background: Background medical information (boolean + CF)
  - Disease: Inferred medical condition (name + CF)
  - Urgency: Urgency level for a disease
  - Recommendation: Clinical recommendation text
"""

from experta import Fact, Field


class Symptom(Fact):
    """Clinical symptom fact.
    
    Attributes:
        name (str): Symptom identifier (e.g., 'shortness_of_breath')
        value (bool): Always True when declared (symptom is present)
        cf (float): Predefined Certainty Factor for this symptom
    """
    name = Field(str, mandatory=True)
    value = Field(bool, default=True)
    cf = Field(float, mandatory=True)


class Vital(Fact):
    """Vital sign threshold fact.
    
    Attributes:
        name (str): Vital sign identifier (e.g., 'bp_gte_180')
        value (bool): Always True when declared (threshold is met)
        cf (float): Predefined Certainty Factor for this threshold
    """
    name = Field(str, mandatory=True)
    value = Field(bool, default=True)
    cf = Field(float, mandatory=True)


class Background(Fact):
    """Background medical information fact.
    
    Attributes:
        name (str): Background info identifier (e.g., 'hypertension')
        value (bool): Always True when declared (condition is present)
        cf (float): Predefined Certainty Factor
    """
    name = Field(str, mandatory=True)
    value = Field(bool, default=True)
    cf = Field(float, mandatory=True)


class Disease(Fact):
    """Inferred disease/condition fact.
    
    Attributes:
        name (str): Disease name (e.g., 'Acute Decompensated Heart Failure')
        cf (float): Computed Certainty Factor for this inference
    """
    name = Field(str, mandatory=True)
    cf = Field(float, mandatory=True)


class Urgency(Fact):
    """Urgency level for a diagnosed condition.
    
    Attributes:
        level (str): One of 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'
    """
    level = Field(str, mandatory=True)


class Recommendation(Fact):
    """Clinical recommendation.
    
    Attributes:
        text (str): The recommendation text
    """
    text = Field(str, mandatory=True)
