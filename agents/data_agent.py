import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.impute import SimpleImputer

def load_data(file_obj) -> pd.DataFrame:
    """Load CSV dataset."""
    return pd.read_csv(file_obj)

def preprocess_data(df: pd.DataFrame, target_col: str = None) -> pd.DataFrame:
    """
    Preprocess the dataset by:
    - Handling missing values
    - Encoding categorical variables
    - Normalizing numeric features
    """
    df_processed = df.copy()
    
    # 1. Handle missing values
    # Numeric: impute with median
    numeric_cols = df_processed.select_dtypes(include=['int64', 'float64']).columns
    if len(numeric_cols) > 0:
        num_imputer = SimpleImputer(strategy='median')
        df_processed[numeric_cols] = num_imputer.fit_transform(df_processed[numeric_cols])
        
        # 3. Normalize numeric features (excluding target if numerical to avoid scaling target in classification, 
        # though usually target is categorical for classification, but just in case)
        cols_to_scale = [col for col in numeric_cols if col != target_col]
        if len(cols_to_scale) > 0:
            scaler = StandardScaler()
            df_processed[cols_to_scale] = scaler.fit_transform(df_processed[cols_to_scale])

    # Categorical: impute with most frequent
    categorical_cols = df_processed.select_dtypes(include=['object', 'category', 'bool']).columns
    if len(categorical_cols) > 0:
        cat_imputer = SimpleImputer(strategy='most_frequent')
        df_processed[categorical_cols] = cat_imputer.fit_transform(df_processed[categorical_cols])

        # 2. Encode categorical variables
        for col in categorical_cols:
            le = LabelEncoder()
            df_processed[col] = le.fit_transform(df_processed[col].astype(str))
            
    return df_processed
