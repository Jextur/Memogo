import OpenAI from 'openai';
import type { POIWithReason } from './enhancedPackageGenerator';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || ''
});

// Duration estimates based on POI type (in hours)
const DURATION_ESTIMATES: Record<string, number> = {
  // Full day activities (6-8 hours)
  'amusement_park': 8,
  'theme_park': 8,
  'water_park': 6,
  'zoo': 5,
  'safari_park': 5,
  'national_park': 6,
  
  // Long activities (3-5 hours)
  'aquarium': 3,
  'museum': 3,
  'science_museum': 3.5,
  'history_museum': 3,
  'natural_history_museum': 3.5,
  'art_gallery': 2.5,
  'castle': 3,
  'palace': 3.5,
  'fortress': 2.5,
  'historical_landmark': 2.5,
  'unesco_world_heritage_site': 3,
  'botanical_garden': 2.5,
  'beach': 4,
  'lake': 3,
  'hiking_area': 4,
  'mountain_peak': 5,
  'ski_resort': 8,
  'golf_course': 4,
  
  // Medium activities (1.5-3 hours)
  'temple': 1.5,
  'hindu_temple': 1.5,
  'buddhist_temple': 2,
  'shrine': 1,
  'church': 1,
  'cathedral': 1.5,
  'mosque': 1,
  'synagogue': 1,
  'cemetery': 1.5,
  'memorial': 1,
  'shopping_mall': 3,
  'department_store': 2,
  'market': 2,
  'local_market': 2,
  'farmers_market': 1.5,
  'flea_market': 2,
  'night_market': 2.5,
  'outlet_mall': 3,
  'theater': 3,
  'performing_arts_theater': 3,
  'movie_theater': 2.5,
  'opera_house': 3.5,
  'concert_hall': 3,
  'stadium': 3,
  'sports_complex': 2.5,
  'spa': 3,
  'hot_spring': 2.5,
  'casino': 3,
  'vineyard': 2.5,
  'winery': 2,
  'brewery': 1.5,
  'distillery': 1.5,
  
  // Food & Dining (1-2 hours)
  'restaurant': 1.5,
  'fine_dining_restaurant': 2,
  'casual_restaurant': 1,
  'fast_food_restaurant': 0.5,
  'cafe': 1,
  'coffee_shop': 0.75,
  'bakery': 0.5,
  'bar': 2,
  'pub': 2,
  'night_club': 3,
  'food_court': 1,
  'food_market': 1.5,
  'street_food': 0.5,
  'ice_cream_shop': 0.5,
  'dessert_shop': 0.5,
  
  // Quick visits (0.5-1.5 hours)
  'viewpoint': 0.5,
  'scenic_spot': 0.75,
  'observation_deck': 1,
  'landmark': 1,
  'monument': 0.75,
  'statue': 0.5,
  'fountain': 0.25,
  'tower': 1.5,
  'lighthouse': 1,
  'bridge': 0.5,
  'square': 0.5,
  'plaza': 0.5,
  'promenade': 1,
  'pier': 1,
  'harbor': 1,
  'marina': 1,
  
  // Neighborhood/District (2-4 hours)
  'neighborhood': 2,
  'sublocality': 2,
  'tourist_attraction': 2,
  'point_of_interest': 1.5,
  'locality': 3,
  'town_square': 1,
  
  // Parks & Gardens (1-3 hours)
  'park': 2,
  'city_park': 1.5,
  'national_garden': 2,
  'garden': 1.5,
  'japanese_garden': 1.5,
  'arboretum': 2,
  
  // Activity-based
  'gym': 1.5,
  'fitness_center': 1.5,
  'yoga_studio': 1.5,
  'bowling_alley': 2,
  'amusement_center': 2,
  'arcade': 1.5,
  'escape_room': 1.5,
  'karaoke': 2,
  
  // Transportation hubs (usually pass-through)
  'train_station': 0.5,
  'subway_station': 0.25,
  'bus_station': 0.25,
  'airport': 0.5,
  'ferry_terminal': 0.5,
  
  // Services (quick stops)
  'bank': 0.5,
  'atm': 0.1,
  'post_office': 0.5,
  'pharmacy': 0.25,
  'hospital': 0.5,
  'police': 0.25,
  'library': 1.5,
  'university': 2,
  'school': 1,
  
  // Accommodation (not typically visited as attractions)
  'lodging': 0.5,
  'hotel': 0.5,
  'hostel': 0.5,
  'guest_house': 0.5,
  
  // Default
  'default': 2
};

export interface EnhancedPOI {
  name: string;
  placeId: string;
  reason: string;
  rating?: number;
  reviewCount?: number;
  category: string;
  estimatedDuration: number; // in hours
  types?: string[];
  openingHours?: any;
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface DayPlan {
  day: number;
  title: string;
  description: string;
  morningPOIs: EnhancedPOI[];
  afternoonPOIs: EnhancedPOI[];
  eveningPOIs: EnhancedPOI[];
  totalDuration: number;
  feasibilityScore: number;
}

// Estimate visit duration based on POI type and name
export function estimatePOIDuration(poi: any): number {
  const name = poi.name?.toLowerCase() || '';
  
  // Special case: Major theme parks and full-day attractions
  const fullDayAttractions = [
    'disneyland', 'disney', 'universal studios', 'six flags', 
    'legoland', 'seaworld', 'busch gardens', 'cedar point'
  ];
  if (fullDayAttractions.some(attraction => name.includes(attraction))) {
    return 8;
  }
  
  // Major zoos and safari parks
  if ((name.includes('zoo') && (name.includes('national') || name.includes('san diego') || name.includes('bronx'))) ||
      name.includes('safari') || name.includes('animal kingdom')) {
    return 5;
  }
  
  // Major aquariums
  if (name.includes('aquarium') && 
      (name.includes('georgia') || name.includes('monterey') || name.includes('shedd') || name.includes('national'))) {
    return 3.5;
  }
  
  // Famous towers with likely queue times
  const famousTowers = ['eiffel', 'tokyo tower', 'skytree', 'cn tower', 'empire state', 
                       'willis tower', 'space needle', 'burj khalifa', 'london eye'];
  if (famousTowers.some(tower => name.includes(tower))) {
    return 2; // Include queue time
  }
  
  // Major museums requiring more time
  const majorMuseums = ['louvre', 'metropolitan', 'british museum', 'vatican', 'uffizi', 
                       'prado', 'hermitage', 'smithsonian', 'natural history', 'moma'];
  if (majorMuseums.some(museum => name.includes(museum))) {
    return 4;
  }
  
  // Large palaces and castle complexes
  const largePalaces = ['versailles', 'forbidden city', 'buckingham', 'schönbrunn', 
                       'windsor castle', 'neuschwanstein', 'alhambra'];
  if (largePalaces.some(palace => name.includes(palace))) {
    return 4;
  }
  
  // Check POI types from Google Places - look for most specific type first
  if (poi.types && Array.isArray(poi.types)) {
    // Sort types by specificity (longer type names are usually more specific)
    const sortedTypes = [...poi.types].sort((a, b) => b.length - a.length);
    
    for (const type of sortedTypes) {
      if (DURATION_ESTIMATES[type]) {
        // Adjust duration based on additional context
        let duration = DURATION_ESTIMATES[type];
        
        // Restaurants: Fine dining takes longer
        if (type.includes('restaurant')) {
          if (name.includes('michelin') || name.includes('fine dining') || 
              name.includes('tasting menu') || name.includes('omakase')) {
            duration = 2.5;
          } else if (name.includes('buffet')) {
            duration = 1.5;
          } else if (name.includes('fast') || name.includes('quick')) {
            duration = 0.75;
          }
        }
        
        // Shopping: Outlets and large malls take longer
        if (type.includes('shopping') || type === 'store') {
          if (name.includes('outlet') || name.includes('premium')) {
            duration = 3.5;
          } else if (name.includes('department store') || name.includes('mall')) {
            duration = 3;
          } else if (name.includes('boutique') || name.includes('gift shop')) {
            duration = 0.75;
          }
        }
        
        // Parks: National parks and large parks take longer
        if (type === 'park') {
          if (name.includes('national') || name.includes('central park') || 
              name.includes('golden gate') || name.includes('hyde park')) {
            duration = 3;
          }
        }
        
        // Beaches: Famous beaches might need more time
        if (type === 'beach') {
          if (name.includes('beach park') || name.includes('beach resort')) {
            duration = 5;
          }
        }
        
        return duration;
      }
    }
  }
  
  // Category-based fallback with refined durations
  const category = poi.category?.toLowerCase();
  if (category) {
    switch (category) {
      case 'restaurant':
      case 'food':
      case 'dining':
        // Check for specific dining types
        if (name.includes('fine dining') || name.includes('michelin')) return 2.5;
        if (name.includes('buffet')) return 1.5;
        if (name.includes('cafe') || name.includes('coffee')) return 1;
        if (name.includes('fast food') || name.includes('quick')) return 0.75;
        return 1.5;
      
      case 'museum':
      case 'culture':
      case 'cultural':
        if (name.includes('national') || name.includes('art')) return 3;
        return 2.5;
      
      case 'shopping':
      case 'market':
        if (name.includes('mall') || name.includes('outlet')) return 3;
        if (name.includes('market')) return 2;
        return 1.5;
      
      case 'nature':
      case 'outdoor':
      case 'park':
        if (name.includes('national')) return 4;
        if (name.includes('hike') || name.includes('trail')) return 3;
        return 2;
      
      case 'entertainment':
      case 'nightlife':
        if (name.includes('show') || name.includes('concert')) return 3;
        if (name.includes('club') || name.includes('bar')) return 2.5;
        return 2;
      
      case 'attraction':
      case 'landmark':
        if (name.includes('tower') || name.includes('observation')) return 1.5;
        return 2;
      
      case 'beach':
      case 'water':
        return 3;
      
      case 'spa':
      case 'wellness':
        return 2.5;
      
      default:
        return 2;
    }
  }
  
  return DURATION_ESTIMATES.default;
}

// Use LLM to get intelligent duration estimate for complex POIs
async function getIntelligentDurationEstimate(poi: any): Promise<number> {
  try {
    if (!process.env.VITE_OPENAI_API_KEY) {
      return estimatePOIDuration(poi); // Fallback to rule-based estimation
    }

    const prompt = `Estimate the typical visit duration for this place of interest:

Name: ${poi.name}
Types: ${(poi.types || []).join(', ')}
Category: ${poi.category || 'Unknown'}
Description: ${poi.description || 'N/A'}
Location: ${poi.address || 'Unknown'}

Consider:
1. Type of attraction (museum, restaurant, park, etc.)
2. Typical visitor behavior and queue times
3. Size and scope of the attraction
4. Whether it's a quick photo stop or immersive experience

Provide a realistic duration in hours (as a decimal number).
For example: 0.5 for 30 minutes, 1.5 for 90 minutes, 3 for 3 hours.

Return ONLY a number, nothing else.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel expert who estimates realistic visit durations for tourist attractions.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 10
    });

    const duration = parseFloat(response.choices[0].message.content?.trim() || '2');
    
    // Validate the response
    if (isNaN(duration) || duration < 0.25 || duration > 12) {
      return estimatePOIDuration(poi); // Fallback if invalid
    }
    
    return duration;
  } catch (error) {
    console.error('Error getting intelligent duration estimate:', error);
    return estimatePOIDuration(poi); // Fallback on error
  }
}

// Calculate travel time between POIs (simplified - assumes 30 min average)
function estimateTravelTime(poi1: EnhancedPOI, poi2: EnhancedPOI): number {
  // If we have coordinates, we could calculate actual distance
  // For now, use a simplified estimate
  if (poi1.geometry && poi2.geometry) {
    const lat1 = poi1.geometry.location.lat;
    const lng1 = poi1.geometry.location.lng;
    const lat2 = poi2.geometry.location.lat;
    const lng2 = poi2.geometry.location.lng;
    
    // Haversine distance formula (simplified)
    const distance = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2));
    
    // Rough estimate: 0.01 degrees ≈ 1km ≈ 20 min travel time in city
    return Math.min(1, distance * 20);
  }
  
  // Default travel time between attractions
  return 0.5; // 30 minutes
}

// Use LLM to create intelligent itinerary
export async function createIntelligentItinerary(
  pois: EnhancedPOI[],
  days: number,
  destination: string,
  preferences: string[]
): Promise<DayPlan[]> {
  // Prepare POI data for LLM
  const poisData = pois.map(poi => ({
    name: poi.name,
    category: poi.category,
    duration: poi.estimatedDuration,
    reason: poi.reason,
    placeId: poi.placeId
  }));
  
  const prompt = `You are a travel planning expert. Create a realistic ${days}-day itinerary for ${destination}.

User preferences: ${preferences.join(', ')}

Available POIs with estimated visit durations:
${JSON.stringify(poisData, null, 2)}

IMPORTANT RULES:
1. Maximum 8 hours of activities per day (excluding meals)
2. Group nearby attractions together to minimize travel time
3. NEVER put theme parks (Disneyland, Universal Studios) with other major attractions on the same day
4. Balance each day with a mix of activities (culture, food, shopping, etc.)
5. Consider that restaurants/cafes are for meals, not counted in the 8-hour activity limit
6. Morning: 9am-12pm (3 hours), Afternoon: 12pm-5pm (5 hours), Evening: 5pm-9pm (4 hours)
7. Leave buffer time for travel between locations (assume 30 min between POIs)
8. Distribute the user's preferred tags/interests across ALL days, not just Day 1

Return a JSON array of day plans with this structure:
[
  {
    "day": 1,
    "title": "Day 1: [Theme of the day]",
    "description": "Brief description of the day's focus",
    "morningPOIs": ["placeId1", "placeId2"],
    "afternoonPOIs": ["placeId3", "placeId4"],
    "eveningPOIs": ["placeId5"],
    "totalDuration": 7.5,
    "feasibilityScore": 0.9
  }
]

Ensure each POI appears only once across all days. The feasibilityScore (0-1) indicates how realistic the day plan is.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel itinerary expert who creates realistic, executable travel plans.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{"days":[]}');
    const dayPlans = result.days || result;
    
    // Map the LLM response back to our DayPlan structure
    return dayPlans.map((plan: any) => {
      const morningPOIs = (plan.morningPOIs || [])
        .map((placeId: string) => pois.find(p => p.placeId === placeId))
        .filter(Boolean);
      
      const afternoonPOIs = (plan.afternoonPOIs || [])
        .map((placeId: string) => pois.find(p => p.placeId === placeId))
        .filter(Boolean);
      
      const eveningPOIs = (plan.eveningPOIs || [])
        .map((placeId: string) => pois.find(p => p.placeId === placeId))
        .filter(Boolean);
      
      return {
        day: plan.day,
        title: plan.title || `Day ${plan.day}: Exploring ${destination}`,
        description: plan.description || 'A day of discovery and adventure',
        morningPOIs,
        afternoonPOIs,
        eveningPOIs,
        totalDuration: plan.totalDuration || 
          [...morningPOIs, ...afternoonPOIs, ...eveningPOIs]
            .reduce((sum, poi) => sum + poi.estimatedDuration, 0),
        feasibilityScore: plan.feasibilityScore || 0.8
      };
    });
  } catch (error) {
    console.error('Error creating intelligent itinerary:', error);
    // Fallback to simple distribution
    return createFallbackItinerary(pois, days, destination);
  }
}

// Fallback itinerary creation if LLM fails
function createFallbackItinerary(
  pois: EnhancedPOI[],
  days: number,
  destination: string
): DayPlan[] {
  const dayPlans: DayPlan[] = [];
  const usedPOIs = new Set<string>();
  
  // Separate POIs by duration
  const fullDayPOIs = pois.filter(p => p.estimatedDuration >= 6);
  const halfDayPOIs = pois.filter(p => p.estimatedDuration >= 3 && p.estimatedDuration < 6);
  const quickPOIs = pois.filter(p => p.estimatedDuration < 3);
  
  for (let day = 1; day <= days; day++) {
    const morningPOIs: EnhancedPOI[] = [];
    const afternoonPOIs: EnhancedPOI[] = [];
    const eveningPOIs: EnhancedPOI[] = [];
    let totalDuration = 0;
    
    // Check if we have a full-day activity
    const fullDayActivity = fullDayPOIs.find(p => !usedPOIs.has(p.placeId));
    if (fullDayActivity) {
      afternoonPOIs.push(fullDayActivity);
      usedPOIs.add(fullDayActivity.placeId);
      totalDuration = fullDayActivity.estimatedDuration;
    } else {
      // Build a balanced day
      const maxDuration = 8;
      
      // Morning (up to 3 hours)
      for (const poi of [...halfDayPOIs, ...quickPOIs]) {
        if (usedPOIs.has(poi.placeId)) continue;
        if (totalDuration + poi.estimatedDuration > maxDuration) continue;
        if (morningPOIs.reduce((sum, p) => sum + p.estimatedDuration, 0) + poi.estimatedDuration > 3) continue;
        
        morningPOIs.push(poi);
        usedPOIs.add(poi.placeId);
        totalDuration += poi.estimatedDuration;
        
        if (morningPOIs.length >= 2) break;
      }
      
      // Afternoon (up to 4 hours)
      for (const poi of [...halfDayPOIs, ...quickPOIs]) {
        if (usedPOIs.has(poi.placeId)) continue;
        if (totalDuration + poi.estimatedDuration > maxDuration) continue;
        if (afternoonPOIs.reduce((sum, p) => sum + p.estimatedDuration, 0) + poi.estimatedDuration > 4) continue;
        
        afternoonPOIs.push(poi);
        usedPOIs.add(poi.placeId);
        totalDuration += poi.estimatedDuration;
        
        if (afternoonPOIs.length >= 2) break;
      }
      
      // Evening (up to 2 hours, usually dining or light activities)
      for (const poi of quickPOIs.filter(p => p.category === 'food' || p.category === 'nightlife')) {
        if (usedPOIs.has(poi.placeId)) continue;
        if (totalDuration + poi.estimatedDuration > maxDuration + 1) continue; // Allow slight overflow for dinner
        
        eveningPOIs.push(poi);
        usedPOIs.add(poi.placeId);
        totalDuration += poi.estimatedDuration;
        
        if (eveningPOIs.length >= 1) break;
      }
    }
    
    dayPlans.push({
      day,
      title: `Day ${day}: ${destination} Discovery`,
      description: fullDayActivity 
        ? `Full day at ${fullDayActivity.name}`
        : `Exploring the best of ${destination}`,
      morningPOIs,
      afternoonPOIs,
      eveningPOIs,
      totalDuration,
      feasibilityScore: totalDuration <= 8 ? 0.9 : 0.7
    });
  }
  
  return dayPlans;
}

// Convert DayPlan to the format expected by the existing system
export function convertToItineraryFormat(dayPlan: DayPlan, destination: string): any {
  const allPOIs = [
    ...dayPlan.morningPOIs.map(p => ({ ...p, timeLabel: 'Morning', time: 'morning' })),
    ...dayPlan.afternoonPOIs.map(p => ({ ...p, timeLabel: 'Afternoon', time: 'afternoon' })),
    ...dayPlan.eveningPOIs.map(p => ({ ...p, timeLabel: 'Evening', time: 'evening' }))
  ];
  
  return {
    day: dayPlan.day,
    location: destination,
    title: dayPlan.title,
    description: dayPlan.description,
    pois: allPOIs.map((poi: any) => ({
      id: `poi-${dayPlan.day}-${poi.placeId}`,
      name: poi.name,
      placeId: poi.placeId,
      category: poi.category,
      types: poi.types,
      rating: poi.rating,
      reviewCount: poi.reviewCount,
      reason: poi.reason,
      description: poi.description,
      address: poi.address,
      duration: poi.estimatedDuration >= 1 
        ? `${Math.round(poi.estimatedDuration)} hour${Math.round(poi.estimatedDuration) !== 1 ? 's' : ''}`
        : `${Math.round(poi.estimatedDuration * 60)} mins`,
      durationHours: poi.estimatedDuration,
      time: poi.time,
      timeLabel: poi.timeLabel
    })),
    activities: allPOIs.map((poi: any) => `${poi.name} - ${poi.reason}`)
  };
}