import pandas as pd
from fairlearn.metrics import demographic_parity_difference, equal_opportunity_difference
import numpy as np

def compute_fairness_metrics(y_true, y_pred, sensitive_features):
    """
    Compute fairness metrics using fairlearn.
    sensitive_features is a pandas Series or numpy array aligned with y_true.
    """
    dpd = demographic_parity_difference(y_true, y_pred, sensitive_features=sensitive_features)
    eod = equal_opportunity_difference(y_true, y_pred, sensitive_features=sensitive_features)
    
    return {
        'demographic_parity_difference': float(dpd),
        'equal_opportunity_difference': float(eod)
    }

def classify_risk(metrics_dict: dict) -> str:
    """
    Classify fairness risk based on maximum difference metric.
    Thresholds:
    < 0.1 : Low Risk
    0.1 to 0.2 : Medium Risk
    > 0.2 : High Risk
    """
    max_diff = max(abs(metrics_dict.get('demographic_parity_difference', 0)),
                   abs(metrics_dict.get('equal_opportunity_difference', 0)))
    
    if max_diff < 0.1:
        return 'Low Risk'
    elif max_diff <= 0.2:
        return 'Medium Risk'
    else:
        return 'High Risk'
