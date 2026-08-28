from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import pickle
import pandas as pd
import json
import os

app = FastAPI(title="ML Recommendation Service")
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class RecommendationRequest(BaseModel):
    from_address: str = Field(alias="from")
    to_address: str = Field(alias="to")
    weight_kg: float = Field(alias="weight")
    height_cm: float = Field(alias="height")
    width_cm: float = Field(alias="width")
    length_cm: float = Field(alias="length")
    delivery_option: str = Field(alias="deliveryOption")

# Load models and data at startup
cost_model = None
time_model = None
distance_map = {}

@app.on_event("startup")
def load_assets():
    global cost_model, time_model, distance_map
    try:
        with open(os.path.join(BASE_DIR, "models", "cost_model.pkl"), "rb") as f:
            cost_model = pickle.load(f)
        with open(os.path.join(BASE_DIR, "models", "time_model.pkl"), "rb") as f:
            time_model = pickle.load(f)
        with open(os.path.join(BASE_DIR, "data", "distance_map.json"), "r") as f:
            distance_map = json.load(f)
    except Exception as e:
        print(f"Failed to load models/data: {e}")

def get_distance(from_addr, to_addr):
    key1 = f"{from_addr}_{to_addr}"
    key2 = f"{to_addr}_{from_addr}"
    if key1 in distance_map: return distance_map[key1]
    if key2 in distance_map: return distance_map[key2]
    return 1000.0 # Default fallback distance

@app.post("/recommend")
def recommend(req: RecommendationRequest):
    if cost_model is None or time_model is None:
        raise HTTPException(status_code=503, detail="Models not loaded")
        
    dist = get_distance(req.from_address, req.to_address)
    vol_weight = (req.height_cm * req.width_cm * req.length_cm) / 5000.0
    chargeable_weight = max(req.weight_kg, vol_weight)
    
    modes = ["Road", "Rail", "Air"]
    predictions = []
    
    for mode in modes:
        input_data = pd.DataFrame([{
            'distance_km': dist,
            'chargeable_weight': chargeable_weight,
            'delivery_option': req.delivery_option,
            'transport_mode': mode
        }])
        
        pred_cost = float(cost_model.predict(input_data)[0])
        pred_time = float(time_model.predict(input_data)[0])
        
        pred_cost = max(10.0, round(pred_cost, 2))
        pred_time = max(1.0, round(pred_time, 1))
        
        predictions.append({
            "mode": mode,
            "cost": pred_cost,
            "time": pred_time
        })
        
    if req.delivery_option == "Economy":
        w_cost, w_time = 0.8, 0.2
    elif req.delivery_option == "Normal":
        w_cost, w_time = 0.5, 0.5
    elif req.delivery_option == "Express":
        w_cost, w_time = 0.2, 0.8
    else:
        w_cost, w_time = 0.5, 0.5
        
    max_cost = max(p['cost'] for p in predictions)
    min_cost = min(p['cost'] for p in predictions)
    max_time = max(p['time'] for p in predictions)
    min_time = min(p['time'] for p in predictions)
    
    scored_predictions = []
    for p in predictions:
        norm_cost = (max_cost - p['cost']) / (max_cost - min_cost) if max_cost != min_cost else 1.0
        norm_time = (max_time - p['time']) / (max_time - min_time) if max_time != min_time else 1.0
        
        score = (norm_cost * w_cost) + (norm_time * w_time)
        
        scored_predictions.append({
            "mode": p['mode'],
            "cost": p['cost'],
            "time": p['time'],
            "score": round(score, 2)
        })
        
    scored_predictions.sort(key=lambda x: x['score'], reverse=True)
    best = scored_predictions[0]
    return {
        "recommendedMode": best['mode'],
        "options": [
            {"mode": item['mode'], "cost": item['cost'], "time": item['time']}
            for item in scored_predictions
        ],
        "score": best['score'],
        "reason": f"Optimized based on {req.delivery_option} delivery preference weighting."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
