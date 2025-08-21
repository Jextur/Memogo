import { searchPlaces } from './googlePlaces';
import type { PackageGenerationRequest, GeneratedPackage } from './openai';

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
    'beach': 'beaches seaside',
    'spa': 'spa wellness centers',
    'onsen': 'hot springs onsen',
    
    // Generic interests
    'must-see highlights': 'top tourist attractions',
    'local food & culture': 'authentic local restaurants cultural sites',
    'hidden gems': 'off the beaten path attractions',
    'adventure': 'outdoor activities adventure sports',
    'family friendly': 'family attractions kids activities',
    'romantic': 'romantic restaurants couples activities',
    'budget': 'free attractions budget restaurants',
    'luxury': 'luxury hotels fine dining'
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
    
    return places.slice(0, count).map(place => ({
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
      minRating: 4.2,
      minReviews: 500
    });
    
    return places.slice(0, count).map(place => ({
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
      minRating: 4.0,
      minReviews: 200
    });
    
    return places.slice(0, count).map(place => ({
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
  selectedTags: string[],
  globalUsedPlaceIds: Set<string>  // Track POIs used across all days
): DayItinerary {
  const poisForDay: POIWithReason[] = [];
  
  // Distribute tag POIs across days to ensure each tag appears at least once
  // but don't repeat POIs that have been used on previous days
  const tagPOIsPerDay = Math.max(1, Math.ceil(tagPOIs.length / 3)); // Distribute evenly across days
  const startIdx = (dayNum - 1) * tagPOIsPerDay;
  const endIdx = Math.min(startIdx + tagPOIsPerDay, tagPOIs.length);
  
  // Add tag-related POIs for this day (1-2 per day)
  for (let i = startIdx; i < endIdx && poisForDay.length < 2; i++) {
    const poi = tagPOIs[i];
    if (poi && !globalUsedPlaceIds.has(poi.placeId)) {
      poisForDay.push(poi);
      globalUsedPlaceIds.add(poi.placeId);
    }
  }
  
  // If we couldn't add tag POIs for this day (all used), try remaining tag POIs
  if (poisForDay.length === 0 && tagPOIs.length > 0) {
    for (const poi of tagPOIs) {
      if (!globalUsedPlaceIds.has(poi.placeId)) {
        poisForDay.push(poi);
        globalUsedPlaceIds.add(poi.placeId);
        if (poisForDay.length >= 2) break;
      }
    }
  }
  
  // Add general attractions to fill the day (aim for 4-5 activities)
  const remainingSlots = 5 - poisForDay.length;
  let addedGeneral = 0;
  
  // Start from different indices for each day to ensure variety
  const generalStartIdx = (dayNum - 1) * 3;
  const rotatedGeneralPOIs = [
    ...generalPOIs.slice(generalStartIdx),
    ...generalPOIs.slice(0, generalStartIdx)
  ];
  
  for (const poi of rotatedGeneralPOIs) {
    if (addedGeneral >= remainingSlots) break;
    if (!globalUsedPlaceIds.has(poi.placeId)) {
      poisForDay.push(poi);
      globalUsedPlaceIds.add(poi.placeId);
      addedGeneral++;
    }
  }
  
  // Add at least one restaurant (different for each day)
  const restaurantIdx = (dayNum - 1) % restaurants.length;
  const restaurant = restaurants[restaurantIdx];
  if (restaurant && !globalUsedPlaceIds.has(restaurant.placeId)) {
    poisForDay.push(restaurant);
    globalUsedPlaceIds.add(restaurant.placeId);
  } else {
    // Try to find any unused restaurant
    for (const r of restaurants) {
      if (!globalUsedPlaceIds.has(r.placeId)) {
        poisForDay.push(r);
        globalUsedPlaceIds.add(r.placeId);
        break;
      }
    }
  }
  
  // Generate title based on what's included in this specific day
  const tagPOIsInDay = poisForDay.filter(poi => 
    poi.reason.includes('Selected for')
  );
  const tagsCovered = tagPOIsInDay.length > 0 
    ? `featuring ${tagPOIsInDay.map(p => p.reason.split('"')[1]).filter(Boolean).join(' & ')}`
    : 'exploring top attractions';
  
  // Log for debugging
  console.log(`Day ${dayNum} POIs:`, poisForDay.map(p => ({ 
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
  console.log('Number of tags:', request.selectedTags?.length || 0);
  
  const selectedTags = request.selectedTags || [];
  
  // Fetch POIs for each selected tag
  const tagPOIsPromises = selectedTags.map(tag => 
    searchPOIsForTag(tag, request.destination, Math.max(3, Math.ceil(request.days / 2)))
  );
  
  // Fetch general attractions and restaurants
  const [tagPOIsArrays, topAttractions, restaurants, hotels] = await Promise.all([
    Promise.all(tagPOIsPromises),
    getTopAttractions(request.destination, request.days * 3),
    getRestaurants(request.destination, request.days * 2),
    searchPlaces(`hotels in ${request.destination}`, { minRating: 4.0 })
  ]);
  
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
      topAttractions,
      restaurants,
      selectedTags,
      globalUsedPlaceIds  // Pass the global tracking set
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
  
  const missingTags = selectedTags.filter(tag => !tagsCovered.has(tag));
  if (missingTags.length > 0) {
    console.warn('Warning: Could not find POIs for tags:', missingTags);
  }
  
  // Generate three package variations
  const packages: GeneratedPackage[] = [
    {
      name: `Personalized ${request.destination} Experience`,
      type: 'classic' as const,
      budget: `$${1000 + (request.days * 200)}`,
      description: `Tailored to your interests: ${selectedTags.join(', ')}. Includes ${allTagPOIs.length} hand-picked venues matching your preferences plus must-see highlights.`,
      route: request.destination,
      accommodation: hotels[0]?.name || 'Recommended hotel',
      diningCount: restaurants.length,
      attractionCount: allTagPOIs.length + topAttractions.length,
      highlights: [...allTagPOIs.slice(0, 3), ...topAttractions.slice(0, 2)].map(p => p.name),
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
      diningCount: Math.min(restaurants.length, 12),
      attractionCount: Math.min(topAttractions.length + allTagPOIs.length, 10),
      highlights: [...restaurants.slice(0, 3), ...allTagPOIs.slice(0, 2)].map(p => p.name),
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
      diningCount: Math.min(restaurants.length, 5),
      attractionCount: Math.min(topAttractions.length, 10),
      highlights: [...allTagPOIs.slice(0, 2), ...topAttractions.slice(0, 3)].map(p => p.name),
      itinerary: itinerary.map(day => ({
        ...day,
        activities: day.activities.slice(0, 3) // Fewer activities for budget option
      }))
    }
  ];
  
  // Log coverage statistics
  console.log(`Tag coverage: ${tagsCovered.size}/${selectedTags.length} tags represented`);
  console.log(`Total unique POIs: ${allTagPOIs.length + topAttractions.length}`);
  console.log(`POIs with Place IDs: ${[...allTagPOIs, ...topAttractions].filter(p => p.placeId).length}`);
  console.log(`Global dedupe: ${globalUsedPlaceIds.size} unique POIs used across all days`);
  
  return packages;
}