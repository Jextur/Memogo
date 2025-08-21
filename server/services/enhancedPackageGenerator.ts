import { searchPlaces } from './googlePlaces';
import type { PackageGenerationRequest, GeneratedPackage } from './openai';
import { filterPOIs } from '../utils/safetyFilters';
import { 
  estimatePOIDuration, 
  createIntelligentItinerary, 
  convertToItineraryFormat,
  type EnhancedPOI 
} from './intelligentItineraryBuilder';

export interface POIWithReason {
  name: string;
  placeId: string;
  reason: string;
  rating?: number;
  reviewCount?: number;
  category: string;
  types?: string[];
  description?: string;
  address?: string;
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
  // Check types in order of specificity
  if (!types || types.length === 0) return 'Attraction';
  
  // Food & Dining
  if (types.some(t => t.includes('restaurant'))) {
    if (types.includes('fine_dining_restaurant')) return 'Fine Dining';
    if (types.includes('fast_food_restaurant')) return 'Fast Food';
    if (types.includes('seafood_restaurant')) return 'Seafood';
    if (types.includes('steak_house')) return 'Steakhouse';
    if (types.includes('sushi_restaurant')) return 'Sushi';
    if (types.includes('pizza_restaurant')) return 'Pizza';
    if (types.includes('chinese_restaurant')) return 'Chinese Restaurant';
    if (types.includes('italian_restaurant')) return 'Italian Restaurant';
    if (types.includes('mexican_restaurant')) return 'Mexican Restaurant';
    if (types.includes('japanese_restaurant')) return 'Japanese Restaurant';
    if (types.includes('thai_restaurant')) return 'Thai Restaurant';
    if (types.includes('indian_restaurant')) return 'Indian Restaurant';
    if (types.includes('vegetarian_restaurant')) return 'Vegetarian';
    return 'Restaurant';
  }
  if (types.includes('cafe')) return 'Cafe';
  if (types.includes('coffee_shop')) return 'Coffee Shop';
  if (types.includes('bakery')) return 'Bakery';
  if (types.includes('bar')) return 'Bar';
  if (types.includes('pub')) return 'Pub';
  if (types.includes('brewery')) return 'Brewery';
  if (types.includes('winery')) return 'Winery';
  if (types.includes('food_court')) return 'Food Court';
  if (types.includes('food_market')) return 'Food Market';
  if (types.includes('ice_cream_shop')) return 'Ice Cream';
  if (types.includes('dessert_shop')) return 'Dessert';
  if (types.some(t => t.includes('food'))) return 'Food';
  
  // Museums & Culture
  if (types.some(t => t.includes('museum'))) {
    if (types.includes('art_museum')) return 'Art Museum';
    if (types.includes('history_museum')) return 'History Museum';
    if (types.includes('science_museum')) return 'Science Museum';
    if (types.includes('natural_history_museum')) return 'Natural History Museum';
    if (types.includes('children_museum')) return 'Children\'s Museum';
    return 'Museum';
  }
  if (types.includes('art_gallery')) return 'Art Gallery';
  if (types.includes('performing_arts_theater')) return 'Theater';
  if (types.includes('opera_house')) return 'Opera House';
  if (types.includes('concert_hall')) return 'Concert Hall';
  if (types.includes('movie_theater')) return 'Cinema';
  if (types.includes('library')) return 'Library';
  if (types.includes('cultural_center')) return 'Cultural Center';
  
  // Religious Sites
  if (types.includes('church')) return 'Church';
  if (types.includes('cathedral')) return 'Cathedral';
  if (types.includes('temple')) return 'Temple';
  if (types.includes('buddhist_temple')) return 'Buddhist Temple';
  if (types.includes('hindu_temple')) return 'Hindu Temple';
  if (types.includes('shrine')) return 'Shrine';
  if (types.includes('mosque')) return 'Mosque';
  if (types.includes('synagogue')) return 'Synagogue';
  if (types.includes('cemetery')) return 'Cemetery';
  if (types.includes('place_of_worship')) return 'Religious Site';
  
  // Historical Sites
  if (types.includes('castle')) return 'Castle';
  if (types.includes('palace')) return 'Palace';
  if (types.includes('fortress')) return 'Fortress';
  if (types.includes('historical_landmark')) return 'Historical Site';
  if (types.includes('unesco_world_heritage_site')) return 'UNESCO Site';
  if (types.includes('monument')) return 'Monument';
  if (types.includes('memorial')) return 'Memorial';
  if (types.includes('ruins')) return 'Ruins';
  
  // Shopping
  if (types.includes('shopping_mall')) return 'Shopping Mall';
  if (types.includes('outlet_mall')) return 'Outlet Mall';
  if (types.includes('department_store')) return 'Department Store';
  if (types.includes('market')) return 'Market';
  if (types.includes('local_market')) return 'Local Market';
  if (types.includes('farmers_market')) return 'Farmers Market';
  if (types.includes('flea_market')) return 'Flea Market';
  if (types.includes('night_market')) return 'Night Market';
  if (types.includes('bookstore')) return 'Bookstore';
  if (types.includes('clothing_store')) return 'Clothing Store';
  if (types.includes('jewelry_store')) return 'Jewelry Store';
  if (types.includes('gift_shop')) return 'Gift Shop';
  if (types.includes('souvenir_shop')) return 'Souvenir Shop';
  if (types.includes('antique_store')) return 'Antique Store';
  if (types.some(t => t.includes('store') || t.includes('shop'))) return 'Shop';
  
  // Entertainment & Nightlife
  if (types.includes('amusement_park')) return 'Amusement Park';
  if (types.includes('theme_park')) return 'Theme Park';
  if (types.includes('water_park')) return 'Water Park';
  if (types.includes('night_club')) return 'Night Club';
  if (types.includes('casino')) return 'Casino';
  if (types.includes('bowling_alley')) return 'Bowling';
  if (types.includes('arcade')) return 'Arcade';
  if (types.includes('escape_room')) return 'Escape Room';
  if (types.includes('karaoke')) return 'Karaoke';
  if (types.includes('stadium')) return 'Stadium';
  if (types.includes('sports_complex')) return 'Sports Complex';
  
  // Nature & Outdoors
  if (types.includes('national_park')) return 'National Park';
  if (types.includes('park')) return 'Park';
  if (types.includes('city_park')) return 'City Park';
  if (types.includes('botanical_garden')) return 'Botanical Garden';
  if (types.includes('garden')) return 'Garden';
  if (types.includes('japanese_garden')) return 'Japanese Garden';
  if (types.includes('arboretum')) return 'Arboretum';
  if (types.includes('beach')) return 'Beach';
  if (types.includes('lake')) return 'Lake';
  if (types.includes('mountain_peak')) return 'Mountain';
  if (types.includes('hiking_area')) return 'Hiking Trail';
  if (types.includes('campground')) return 'Campground';
  if (types.includes('natural_feature')) return 'Natural Feature';
  if (types.includes('waterfall')) return 'Waterfall';
  if (types.includes('hot_spring')) return 'Hot Spring';
  
  // Animals & Wildlife
  if (types.includes('zoo')) return 'Zoo';
  if (types.includes('aquarium')) return 'Aquarium';
  if (types.includes('safari_park')) return 'Safari Park';
  if (types.includes('wildlife_park')) return 'Wildlife Park';
  if (types.includes('animal_shelter')) return 'Animal Shelter';
  
  // Wellness & Relaxation
  if (types.includes('spa')) return 'Spa';
  if (types.includes('wellness_center')) return 'Wellness Center';
  if (types.includes('yoga_studio')) return 'Yoga Studio';
  if (types.includes('gym')) return 'Gym';
  if (types.includes('fitness_center')) return 'Fitness Center';
  
  // Landmarks & Viewpoints
  if (types.includes('landmark')) return 'Landmark';
  if (types.includes('viewpoint')) return 'Viewpoint';
  if (types.includes('scenic_spot')) return 'Scenic Spot';
  if (types.includes('observation_deck')) return 'Observation Deck';
  if (types.includes('tower')) return 'Tower';
  if (types.includes('lighthouse')) return 'Lighthouse';
  if (types.includes('bridge')) return 'Bridge';
  if (types.includes('fountain')) return 'Fountain';
  if (types.includes('statue')) return 'Statue';
  
  // Districts & Areas
  if (types.includes('neighborhood')) return 'Neighborhood';
  if (types.includes('town_square')) return 'Town Square';
  if (types.includes('plaza')) return 'Plaza';
  if (types.includes('promenade')) return 'Promenade';
  if (types.includes('pier')) return 'Pier';
  if (types.includes('harbor')) return 'Harbor';
  if (types.includes('marina')) return 'Marina';
  
  // Transportation (usually not attractions but might appear)
  if (types.includes('train_station')) return 'Train Station';
  if (types.includes('subway_station')) return 'Subway Station';
  if (types.includes('airport')) return 'Airport';
  if (types.includes('ferry_terminal')) return 'Ferry Terminal';
  
  // Education
  if (types.includes('university')) return 'University';
  if (types.includes('school')) return 'School';
  
  // Generic categories based on common type patterns
  if (types.includes('tourist_attraction')) return 'Tourist Attraction';
  if (types.includes('point_of_interest')) return 'Point of Interest';
  
  // Fallback to first type that's not too generic
  const meaningfulTypes = types.filter(t => 
    !['establishment', 'point_of_interest', 'tourist_attraction'].includes(t)
  );
  
  if (meaningfulTypes.length > 0) {
    // Format the type name nicely
    const type = meaningfulTypes[0];
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  return 'Attraction';
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
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
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
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
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
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
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
  console.log('=== INTELLIGENT PACKAGE GENERATION ===');
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
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
    })),
    ...parks.slice(0, 5).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Green space - ${place.rating ? `rated ${place.rating}★` : 'relaxing'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
    })),
    ...shopping.slice(0, 5).map(place => ({
      name: place.name,
      placeId: place.place_id,
      reason: `Shopping destination - ${place.rating ? `rated ${place.rating}★` : 'popular'} (${place.user_ratings_total || 0} reviews)`,
      rating: place.rating,
      reviewCount: place.user_ratings_total,
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
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
      category: categorizePOI(place.types || []),
      types: place.types,
      description: place.description,
      address: place.address
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
  
  // Enhance all POIs with duration estimates
  const enhancedPOIs: EnhancedPOI[] = [
    ...allTagPOIs,
    ...allGeneralAttractions,
    ...allDiningOptions
  ].map(poi => ({
    ...poi,
    estimatedDuration: estimatePOIDuration(poi),
    types: (poi as any).types || [],
    openingHours: (poi as any).openingHours,
    geometry: (poi as any).geometry
  }));
  
  // Use intelligent itinerary builder
  const dayPlans = await createIntelligentItinerary(
    enhancedPOIs,
    request.days,
    request.destination,
    allPreferences
  );
  
  // Convert to the expected format
  const itinerary = dayPlans.map(dayPlan => 
    convertToItineraryFormat(dayPlan, request.destination)
  )
  
  // Validate tag coverage in the intelligent itinerary
  const usedPOIs = new Set<string>();
  dayPlans.forEach(plan => {
    [...plan.morningPOIs, ...plan.afternoonPOIs, ...plan.eveningPOIs].forEach(poi => {
      usedPOIs.add(poi.placeId);
    });
  });
  
  const tagsCovered = new Set<string>();
  allTagPOIs.forEach(poi => {
    if (usedPOIs.has(poi.placeId)) {
      const tagMatch = poi.reason.match(/"([^"]+)"/);
      if (tagMatch) {
        tagsCovered.add(tagMatch[1]);
      }
    }
  });
  
  const missingTags = allPreferences.filter(tag => !tagsCovered.has(tag));
  if (missingTags.length > 0) {
    console.warn('Warning: Some preferences not fully covered:', missingTags);
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
      itinerary: itinerary
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
        activities: day.activities.slice(0, 4), // Slightly fewer activities
        pois: day.pois ? day.pois.slice(0, 4) : undefined // Also limit POIs
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
        activities: day.activities.slice(0, 3), // Fewer activities for budget option
        pois: day.pois ? day.pois.slice(0, 3) : undefined // Also limit POIs
      }))
    }
  ];
  
  // Log coverage statistics
  console.log(`Tag coverage: ${tagsCovered.size}/${allPreferences.length} preferences represented`);
  console.log(`Total unique POIs available: ${enhancedPOIs.length}`);
  console.log(`POIs used in itinerary: ${usedPOIs.size}`);
  console.log(`Average feasibility score: ${dayPlans.reduce((sum, p) => sum + p.feasibilityScore, 0) / dayPlans.length}`);
  
  return packages;
}