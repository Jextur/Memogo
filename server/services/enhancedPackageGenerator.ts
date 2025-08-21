import { searchPlaces } from './googlePlaces';
import type { PackageGenerationRequest, GeneratedPackage } from './openai';
import { filterPOIs } from '../utils/safetyFilters';

interface POIWithReason {
  name: string;
  placeId: string;
  reason: string;
  rating?: number;
  reviewCount?: number;
  category: string;
}

interface DayItinerary {
  day: number;
  location: string;
  title: string;
  description: string;
  activities: string[];
  poisWithReasons?: POIWithReason[];
}

interface EnhancedPackageGenerationRequest extends PackageGenerationRequest {
  selectedTags?: string[];
  freeTextPreferences?: string[];
}

// Map tags to Google Places search queries
function getSearchQueryForTag(tag: string, destination: string): string {
  const tagMappings: Record<string, string> = {
    // Food tags
    'ramen': 'ramen restaurants',
    'sushi': 'sushi restaurants',
    'street food': 'street food markets',
    'local cuisine': 'traditional restaurants',
    'michelin': 'michelin star restaurants',
    'coffee': 'specialty coffee shops',
    'bakery': 'artisan bakeries',
    
    // Water activities (from free-text)
    'water activities': 'water parks onsen hot springs beaches swimming pools aquariums',
    'play water': 'water parks beaches swimming pools water sports',
    'onsen': 'hot springs onsen spa',
    'beach': 'beaches seaside water sports',
    'aquarium': 'aquariums marine life exhibits',
    
    // Landmarks & Attractions
    'tokyo tower': 'Tokyo Tower observation deck',
    'eiffel tower': 'Eiffel Tower',
    'statue of liberty': 'Statue of Liberty',
    'golden gate bridge': 'Golden Gate Bridge',
    'big ben': 'Big Ben Westminster',
    
    // Districts & Neighborhoods
    'shibuya': 'Shibuya crossing district',
    'akihabara': 'Akihabara electronics district',
    'times square': 'Times Square',
    'central park': 'Central Park',
    'las vegas strip': 'Las Vegas Strip casinos',
    'the strip': 'Las Vegas Strip',
    
    // Experiences
    'museums': 'art museums',
    'temples': 'buddhist temples shrines',
    'shopping': 'shopping malls markets',
    'nightlife': 'bars nightclubs',
    'jazz': 'jazz bars clubs',
    'broadway': 'broadway theaters shows',
    'spa': 'spa wellness centers',
    
    // Generic interests
    'must-see highlights': 'top tourist attractions',
    'local food & culture': 'authentic local restaurants cultural sites',
    'local food': 'authentic local restaurants food markets street food',
    'cultural sites': 'temples shrines museums historical sites',
    'hidden gems': 'off the beaten path attractions',
    'adventure': 'outdoor activities adventure sports',
    'family friendly': 'family attractions kids activities',
    'romantic': 'romantic restaurants couples activities',
    'budget': 'free attractions budget restaurants',
    'luxury': 'luxury hotels fine dining',
    'nature': 'parks gardens mountains hiking trails nature reserves'
  };

  const lowerTag = tag.toLowerCase();
  const baseQuery = tagMappings[lowerTag] || tag;
  return `${baseQuery} in ${destination}`;
}

// Determine POI category based on types from Google Places
function categorizePOI(types: string[]): string {
  if (types.some(t => ['restaurant', 'food', 'cafe', 'bakery', 'bar'].includes(t))) {
    return 'food';
  }
  if (types.some(t => ['museum', 'art_gallery', 'church', 'temple', 'shrine'].includes(t))) {
    return 'culture';
  }
  if (types.some(t => ['shopping_mall', 'store', 'market'].includes(t))) {
    return 'shopping';
  }
  if (types.some(t => ['night_club', 'bar', 'casino'].includes(t))) {
    return 'nightlife';
  }
  if (types.some(t => ['park', 'natural_feature', 'campground'].includes(t))) {
    return 'nature';
  }
  return 'attraction';
}

async function searchPOIsForTag(tag: string, destination: string, count: number = 3): Promise<POIWithReason[]> {
  const query = getSearchQueryForTag(tag, destination);
  
  try {
    const places = await searchPlaces(query, {
      minRating: 4.0,
      minReviews: 100
    });
    
    // Apply safety filters to remove inappropriate POIs
    const filteredPlaces = filterPOIs(places);
    
    return filteredPlaces.slice(0, count).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Selected for "${tag}" - ${place.rating ? `rated ${place.rating}★` : 'popular choice'} with ${place.user_ratings_total || 0} reviews`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: categorizePOI(place.types || [])
    }));
  } catch (error) {
    console.error(`Failed to search POIs for tag "${tag}":`, error);
    return [];
  }
}

async function getTopAttractions(destination: string, count: number = 10): Promise<POIWithReason[]> {
  try {
    const places = await searchPlaces(`top attractions in ${destination}`, {
      minRating: 3.8,  // Lower threshold to get more results
      minReviews: 100  // Lower threshold to get more results
    });
    
    // Apply safety filters
    const filteredPlaces = filterPOIs(places);
    
    return filteredPlaces.slice(0, count).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Must-see attraction - ${place.rating ? `rated ${place.rating}★` : 'highly popular'} with ${place.user_ratings_total || 0} reviews`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: categorizePOI(place.types || [])
    }));
  } catch (error) {
    console.error(`Failed to get top attractions for ${destination}:`, error);
    return [];
  }
}

async function getRestaurants(destination: string, count: number = 10): Promise<POIWithReason[]> {
  try {
    const places = await searchPlaces(`best restaurants in ${destination}`, {
      minRating: 3.8,  // Lower threshold to get more results
      minReviews: 50   // Lower threshold to get more results
    });
    
    // Apply safety filters
    const filteredPlaces = filterPOIs(places);
    
    return filteredPlaces.slice(0, count).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Highly-rated dining - ${place.rating ? `${place.rating}★` : 'popular'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: 'food'
    }));
  } catch (error) {
    console.error(`Failed to get restaurants for ${destination}:`, error);
    return [];
  }
}

function buildDayItinerary(
  dayNum: number,
  destination: string,
  tagPOIs: POIWithReason[],
  generalPOIs: POIWithReason[],
  restaurants: POIWithReason[],
  allPreferences: string[],  // Changed from selectedTags to allPreferences
  globalUsedPlaceIds: Set<string>,  // Track POIs used across all days
  totalDays: number  // Add total days to properly distribute
): DayItinerary {
  const poisForDay: POIWithReason[] = [];
  const TARGET_ACTIVITIES_PER_DAY = 5; // Consistent target for all days
  
  // Distribute tag POIs evenly across ALL days
  const availableTagPOIs = tagPOIs.filter(poi => !globalUsedPlaceIds.has(poi.placeId));
  const tagPOIsPerDay = Math.ceil(availableTagPOIs.length / (totalDays - dayNum + 1));
  
  // Add 1-2 tag POIs for this day
  let tagCount = 0;
  for (const poi of availableTagPOIs) {
    if (tagCount >= Math.min(2, tagPOIsPerDay)) break;
    if (!globalUsedPlaceIds.has(poi.placeId)) {
      poisForDay.push(poi);
      globalUsedPlaceIds.add(poi.placeId);
      tagCount++;
    }
  }
  
  // Calculate how many general POIs we need
  const generalNeeded = TARGET_ACTIVITIES_PER_DAY - poisForDay.length - 1; // -1 for restaurant
  
  // Get unused general POIs
  const availableGeneralPOIs = generalPOIs.filter(poi => !globalUsedPlaceIds.has(poi.placeId));
  
  // Use different starting points for variety, but ensure we have enough POIs
  const chunkSize = Math.max(5, Math.ceil(availableGeneralPOIs.length / totalDays));
  const startIdx = Math.min((dayNum - 1) * chunkSize, Math.max(0, availableGeneralPOIs.length - generalNeeded));
  
  // Add general attractions
  let addedGeneral = 0;
  for (let i = startIdx; i < availableGeneralPOIs.length && addedGeneral < generalNeeded; i++) {
    const poi = availableGeneralPOIs[i];
    if (!globalUsedPlaceIds.has(poi.placeId)) {
      poisForDay.push(poi);
      globalUsedPlaceIds.add(poi.placeId);
      addedGeneral++;
    }
  }
  
  // If we still need more, look from the beginning
  if (addedGeneral < generalNeeded) {
    for (let i = 0; i < startIdx && addedGeneral < generalNeeded; i++) {
      const poi = availableGeneralPOIs[i];
      if (!globalUsedPlaceIds.has(poi.placeId)) {
        poisForDay.push(poi);
        globalUsedPlaceIds.add(poi.placeId);
        addedGeneral++;
      }
    }
  }
  
  // Add a restaurant for dining
  const availableRestaurants = restaurants.filter(r => !globalUsedPlaceIds.has(r.placeId));
  if (availableRestaurants.length > 0) {
    // Try to pick different restaurants for each day
    const restaurantIdx = (dayNum - 1) % availableRestaurants.length;
    const restaurant = availableRestaurants[restaurantIdx] || availableRestaurants[0];
    if (restaurant) {
      poisForDay.push(restaurant);
      globalUsedPlaceIds.add(restaurant.placeId);
    }
  }
  
  // Generate title based on what's included in this specific day
  const tagPOIsInDay = poisForDay.filter(poi => 
    poi.reason.includes('Selected for')
  );
  const tagsCovered = tagPOIsInDay.length > 0 
    ? `featuring ${tagPOIsInDay.map(p => p.reason.split('"')[1]).filter(Boolean).join(' & ')}`
    : 'exploring top attractions';
  
  // Ensure minimum activities per day (fill with any available POIs if needed)
  if (poisForDay.length < 4) {
    console.warn(`Day ${dayNum} only has ${poisForDay.length} activities. Attempting to add more...`);
    
    // Try to add any unused POIs from all sources
    const allAvailable = [...tagPOIs, ...generalPOIs, ...restaurants]
      .filter(poi => !globalUsedPlaceIds.has(poi.placeId));
    
    for (const poi of allAvailable) {
      if (poisForDay.length >= 4) break;
      poisForDay.push(poi);
      globalUsedPlaceIds.add(poi.placeId);
    }
  }
  
  // Log for debugging
  console.log(`Day ${dayNum} POIs (${poisForDay.length} total):`, poisForDay.map(p => ({ 
    name: p.name, 
    placeId: p.placeId,
    source: p.reason.includes('Selected for') ? 'tag' : 'discovery'
  })));
  
  return {
    day: dayNum,
    location: destination,
    title: `Day ${dayNum}: ${destination} ${tagsCovered}`,
    description: `Experience the best of ${destination} with a mix of your selected interests and must-see highlights`,
    activities: poisForDay.map(poi => `${poi.name} - ${poi.reason}`),
    poisWithReasons: poisForDay
  };
}

export async function generateEnhancedTravelPackages(
  request: EnhancedPackageGenerationRequest
): Promise<GeneratedPackage[]> {
  console.log('=== ENHANCED PACKAGE GENERATION ===');
  console.log('Destination:', request.destination);
  console.log('Days:', request.days);
  console.log('People:', request.people);
  console.log('Theme:', request.theme);
  console.log('Selected tags:', request.selectedTags);
  console.log('Free-text preferences:', request.freeTextPreferences);
  console.log('Number of tags:', request.selectedTags?.length || 0);
  console.log('Number of free-text preferences:', request.freeTextPreferences?.length || 0);
  
  // Merge selected tags with free-text preferences
  const selectedTags = request.selectedTags || [];
  const freeTextPreferences = request.freeTextPreferences || [];
  const allPreferences = [...selectedTags, ...freeTextPreferences];
  
  // Fetch POIs for all preferences (selected tags + free-text) - get more for longer trips
  const tagPOIsPromises = allPreferences.map(tag => 
    searchPOIsForTag(tag, request.destination, Math.max(5, request.days))
  );
  
  // Fetch more POIs to ensure we have enough for all days (at least 5-6 per day)
  const attractionsNeeded = Math.max(20, request.days * 6);
  const restaurantsNeeded = Math.max(10, request.days * 2);
  
  // Fetch multiple types of attractions to get more variety
  const [tagPOIsArrays, topAttractions, museums, parks, shopping, restaurants, cafes, hotels] = await Promise.all([
    Promise.all(tagPOIsPromises),
    getTopAttractions(request.destination, attractionsNeeded),
    searchPlaces(`museums in ${request.destination}`, { minRating: 3.8, minReviews: 50 }),
    searchPlaces(`parks gardens in ${request.destination}`, { minRating: 3.8, minReviews: 50 }),
    searchPlaces(`shopping markets in ${request.destination}`, { minRating: 3.8, minReviews: 50 }),
    getRestaurants(request.destination, restaurantsNeeded),
    searchPlaces(`cafes coffee shops in ${request.destination}`, { minRating: 3.8, minReviews: 50 }),
    searchPlaces(`hotels in ${request.destination}`, { minRating: 4.0 })
  ]);
  
  // Combine all general attractions
  const allGeneralAttractions = [
    ...topAttractions,
    ...museums.slice(0, 5).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Cultural experience - ${place.rating ? `rated ${place.rating}★` : 'interesting'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: 'culture'
    })),
    ...parks.slice(0, 5).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Green space - ${place.rating ? `rated ${place.rating}★` : 'relaxing'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: 'nature'
    })),
    ...shopping.slice(0, 5).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Shopping destination - ${place.rating ? `rated ${place.rating}★` : 'popular'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: 'shopping'
    }))
  ];
  
  // Combine all dining options
  const allDiningOptions = [
    ...restaurants,
    ...cafes.slice(0, 5).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Coffee & refreshments - ${place.rating ? `rated ${place.rating}★` : 'cozy'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: 'food'
    }))
  ];
  
  // Flatten and deduplicate tag POIs
  const allTagPOIs: POIWithReason[] = [];
  const seenPlaceIds = new Set<string>();
  
  tagPOIsArrays.forEach(pois => {
    pois.forEach(poi => {
      if (!seenPlaceIds.has(poi.placeId)) {
        allTagPOIs.push(poi);
        seenPlaceIds.add(poi.placeId);
      }
    });
  });
  
  // Build itinerary for each day
  const itinerary: DayItinerary[] = [];
  const globalUsedPlaceIds = new Set<string>(); // Track used POIs across all days
  
  for (let day = 1; day <= request.days; day++) {
    itinerary.push(buildDayItinerary(
      day,
      request.destination,
      allTagPOIs,
      allGeneralAttractions,
      allDiningOptions,
      allPreferences,  // Pass all preferences (tags + free-text)
      globalUsedPlaceIds,  // Pass the global tracking set
      request.days  // Pass total days for better distribution
    ));
  }
  
  // Validate tag coverage
  const tagsCovered = new Set<string>();
  allTagPOIs.forEach(poi => {
    const tagMatch = poi.reason.match(/"([^"]+)"/);
    if (tagMatch) {
      tagsCovered.add(tagMatch[1]);
    }
  });
  
  const missingTags = allPreferences.filter(tag => !tagsCovered.has(tag));
  if (missingTags.length > 0) {
    console.warn('Warning: Could not find POIs for preferences:', missingTags);
  }
  
  // Generate three package variations
  const packages: GeneratedPackage[] = [
    {
      name: `Personalized ${request.destination} Experience`,
      type: 'classic' as const,
      budget: `$${1000 + (request.days * 200)}`,
      description: `Tailored to your interests: ${allPreferences.join(', ')}. Includes ${allTagPOIs.length} hand-picked venues matching your preferences plus must-see highlights.`,
      route: request.destination,
      accommodation: hotels[0]?.name || 'Recommended hotel',
      diningCount: allDiningOptions.length,
      attractionCount: allTagPOIs.length + allGeneralAttractions.length,
      highlights: [...allTagPOIs.slice(0, 3), ...allGeneralAttractions.slice(0, 2)].map(p => p.name),
      itinerary: itinerary.map(day => ({
        day: day.day,
        location: day.location,
        title: day.title,
        description: day.description,
        activities: day.activities
      }))
    },
    {
      name: `Foodie ${request.destination} Experience`,
      type: 'foodie' as const,
      budget: `$${800 + (request.days * 150)}`,
      description: `A culinary journey through ${request.destination}${selectedTags.length > 0 ? ' featuring your selected interests' : ''}. Perfect for food lovers.`,
      route: request.destination,
      accommodation: hotels[1]?.name || 'Quality hotel',
      diningCount: Math.min(allDiningOptions.length, 12),
      attractionCount: Math.min(allGeneralAttractions.length + allTagPOIs.length, 10),
      highlights: [...allDiningOptions.slice(0, 3), ...allTagPOIs.slice(0, 2)].map(p => p.name),
      itinerary: itinerary.map(day => ({
        ...day,
        activities: day.activities.slice(0, 4) // Slightly fewer activities
      }))
    },
    {
      name: `Budget ${request.destination} Discovery`,
      type: 'budget' as const,
      budget: `$${500 + (request.days * 100)}`,
      description: `Affordable exploration focusing on free and low-cost attractions${selectedTags.length > 0 ? ' including your interests' : ''}.`,
      route: request.destination,
      accommodation: 'Budget-friendly accommodation',
      diningCount: Math.min(allDiningOptions.length, 5),
      attractionCount: Math.min(allGeneralAttractions.length, 10),
      highlights: [...allTagPOIs.slice(0, 2), ...allGeneralAttractions.slice(0, 3)].map(p => p.name),
      itinerary: itinerary.map(day => ({
        ...day,
        activities: day.activities.slice(0, 3) // Fewer activities for budget option
      }))
    }
  ];
  
  // Log coverage statistics
  console.log(`Tag coverage: ${tagsCovered.size}/${selectedTags.length} tags represented`);
  console.log(`Total unique POIs available: ${allTagPOIs.length + allGeneralAttractions.length + allDiningOptions.length}`);
  console.log(`POIs with Place IDs: ${[...allTagPOIs, ...allGeneralAttractions, ...allDiningOptions].filter(p => p.placeId).length}`);
  console.log(`Global dedupe: ${globalUsedPlaceIds.size} unique POIs used across all days`);
  
  return packages;
}