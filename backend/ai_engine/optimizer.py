import itertools
from typing import List, Dict, Tuple
from .tools import get_route_distance, calculate_travel_time, calculate_trip_cost

def optimize_route(start: str, end: str, waypoints: List[str]) -> Dict:
    """
    Finds the shortest route (TSP style) passing through all waypoints.
    If there are too many waypoints, a greedy approach would be needed,
    but for standard trips (1-6 waypoints), permutation is feasible.
    """
    best_route = []
    min_distance = float('inf')
    
    if len(waypoints) <= 7:
        # Brute-force all permutations of the waypoints
        for perm in itertools.permutations(waypoints):
            current_route = [start] + list(perm) + [end]
            dist = 0
            for i in range(len(current_route) - 1):
                dist += get_route_distance(current_route[i], current_route[i+1])
            
            if dist < min_distance:
                min_distance = dist
                best_route = current_route
    else:
        # Greedy fallback (nearest neighbor)
        unvisited = waypoints.copy()
        current = start
        best_route = [start]
        dist = 0
        
        while unvisited:
            next_hop = min(unvisited, key=lambda x: get_route_distance(current, x))
            dist += get_route_distance(current, next_hop)
            best_route.append(next_hop)
            unvisited.remove(next_hop)
            current = next_hop
            
        dist += get_route_distance(current, end)
        best_route.append(end)
        min_distance = dist
        
    travel_time = calculate_travel_time(min_distance)
    fuel_cost = calculate_trip_cost(min_distance)
    
    return {
        "route": best_route,
        "total_distance_km": round(min_distance, 2),
        "total_driving_hours": round(travel_time, 2),
        "estimated_fuel_cost": round(fuel_cost, 2)
    }
