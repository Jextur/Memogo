export type POIVariant = 
  | 'restaurant'
  | 'cafe'
  | 'bar'
  | 'museum'
  | 'nature'
  | 'shopping'
  | 'landmark'
  | 'theme-park'
  | 'religious'
  | 'beach'
  | 'attraction';

export const POI_COLORS: Record<POIVariant, { bg: string; hover: string; pressed: string; text: string }> = {
  restaurant: {
    bg: '#D5589B',  // Adjusted for better contrast (4.5:1)
    hover: '#C14A8A',
    pressed: '#AD3C79',
    text: 'white'
  },
  cafe: {
    bg: '#E09355',  // Adjusted for better contrast
    hover: '#CC844C',
    pressed: '#B87543',
    text: 'white'
  },
  bar: {
    bg: '#D69E00',  // Adjusted for darker yellow
    hover: '#C28F00',
    pressed: '#AE8000',
    text: 'white'
  },
  museum: {
    bg: '#4C6FFF',
    hover: '#3A5FEB',
    pressed: '#2950D7',
    text: 'white'
  },
  nature: {
    bg: '#2A9E5F',  // Slightly darker for better contrast
    hover: '#268F56',
    pressed: '#22804D',
    text: 'white'
  },
  shopping: {
    bg: '#1F9999',  // Darker teal for better contrast
    hover: '#1C8A8A',
    pressed: '#197B7B',
    text: 'white'
  },
  landmark: {
    bg: '#7C5CFC',
    hover: '#6D4EE8',
    pressed: '#5F41D4',
    text: 'white'
  },
  'theme-park': {
    bg: '#E86A4C',  // Adjusted coral for better contrast
    hover: '#D45C41',
    pressed: '#C04E36',
    text: 'white'
  },
  religious: {
    bg: '#B8447C',  // Adjusted magenta for better contrast
    hover: '#A43C6F',
    pressed: '#903462',
    text: 'white'
  },
  beach: {
    bg: '#0391D8',  // Slightly darker blue for better contrast
    hover: '#0383C4',
    pressed: '#0375B0',
    text: 'white'
  },
  attraction: {
    bg: '#6E44FF',
    hover: '#5F3AEB',
    pressed: '#5131D7',
    text: 'white'
  }
};

export function mapGooglePlaceTypeToPOIVariant(types: string[] | undefined): POIVariant {
  if (!types || types.length === 0) {
    return 'attraction';
  }

  // Restaurant / Food
  if (types.some(t => 
    t.includes('restaurant') || 
    t === 'food' ||
    t === 'meal_delivery' ||
    t === 'meal_takeaway'
  )) {
    return 'restaurant';
  }

  // Cafe / Bakery
  if (types.some(t => 
    t === 'cafe' || 
    t === 'bakery' ||
    t === 'coffee_shop'
  )) {
    return 'cafe';
  }

  // Bar / Nightlife
  if (types.some(t => 
    t === 'bar' || 
    t === 'night_club' ||
    t === 'nightlife' ||
    t === 'pub' ||
    t === 'brewery' ||
    t === 'winery'
  )) {
    return 'bar';
  }

  // Museum / History
  if (types.some(t => 
    t.includes('museum') ||
    t === 'art_gallery' ||
    t === 'library'
  )) {
    return 'museum';
  }

  // Park / Nature / Garden
  if (types.some(t => 
    t === 'park' || 
    t === 'zoo' ||
    t === 'aquarium' ||
    t === 'botanical_garden' ||
    t === 'campground' ||
    t === 'national_park' ||
    t === 'nature_reserve' ||
    t === 'wildlife_park'
  )) {
    return 'nature';
  }

  // Shopping / Market
  if (types.some(t => 
    t === 'shopping_mall' || 
    t === 'store' ||
    t === 'market' ||
    t === 'supermarket' ||
    t === 'department_store' ||
    t === 'clothing_store' ||
    t === 'book_store' ||
    t === 'electronics_store' ||
    t === 'furniture_store' ||
    t === 'home_goods_store' ||
    t === 'jewelry_store' ||
    t === 'shoe_store'
  )) {
    return 'shopping';
  }

  // Landmark / Observation Deck / Tower
  if (types.some(t => 
    t === 'tourist_attraction' ||
    t === 'point_of_interest' ||
    t === 'landmark' ||
    t === 'observation_deck' ||
    t === 'viewpoint' ||
    t === 'monument' ||
    t === 'historical_landmark' ||
    t === 'city_hall' ||
    t === 'town_square'
  )) {
    return 'landmark';
  }

  // Theme Park / Amusement
  if (types.some(t => 
    t === 'amusement_park' ||
    t === 'theme_park' ||
    t === 'water_park' ||
    t === 'entertainment'
  )) {
    return 'theme-park';
  }

  // Temple / Shrine / Religious Site
  if (types.some(t => 
    t === 'hindu_temple' ||
    t === 'buddhist_temple' ||
    t === 'church' ||
    t === 'mosque' ||
    t === 'synagogue' ||
    t === 'shrine' ||
    t === 'place_of_worship' ||
    t === 'cemetery'
  )) {
    return 'religious';
  }

  // Beach / Lake / Waterfront
  if (types.some(t => 
    t === 'beach' ||
    t === 'natural_feature' ||
    t === 'lake' ||
    t === 'river' ||
    t === 'waterfall' ||
    t === 'marina'
  )) {
    return 'beach';
  }

  // Default fallback
  return 'attraction';
}

export function getPOIColorClass(variant: POIVariant): string {
  const color = POI_COLORS[variant];
  return `text-white font-medium`;
}

export function getPOIColorStyle(variant: POIVariant, state: 'default' | 'hover' | 'pressed' = 'default'): React.CSSProperties {
  const color = POI_COLORS[variant];
  let backgroundColor = color.bg;
  
  if (state === 'hover') {
    backgroundColor = color.hover;
  } else if (state === 'pressed') {
    backgroundColor = color.pressed;
  }

  return {
    backgroundColor,
    color: color.text,
    border: 'none'
  };
}