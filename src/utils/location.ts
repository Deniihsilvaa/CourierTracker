/**
 * Calculates the Haversine distance between two points in meters.
 * 
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in meters
 */
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth radius in meters
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);
  
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
            
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; 
};

/**
 * Filter for GPS noise.
 * Discards locations with low accuracy or unrealistic speeds.
 */
export const isValidLocation = (accuracy: number | null, speed: number | null): boolean => {
  // Ignore points with accuracy worse than 50 meters
  if (accuracy !== null && accuracy > 50) return false;
  
  // Ignore unrealistic speeds (e.g., > 150 km/h = ~41 m/s)
  if (speed !== null && speed > 41) return false;
  
  return true;
};
