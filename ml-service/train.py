import pandas as pd
import numpy as np
import os
import pickle
import json
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb

def train_models():
    data_path = "data/logistics_data.csv"
    if not os.path.exists(data_path):
        print("Data not found. Run generate_data.py first.")
        return

    df = pd.read_csv(data_path)
    
    # Feature Engineering
    df['volumetric_weight'] = (df['height_cm'] * df['width_cm'] * df['length_cm']) / 5000.0
    df['chargeable_weight'] = df[['weight_kg', 'volumetric_weight']].max(axis=1)
    
    # Features and Targets
    X = df[['distance_km', 'chargeable_weight', 'delivery_option', 'transport_mode']]
    y_cost = df['cost']
    y_time = df['estimated_time_hours']
    
    # Preprocessing
    numeric_features = ['distance_km', 'chargeable_weight']
    categorical_features = ['delivery_option', 'transport_mode']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(handle_unknown='ignore'), categorical_features)
        ])
    
    # Pipelines
    cost_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', xgb.XGBRegressor(n_estimators=100, random_state=42))
    ])
    
    time_pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('regressor', xgb.XGBRegressor(n_estimators=100, random_state=42))
    ])
    
    # Split
    X_train, X_test, y_cost_train, y_cost_test = train_test_split(X, y_cost, test_size=0.2, random_state=42)
    _, _, y_time_train, y_time_test = train_test_split(X, y_time, test_size=0.2, random_state=42)
    
    print("Training Cost Model...")
    cost_pipeline.fit(X_train, y_cost_train)
    cost_preds = cost_pipeline.predict(X_test)
    
    print("\nCost Model Evaluation:")
    print(f"MAE:  {mean_absolute_error(y_cost_test, cost_preds):.2f}")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_cost_test, cost_preds)):.2f}")
    print(f"R²:   {r2_score(y_cost_test, cost_preds):.4f}")
    
    print("\nTraining Delivery Time Model...")
    time_pipeline.fit(X_train, y_time_train)
    time_preds = time_pipeline.predict(X_test)
    
    print("\nDelivery Time Model Evaluation:")
    print(f"MAE:  {mean_absolute_error(y_time_test, time_preds):.2f}")
    print(f"RMSE: {np.sqrt(mean_squared_error(y_time_test, time_preds)):.2f}")
    print(f"R²:   {r2_score(y_time_test, time_preds):.4f}")
    
    # Save models
    os.makedirs("models", exist_ok=True)
    with open("models/cost_model.pkl", "wb") as f:
        pickle.dump(cost_pipeline, f)
    with open("models/time_model.pkl", "wb") as f:
        pickle.dump(time_pipeline, f)
        
    # Save a mock dictionary for distances (for the FastAPI service)
    # In a real app this would call Google Maps API or similar
    distances = df.groupby(['from_address', 'to_address'])['distance_km'].mean().to_dict()
    distances_str_keys = {f"{k[0]}_{k[1]}": v for k, v in distances.items()}
    with open("data/distance_map.json", "w") as f:
        json.dump(distances_str_keys, f)
        
    print("\nModels saved successfully.")
    print("No reliability model created because the synthetic dataset currently lacks historical delay/failure flags.")

if __name__ == "__main__":
    train_models()