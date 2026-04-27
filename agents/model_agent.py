import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

def train_model(df: pd.DataFrame, target_col: str, model_type: str = 'Logistic Regression'):
    """
    Train a classification model.
    model_type can be 'Logistic Regression' or 'Decision Tree'.
    Returns the trained model, feature names, X_test, y_test, and accuracy.
    """
    X = df.drop(columns=[target_col])
    y = df[target_col]
    
    # Ensure y is categorical/integer for classification
    if y.dtype == 'float64':
        y = y.astype(int)
        
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    if model_type == 'Decision Tree':
        model = DecisionTreeClassifier(random_state=42)
    else:
        model = LogisticRegression(max_iter=1000, random_state=42)
        
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    return model, X.columns.tolist(), X_test, y_test, accuracy
