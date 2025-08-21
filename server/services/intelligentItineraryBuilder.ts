import OpenAI from 'openai';
import type { POIWithReason } from './enhancedPackageGenerator';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY || ''
});

// Duration estimates based on POI type (in hours)
const DURATION_ESTIMATES: Record<string, number> = {
  // Full day activities
  'amusement_park': 8,
  'theme_park': 8,
  'zoo': 5,
  'aquarium': 3,
  
  // Half day activities
  'museum': 2.5,
  'art_gallery': 2,
  'temple': 1.5,
  'shrine': 1,
  'church': 1,
  'castle': 2.5,
  'palace': 3,
  
  // Quick visits
  'viewpoint': 0.5,
  'landmark': 1,
  'monument': 0.5,
  'tower': 1.5,
  'bridge': 0.5,
  
  // Shopping & Markets
  'shopping_mall': 3,
  'market': 2,
  'store': 1,
  
  // Food & Dining
  'restaurant': 1.5,
  'cafe': 1,
  'bar': 2,
  'food_court': 1,
  'street_food': 0.5,
  
  // Nature
  'park': 2,
  'garden': 1.5,
  'beach': 3,
  'hiking_trail': 4,
  'mountain': 5,
  
  // Entertainment
  'theater': 3,
  'cinema': 2.5,
  'casino': 3,
  'night_club': 3,
  
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
  // Check for theme parks and full-day attractions by name
  const name = poi.name?.toLowerCase() || '';
  
  if (name.includes('disneyland') || name.includes('disney') || 
      name.includes('universal studios') || name.includes('theme park')) {
    return 8; // Full day for theme parks
  }
  
  if (name.includes('zoo') || name.includes('safari')) {
    return 5;
  }
  
  if (name.includes('aquarium') || name.includes('sea world')) {
    return 3;
  }
  
  if (name.includes('tower') && (name.includes('tokyo') || name.includes('eiffel') || 
      name.includes('cn') || name.includes('skytree'))) {
    return 1.5; // Major towers need more time for queues
  }
  
  if (name.includes('museum') && (name.includes('national') || name.includes('art'))) {
    return 3; // Major museums need more time
  }
  
  // Check POI types from Google Places
  if (poi.types && Array.isArray(poi.types)) {
    for (const type of poi.types) {
      if (DURATION_ESTIMATES[type]) {
        return DURATION_ESTIMATES[type];
      }
    }
  }
  
  // Category-based fallback
  const category = poi.category?.toLowerCase();
  if (category) {
    switch (category) {
      case 'food':
        return 1.5;
      case 'culture':
        return 2.5;
      case 'shopping':
        return 2;
      case 'nature':
        return 2;
      case 'nightlife':
        return 2.5;
      default:
        return 2;
    }
  }
  
  return DURATION_ESTIMATES.default;
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
      rating: poi.rating,
      reviewCount: poi.reviewCount,
      reason: poi.reason,
      duration: `~${Math.round(poi.estimatedDuration)} hour${poi.estimatedDuration !== 1 ? 's' : ''}`,
      time: poi.time,
      timeLabel: poi.timeLabel
    })),
    activities: allPOIs.map((poi: any) => `${poi.name} - ${poi.reason}`)
  };
}