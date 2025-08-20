// Utility functions for text processing and input normalization

// Word to number conversion
const wordNumbers: Record<string, number> = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
  'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
  'couple': 2, 'few': 3, 'several': 5, 'many': 7
};

// Convert word numbers to digits
export function normalizeNumberInput(text: string): string {
  let normalized = text.toLowerCase();
  
  // Replace word numbers with digits
  Object.entries(wordNumbers).forEach(([word, number]) => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    normalized = normalized.replace(regex, number.toString());
  });
  
  return normalized;
}

// Popular cities by country
export const popularCities: Record<string, string[]> = {
  'japan': ['Tokyo', 'Kyoto', 'Osaka', 'Yokohama', 'Hiroshima'],
  'france': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux'],
  'italy': ['Rome', 'Venice', 'Florence', 'Milan', 'Naples'],
  'spain': ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada'],
  'usa': ['New York', 'Los Angeles', 'San Francisco', 'Miami', 'Las Vegas'],
  'uk': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Cambridge'],
  'england': ['London', 'Manchester', 'Liverpool', 'Cambridge', 'Oxford'],
  'thailand': ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi'],
  'australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Gold Coast'],
  'germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
  'netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven'],
  'india': ['Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Kerala'],
  'china': ['Beijing', 'Shanghai', 'Hong Kong', 'Shenzhen', 'Guangzhou'],
  'korea': ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Daegu'],
  'south korea': ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Daegu'],
  'mexico': ['Mexico City', 'Cancun', 'Guadalajara', 'Playa del Carmen', 'Cabo'],
  'brazil': ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Brasília', 'Florianópolis'],
  'canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa'],
  'dubai': ['Dubai'],
  'uae': ['Dubai', 'Abu Dhabi', 'Sharjah'],
  'singapore': ['Singapore'],
  'greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes'],
  'portugal': ['Lisbon', 'Porto', 'Algarve', 'Madeira', 'Coimbra'],
  'turkey': ['Istanbul', 'Cappadocia', 'Antalya', 'Izmir', 'Ankara']
};

// Get popular cities for a country
export function getPopularCitiesForCountry(country: string): string[] {
  const normalized = country.toLowerCase().trim();
  return popularCities[normalized] || [];
}

// Fuzzy matching for destinations (both countries and cities)
export function fuzzyMatchDestination(input: string): { 
  destination: string | null; 
  isCountry: boolean;
  suggestedCities?: string[];
} {
  const normalized = input.toLowerCase().trim();
  
  // Check if it's a known country first
  const countryMatch = Object.keys(popularCities).find(country => {
    return country === normalized || 
           levenshteinDistance(normalized, country) <= 2 ||
           country.includes(normalized) ||
           normalized.includes(country);
  });
  
  if (countryMatch) {
    const cities = getPopularCitiesForCountry(countryMatch);
    return {
      destination: countryMatch.charAt(0).toUpperCase() + countryMatch.slice(1),
      isCountry: true,
      suggestedCities: cities.slice(0, 5) // Return top 5 cities
    };
  }
  
  // Common city typos and variations
  const destinationMap: Record<string, string> = {
    // Japanese cities
    'tokyo': 'Tokyo, Japan',
    'tokio': 'Tokyo, Japan',
    'kyoto': 'Kyoto, Japan',
    'kioto': 'Kyoto, Japan',
    'osaka': 'Osaka, Japan',
    'yokohama': 'Yokohama, Japan',
    'hiroshima': 'Hiroshima, Japan',
    
    // London variations
    'lodon': 'London, England',
    'londen': 'London, England',
    'londn': 'London, England',
    'london': 'London, England',
    
    // Paris variations
    'paris': 'Paris, France',
    'pari': 'Paris, France',
    'parris': 'Paris, France',
    'nice': 'Nice, France',
    'lyon': 'Lyon, France',
    'marseille': 'Marseille, France',
    
    // Italian cities
    'rome': 'Rome, Italy',
    'roma': 'Rome, Italy',
    'venice': 'Venice, Italy',
    'venezia': 'Venice, Italy',
    'florence': 'Florence, Italy',
    'firenze': 'Florence, Italy',
    'milan': 'Milan, Italy',
    'milano': 'Milan, Italy',
    'naples': 'Naples, Italy',
    'napoli': 'Naples, Italy',
    
    // Spanish cities
    'barcelona': 'Barcelona, Spain',
    'barca': 'Barcelona, Spain',
    'madrid': 'Madrid, Spain',
    'seville': 'Seville, Spain',
    'sevilla': 'Seville, Spain',
    'valencia': 'Valencia, Spain',
    'granada': 'Granada, Spain',
    
    // US cities
    'new york': 'New York, USA',
    'newyork': 'New York, USA',
    'ny': 'New York, USA',
    'nyc': 'New York, USA',
    'manhattan': 'New York, USA',
    'los angeles': 'Los Angeles, USA',
    'la': 'Los Angeles, USA',
    'san francisco': 'San Francisco, USA',
    'sf': 'San Francisco, USA',
    'miami': 'Miami, USA',
    'vegas': 'Las Vegas, USA',
    'las vegas': 'Las Vegas, USA',
    
    // Other major cities
    'dubai': 'Dubai, UAE',
    'dubay': 'Dubai, UAE',
    'bangkok': 'Bangkok, Thailand',
    'sydney': 'Sydney, Australia',
    'sidney': 'Sydney, Australia',
    'singapore': 'Singapore',
    'amsterdam': 'Amsterdam, Netherlands',
    'berlin': 'Berlin, Germany',
    'munich': 'Munich, Germany',
    'istanbul': 'Istanbul, Turkey',
    'athens': 'Athens, Greece',
    'lisbon': 'Lisbon, Portugal',
    'lisboa': 'Lisbon, Portugal'
  };
  
  // Direct city match
  if (destinationMap[normalized]) {
    return {
      destination: destinationMap[normalized],
      isCountry: false
    };
  }
  
  // Fuzzy matching using Levenshtein distance for cities
  for (const [key, value] of Object.entries(destinationMap)) {
    if (levenshteinDistance(normalized, key) <= 2) {
      return {
        destination: value,
        isCountry: false
      };
    }
  }
  
  // Check if input contains any city keywords
  for (const [key, value] of Object.entries(destinationMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return {
        destination: value,
        isCountry: false
      };
    }
  }
  
  return {
    destination: null,
    isCountry: false
  };
}

// Simple Levenshtein distance implementation for fuzzy matching
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[b.length][a.length];
}

// Normalize various input formats
export function normalizeUserInput(text: string): {
  normalized: string;
  detectedDestination?: string;
  isCountry?: boolean;
  suggestedCities?: string[];
  detectedDays?: number;
  detectedPeople?: number;
} {
  const result: any = {
    normalized: text
  };
  
  // Normalize numbers
  const normalizedText = normalizeNumberInput(text);
  result.normalized = normalizedText;
  
  // Try to detect destination (country or city)
  const destinationMatch = fuzzyMatchDestination(text);
  if (destinationMatch.destination) {
    result.detectedDestination = destinationMatch.destination;
    result.isCountry = destinationMatch.isCountry;
    result.suggestedCities = destinationMatch.suggestedCities;
  }
  
  // Try to extract days
  const daysMatch = normalizedText.match(/(\d+)\s*(day|night)/i);
  if (daysMatch) {
    result.detectedDays = parseInt(daysMatch[1]);
  }
  
  // Try to extract people count
  const peopleMatch = normalizedText.match(/(\d+)\s*(people|person|traveler|adult|guest)/i);
  if (peopleMatch) {
    result.detectedPeople = parseInt(peopleMatch[1]);
  }
  
  return result;
}

// Suggest corrections for unrecognized input
export function suggestCorrection(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  
  // Check if it looks like a destination typo
  const possibleDestination = fuzzyMatchDestination(normalized);
  if (possibleDestination.destination) {
    return `Did you mean ${possibleDestination.destination}?`;
  }
  
  // Check if it's close to known travel-related words
  const travelKeywords = [
    'beach', 'mountain', 'city', 'adventure', 'relax', 'culture',
    'history', 'food', 'shopping', 'nightlife', 'nature', 'luxury',
    'budget', 'family', 'romantic', 'solo', 'business'
  ];
  
  for (const keyword of travelKeywords) {
    if (levenshteinDistance(normalized, keyword) <= 2) {
      return `Did you mean "${keyword}"?`;
    }
  }
  
  return null;
}