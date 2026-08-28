import pandas as pd
import numpy as np
import random
import os

def generate_dataset(num_samples=5000):
    np.random.seed(42)
    random.seed(42)

    cities = ["Chennai", "Mumbai", "Delhi", "Bangalore", "Kolkata", "Hyderabad", "Pune", "Ahmedabad"]
    
    # Distance matrix approx (km)
    distances = {}
    for i in range(len(cities)):
        for j in range(len(cities)):
            if i == j:
                distances[(cities[i], cities[j])] = random.randint(10, 50) # local
            else:
                distances[(cities[i], cities[j])] = random.randint(300, 2000)
                
    data = []
    for _ in range(num_samples):
        c1, c2 = random.sample(cities, 2)
        dist = distances[(c1, c2)]
        
        weight = round(random.uniform(0.5, 100.0), 2)
        height = round(random.uniform(5.0, 100.0), 1)
        width = round(random.uniform(5.0, 100.0), 1)
        length = round(random.uniform(5.0, 100.0), 1)
        
        volumetric_weight = (height * width * length) / 5000.0
        chargeable_weight = max(weight, volumetric_weight)
        
        delivery_option = random.choice(["Economy", "Normal", "Express"])
        transport_mode = random.choice(["Road", "Rail", "Air"])
        
        # Base cost and time factors based on transport mode
        if transport_mode == "Road":
            base_rate = 5
            speed_kmh = 40
        elif transport_mode == "Rail":
            base_rate = 3
            speed_kmh = 60
        else: # Air
            base_rate = 25
            speed_kmh = 500
            
        # Delivery option multipliers
        if delivery_option == "Economy":
            cost_mult = 0.8
            time_mult = 1.5
        elif delivery_option == "Normal":
            cost_mult = 1.0
            time_mult = 1.0
        else: # Express
            cost_mult = 1.5
            time_mult = 0.7
            
        # Calculate ideal cost and time
        cost = base_rate * chargeable_weight * (dist / 100.0) * cost_mult
        time_hours = (dist / speed_kmh) * time_mult
        
        # Add some noise
        cost = cost * random.uniform(0.9, 1.1)
        time_hours = time_hours * random.uniform(0.9, 1.1)
        
        # Add handling delays
        time_hours += random.uniform(4, 24)
        
        # Minimums
        cost = max(50.0, round(cost, 2))
        time_hours = max(2.0, round(time_hours, 1))
        
        data.append({
            "from_address": c1,
            "to_address": c2,
            "distance_km": dist,
            "weight_kg": weight,
            "height_cm": height,
            "width_cm": width,
            "length_cm": length,
            "delivery_option": delivery_option,
            "transport_mode": transport_mode,
            "cost": cost,
            "estimated_time_hours": time_hours
        })
        
    df = pd.DataFrame(data)
    os.makedirs("data", exist_ok=True)
    df.to_csv("data/logistics_data.csv", index=False)
    print(f"Generated {num_samples} rows of synthetic data at data/logistics_data.csv")

if __name__ == "__main__":
    generate_dataset()