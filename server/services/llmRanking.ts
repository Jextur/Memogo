import OpenAI from 'openai';
import { GooglePlacesResult } from './googlePlaces';

interface RankingContext {
  query: string;
  city?: string;
  tags?: string[];
  timeSlot?: string;
  currentLocation?: { lat: number; lng: number };
}

export async function rankAndFilterPOIs(
  places: GooglePlacesResult[],
  context: RankingContext
): Promise<GooglePlacesResult[]> {
  try {
    // If we have 5 or fewer results, return them all
    if (places.length <= 5) {
      return places;
    }

    const openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });

    // Prepare POI list for LLM
    const poiList = places.slice(0, 20).map((place, index) => ({
      index,
      name: place.name,
      rating: place.rating || 0,
      reviews: place.user_ratings_total || 0,
      types: place.types || [],
      address: place.address,
      price_level: place.price_level || 0,
      description: place.description
    }));

    const prompt = `
You are helping select the best POIs for a traveler's search query.

Search Query: "${context.query}"
${context.city ? `City: ${context.city}` : ''}
${context.tags ? `Trip Preferences: ${context.tags.join(', ')}` : ''}
${context.timeSlot ? `Time Slot: ${context.timeSlot}` : ''}

Available POIs:
${JSON.stringify(poiList, null, 2)}

Instructions:
1. Rank the POIs by relevance to the search query
2. Consider rating quality (prefer 4.0+ with 200+ reviews, but include lower if highly relevant)
3. Filter out low-credibility options (rating < 3.5 with < 50 reviews)
4. Consider variety - don't return only the same type of place
5. Return exactly 5 best options (or fewer if not enough quality matches)

Return a JSON object with:
{
  "selected_indices": [array of indices of selected POIs in order of relevance],
  "reasoning": "brief explanation of selection"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Latest model as per blueprint
      messages: [
        {
          role: 'system',
          content: 'You are an expert travel curator helping select the best places based on search queries.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower temperature for more consistent ranking
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.selected_indices || !Array.isArray(result.selected_indices)) {
      // Fallback to simple quality-based filtering
      return places
        .filter(p => (p.rating || 0) >= 4.0 && (p.user_ratings_total || 0) >= 100)
        .slice(0, 5);
    }

    // Return the selected POIs in ranked order
    const rankedPOIs = result.selected_indices
      .filter((idx: number) => idx >= 0 && idx < places.length)
      .map((idx: number) => places[idx])
      .slice(0, 5);

    return rankedPOIs.length > 0 ? rankedPOIs : places.slice(0, 5);

  } catch (error) {
    console.error('LLM ranking error:', error);
    // Fallback to simple quality-based filtering
    return places
      .filter(p => (p.rating || 0) >= 4.0 && (p.user_ratings_total || 0) >= 100)
      .slice(0, 5);
  }
}

// Calculate distance between two coordinates (rough approximation)
export function calculateDistance(
  lat1: number, 
  lon1: number, 
  lat2: number, 
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}