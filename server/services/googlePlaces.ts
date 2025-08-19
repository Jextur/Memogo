export interface GooglePlacesResult {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  address?: string;
  location?: { lat: number; lng: number };
  open_now?: boolean;
  photo_ref?: string;
}

export async function searchPlaces(query: string): Promise<GooglePlacesResult[]> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || "your_google_places_api_key";
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (!data.results) {
      return [];
    }
    
    return data.results.slice(0, 10).map((place: any): GooglePlacesResult => ({
      place_id: place.place_id,
      name: place.name,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types,
      address: place.formatted_address || place.vicinity,
      location: place.geometry?.location,
      open_now: place.opening_hours?.open_now,
      photo_ref: place.photos?.[0]?.photo_reference,
    }));
  } catch (error) {
    console.error("Google Places search error:", error);
    throw new Error("Failed to search places");
  }
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlacesResult | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || "your_google_places_api_key";
    const fields = [
      "place_id", "name", "rating", "user_ratings_total", "price_level", 
      "types", "formatted_address", "geometry", "opening_hours", "photos"
    ].join(",");
    
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }
    
    if (!data.result) {
      return null;
    }
    
    const place = data.result;
    return {
      place_id: place.place_id,
      name: place.name,
      rating: place.rating,
      user_ratings_total: place.user_ratings_total,
      price_level: place.price_level,
      types: place.types,
      address: place.formatted_address,
      location: place.geometry?.location,
      open_now: place.opening_hours?.open_now,
      photo_ref: place.photos?.[0]?.photo_reference,
    };
  } catch (error) {
    console.error("Google Places details error:", error);
    throw new Error("Failed to get place details");
  }
}

export function getPhotoUrl(photoReference: string, maxWidth: number = 400): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_PLACES_API_KEY || "your_google_places_api_key";
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${apiKey}`;
}
