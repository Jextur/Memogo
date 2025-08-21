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

// Country aliases mapping - maps variations to canonical names
export const countryAliases: Record<string, string> = {
  'america': 'usa',
  'united states': 'usa',
  'united states of america': 'usa',
  'us': 'usa',
  'u.s.': 'usa',
  'u.s.a.': 'usa',
  'u.s': 'usa',
  'states': 'usa',
  'the states': 'usa',
  'uk': 'england',
  'united kingdom': 'england',
  'great britain': 'england',
  'britain': 'england',
  'gb': 'england',
  'south korea': 'korea',
  's korea': 'korea',
  's. korea': 'korea',
  'republic of korea': 'korea',
  'uae': 'dubai',
  'united arab emirates': 'dubai',
  'emirates': 'dubai',
  'the netherlands': 'netherlands',
  'holland': 'netherlands',
  'nz': 'new zealand',
  'sa': 'south africa',
  'rsa': 'south africa'
};

// Popular cities by country - expanded with major travel destinations
export const popularCities: Record<string, string[]> = {
  'japan': ['Tokyo', 'Kyoto', 'Osaka', 'Okinawa', 'Sapporo', 'Fukuoka', 'Yokohama', 'Nagoya', 'Kobe', 'Hiroshima'],
  'france': ['Paris', 'Nice', 'Lyon', 'Marseille', 'Bordeaux', 'Strasbourg', 'Toulouse', 'Lille', 'Cannes', 'Monaco'],
  'italy': ['Rome', 'Venice', 'Florence', 'Milan', 'Naples', 'Amalfi Coast', 'Sicily', 'Tuscany', 'Verona', 'Bologna'],
  'spain': ['Barcelona', 'Madrid', 'Seville', 'Valencia', 'Granada', 'Malaga', 'Bilbao', 'Ibiza', 'Mallorca', 'San Sebastian'],
  'usa': ['New York', 'Los Angeles', 'San Francisco', 'Miami', 'Las Vegas', 'Chicago', 'Boston', 'Hawaii', 'Orlando', 'Seattle'],
  'uk': ['London', 'Edinburgh', 'Manchester', 'Liverpool', 'Cambridge', 'Oxford', 'Bath', 'York', 'Glasgow', 'Belfast'],
  'england': ['London', 'Manchester', 'Liverpool', 'Cambridge', 'Oxford', 'Bath', 'York', 'Brighton', 'Bristol', 'Birmingham'],
  'thailand': ['Bangkok', 'Phuket', 'Chiang Mai', 'Pattaya', 'Krabi', 'Koh Samui', 'Ayutthaya', 'Hua Hin', 'Koh Phi Phi', 'Chiang Rai'],
  'australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Gold Coast', 'Cairns', 'Adelaide', 'Tasmania', 'Darwin', 'Canberra'],
  'germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Dresden', 'Heidelberg', 'Stuttgart', 'Nuremberg', 'Düsseldorf'],
  'netherlands': ['Amsterdam', 'Rotterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Maastricht', 'Groningen', 'Delft', 'Leiden', 'Haarlem'],
  'india': ['Delhi', 'Mumbai', 'Goa', 'Jaipur', 'Kerala', 'Agra', 'Bangalore', 'Varanasi', 'Udaipur', 'Chennai'],
  'china': ['Beijing', 'Shanghai', 'Hong Kong', 'Shenzhen', 'Guangzhou', 'Xian', 'Chengdu', 'Hangzhou', 'Guilin', 'Suzhou'],
  'korea': ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Daegu', 'Gyeongju', 'Jeonju', 'Gangneung', 'Sokcho', 'Andong'],
  'south korea': ['Seoul', 'Busan', 'Jeju', 'Incheon', 'Daegu', 'Gyeongju', 'Jeonju', 'Gangneung', 'Sokcho', 'Andong'],
  'mexico': ['Mexico City', 'Cancun', 'Guadalajara', 'Playa del Carmen', 'Cabo', 'Puerto Vallarta', 'Tulum', 'Oaxaca', 'Cozumel', 'Merida'],
  'brazil': ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Brasília', 'Florianópolis', 'Foz do Iguaçu', 'Recife', 'Fortaleza', 'Manaus', 'Belo Horizonte'],
  'canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Quebec City', 'Edmonton', 'Winnipeg', 'Halifax', 'Victoria'],
  'dubai': ['Dubai'],
  'uae': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ras Al Khaimah', 'Fujairah'],
  'singapore': ['Singapore'],
  'greece': ['Athens', 'Santorini', 'Mykonos', 'Crete', 'Rhodes', 'Corfu', 'Zakynthos', 'Thessaloniki', 'Meteora', 'Delphi'],
  'portugal': ['Lisbon', 'Porto', 'Algarve', 'Madeira', 'Coimbra', 'Sintra', 'Cascais', 'Braga', 'Évora', 'Azores'],
  'turkey': ['Istanbul', 'Cappadocia', 'Antalya', 'Izmir', 'Ankara', 'Bodrum', 'Pamukkale', 'Ephesus', 'Trabzon', 'Bursa'],
  'indonesia': ['Bali', 'Jakarta', 'Yogyakarta', 'Lombok', 'Komodo', 'Bandung', 'Surabaya', 'Medan', 'Ubud', 'Gili Islands'],
  'vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hoi An', 'Nha Trang', 'Phu Quoc', 'Sapa', 'Halong Bay', 'Hue', 'Dalat'],
  'malaysia': ['Kuala Lumpur', 'Penang', 'Langkawi', 'Malacca', 'Kota Kinabalu', 'Kuching', 'Cameron Highlands', 'Ipoh', 'Johor Bahru', 'Genting Highlands'],
  'philippines': ['Manila', 'Boracay', 'Cebu', 'Palawan', 'Siargao', 'Bohol', 'Davao', 'Baguio', 'El Nido', 'Coron'],
  'new zealand': ['Auckland', 'Wellington', 'Queenstown', 'Christchurch', 'Rotorua', 'Dunedin', 'Hamilton', 'Napier', 'Nelson', 'Taupo'],
  'switzerland': ['Zurich', 'Geneva', 'Lucerne', 'Interlaken', 'Bern', 'Zermatt', 'Basel', 'Lausanne', 'St. Moritz', 'Grindelwald'],
  'austria': ['Vienna', 'Salzburg', 'Innsbruck', 'Hallstatt', 'Graz', 'Linz', 'Alpbach', 'Feldkirch', 'Kitzbühel', 'Bad Gastein'],
  'belgium': ['Brussels', 'Bruges', 'Antwerp', 'Ghent', 'Leuven', 'Liège', 'Namur', 'Mons', 'Ostend', 'Dinant'],
  'egypt': ['Cairo', 'Luxor', 'Aswan', 'Alexandria', 'Sharm El Sheikh', 'Hurghada', 'Giza', 'Abu Simbel', 'Dahab', 'Marsa Alam'],
  'morocco': ['Marrakech', 'Casablanca', 'Fez', 'Chefchaouen', 'Rabat', 'Tangier', 'Essaouira', 'Agadir', 'Meknes', 'Ouarzazate'],
  'south africa': ['Cape Town', 'Johannesburg', 'Durban', 'Kruger National Park', 'Port Elizabeth', 'Pretoria', 'Stellenbosch', 'Knysna', 'Hermanus', 'Drakensberg']
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
  
  // First check country aliases
  const aliasMatch = countryAliases[normalized];
  const searchTerm = aliasMatch || normalized;
  
  // Check if it's a known country (using alias or direct match)
  const countryMatch = Object.keys(popularCities).find(country => {
    return country === searchTerm || 
           levenshteinDistance(searchTerm, country) <= 2 ||
           country.includes(searchTerm) ||
           searchTerm.includes(country);
  });
  
  if (countryMatch) {
    const cities = getPopularCitiesForCountry(countryMatch);
    // Format display name properly for known countries
    const displayName = countryMatch === 'usa' ? 'USA' : 
                       countryMatch.charAt(0).toUpperCase() + countryMatch.slice(1);
    return {
      destination: displayName,
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
    'okinawa': 'Okinawa, Japan',
    'sapporo': 'Sapporo, Japan',
    'fukuoka': 'Fukuoka, Japan',
    'nagoya': 'Nagoya, Japan',
    'kobe': 'Kobe, Japan',
    'yokohama': 'Yokohama, Japan',
    'hiroshima': 'Hiroshima, Japan',
    'nara': 'Nara, Japan',
    'hokkaido': 'Hokkaido, Japan',
    
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
    'san francisco': 'San Francisco, USA',
    'sf': 'San Francisco, USA',
    'miami': 'Miami, USA',
    'vegas': 'Las Vegas, USA',
    'las vegas': 'Las Vegas, USA',
    'chicago': 'Chicago, USA',
    'boston': 'Boston, USA',
    'seattle': 'Seattle, USA',
    'dallas': 'Dallas, USA',
    'houston': 'Houston, USA',
    'austin': 'Austin, USA',
    'denver': 'Denver, USA',
    'atlanta': 'Atlanta, USA',
    'orlando': 'Orlando, USA',
    'phoenix': 'Phoenix, USA',
    'portland': 'Portland, USA',
    'washington': 'Washington DC, USA',
    'dc': 'Washington DC, USA',
    'philadelphia': 'Philadelphia, USA',
    'san diego': 'San Diego, USA',
    
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
  
  // Don't do partial matching - it causes false positives like "dallas" matching "la"
  // Only return exact or very close matches via Levenshtein distance above
  
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
  
  // Try to extract people count - more flexible patterns
  // Direct number without units
  const simpleNumberMatch = normalizedText.match(/^(\d+)$/);
  if (simpleNumberMatch && !result.detectedDays) {
    // If we already have destination and days, this number is likely people count
    result.detectedPeople = parseInt(simpleNumberMatch[1]);
  }
  
  // Number with people-related words
  const peopleMatch = normalizedText.match(/(\d+)\s*(people|person|traveler|adult|guest|of us)?/i);
  if (peopleMatch) {
    result.detectedPeople = parseInt(peopleMatch[1]);
  }
  
  // "We are X" patterns
  const weAreMatch = normalizedText.match(/we\s*(?:are|'re)?\s*(\d+)/i);
  if (weAreMatch) {
    result.detectedPeople = parseInt(weAreMatch[1]);
  }
  
  // "X of us" patterns
  const ofUsMatch = normalizedText.match(/(\d+)\s*of\s*us/i);
  if (ofUsMatch) {
    result.detectedPeople = parseInt(ofUsMatch[1]);
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