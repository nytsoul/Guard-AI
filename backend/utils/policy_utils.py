"""
Policy Utilities - Common helpers for handling policy objects safely
"""

import logging
from typing import Any
from unittest.mock import MagicMock

logger = logging.getLogger(__name__)


def safe_policy_get(policy: dict, key: str, default_value: Any, expected_type: type = None) -> Any:
    """
    Safely get a value from policy dict, handling MagicMock objects.
    
    When running with mock database, policy.get() returns MagicMock objects
    instead of actual values. This function detects and handles that case.
    
    Args:
        policy: Policy dictionary (may be mocked)
        key: Policy key to retrieve 
        default_value: Default value if key missing or mocked
        expected_type: Expected type for type conversion (int, float, bool)
        
    Returns:
        Safe value that can be used in calculations and comparisons
    """
    try:
        value = policy.get(key, default_value)
        
        # If it's a MagicMock (from mock database), use the default
        if isinstance(value, MagicMock):
            logger.debug(f"Policy key '{key}' returned MagicMock, using default: {default_value}")
            return default_value
            
        # Type conversion if specified
        if expected_type and not isinstance(value, expected_type):
            if expected_type in (int, float):
                return expected_type(value)
            elif expected_type == bool:
                return bool(value)
                
        return value
    except (TypeError, ValueError, AttributeError) as e:
        logger.warning(f"Error getting policy key '{key}': {e}, using default: {default_value}")
        return default_value


def safe_sensitivity_get(policy: dict, default: int = 75) -> float:
    """Get sensitivity as a float between 0.0 and 1.0"""
    sensitivity = safe_policy_get(policy, "sensitivity", default, int)
    return sensitivity / 100.0


def safe_list_get(policy: dict, key: str, default_list: list = None) -> list:
    """Get a list value safely, handling MagicMock objects"""
    if default_list is None:
        default_list = []
    return safe_policy_get(policy, key, default_list, list)


def safe_bool_get(policy: dict, key: str, default_value: bool = True) -> bool:
    """
    Safely get a boolean value from policy, handling MagicMock objects.
    """
    return bool(safe_policy_get(policy, key, default_value, bool))


def safe_int_get(policy: dict, key: str, default_value: int) -> int:
    """
    Safely get an integer value from policy, handling MagicMock objects.
    """
    return int(safe_policy_get(policy, key, default_value, int))