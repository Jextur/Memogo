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
  description?: string;
  editorial_summary?: string;
}

// Quality filters for POIs
export interface PlaceFilterOptions {
  minRating?: number;
  minReviews?: number;
  relevantTypes?: string[];
  theme?: string;
}

export async function searchPlaces(query: string, filters?: PlaceFilterOptions): Promise<GooglePlacesResult[]> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      throw new Error("Google Places API key not configured");
    }

    const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types,places.location,places.currentOpeningHours,places.photos,places.editorialSummary"
      },
      body: JSON.stringify({ 
        textQuery: query, 
        pageSize: 20, // Maximum allowed by Google Places API
        languageCode: "en"
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }
    
    if (!data.places) {
      return [];
    }
    
    let results = data.places.map((place: any): GooglePlacesResult => ({
      place_id: place.id,
      name: place.displayName?.text || place.displayName,
      rating: place.rating,
      user_ratings_total: place.userRatingCount,
      price_level: place.priceLevel,
      types: place.types,
      address: place.formattedAddress,
      location: place.location,
      open_now: place.currentOpeningHours?.openNow,
      photo_ref: place.photos?.[0]?.name,
      editorial_summary: place.editorialSummary?.text,
      description: generatePlaceDescription(place)
    }));
    
    // Apply quality filters
    if (filters) {
      results = results.filter(place => {
        // Filter by minimum rating (default 4.2)
        if (filters.minRating && place.rating && place.rating < filters.minRating) {
          return false;
        }
        
        // Filter by minimum reviews (default 500)
        if (filters.minReviews && place.user_ratings_total && place.user_ratings_total < filters.minReviews) {
          return false;
        }
        
        // Filter by relevant types for the theme
        if (filters.relevantTypes && filters.relevantTypes.length > 0 && place.types) {
          const hasRelevantType = place.types.some(type => 
            filters.relevantTypes?.includes(type)
          );
          if (!hasRelevantType) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Sort by rating and review count
    results.sort((a, b) => {
      const scoreA = (a.rating || 0) * Math.log10((a.user_ratings_total || 1) + 1);
      const scoreB = (b.rating || 0) * Math.log10((b.user_ratings_total || 1) + 1);
      return scoreB - scoreA;
    });
    
    // Return top 10 results
    // Return more results for longer trips - don't limit to just 10
    return results;
  } catch (error) {
    console.error("Google Places search error:", error);
    throw new Error("Failed to search places");
  }
}

// Generate contextual descriptions for POIs
function generatePlaceDescription(place: any): string {
  const name = place.displayName?.text || place.displayName;
  const types = place.types || [];
  const rating = place.rating;
  const reviewCount = place.userRatingCount;
  
  // Build description based on place type and ratings
  let description = "";
  
  if (types.includes("restaurant")) {
    if (rating >= 4.5) {
      description = `Highly acclaimed dining spot with ${reviewCount || 'many'} reviews`;
    } else if (types.includes("japanese_restaurant")) {
      description = "Authentic Japanese cuisine experience";
    } else if (types.includes("italian_restaurant")) {
      description = "Traditional Italian flavors in a welcoming atmosphere";
    } else {
      description = "Popular local restaurant";
    }
  } else if (types.includes("tourist_attraction") || types.includes("point_of_interest")) {
    if (rating >= 4.5) {
      description = `Must-visit attraction rated ${rating}/5 by travelers`;
    } else {
      description = "Notable landmark worth exploring";
    }
  } else if (types.includes("museum")) {
    description = "Cultural institution showcasing local heritage";
  } else if (types.includes("park")) {
    description = "Scenic green space perfect for relaxation";
  } else if (types.includes("shopping_mall") || types.includes("store")) {
    description = "Shopping destination for local and international brands";
  } else if (types.includes("cafe")) {
    description = "Cozy spot for coffee and light refreshments";
  } else if (types.includes("bar") || types.includes("night_club")) {
    description = "Vibrant nightlife venue";
  } else if (place.editorialSummary?.text) {
    description = place.editorialSummary.text;
  } else {
    description = `Popular venue with ${rating || 'good'} rating`;
  }
  
  return description;
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
