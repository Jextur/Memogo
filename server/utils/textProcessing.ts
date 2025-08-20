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

// Fuzzy matching for destinations
export function fuzzyMatchDestination(input: string): string | null {
  const normalized = input.toLowerCase().trim();
  
  // Common typos and variations
  const destinationMap: Record<string, string> = {
    // London variations
    'lodon': 'London, England',
    'londen': 'London, England',
    'londn': 'London, England',
    'london': 'London, England',
    'uk': 'London, England',
    'england': 'London, England',
    'britain': 'London, England',
    'united kingdom': 'London, England',
    
    // Paris variations
    'paris': 'Paris, France',
    'pari': 'Paris, France',
    'parris': 'Paris, France',
    'pars': 'Paris, France',
    'france': 'Paris, France',
    'french': 'Paris, France',
    
    // Tokyo variations
    'tokyo': 'Tokyo, Japan',
    'tokio': 'Tokyo, Japan',
    'toky': 'Tokyo, Japan',
    'japan': 'Tokyo, Japan',
    'japn': 'Tokyo, Japan',
    'nippon': 'Tokyo, Japan',
    
    // New York variations
    'new york': 'New York, USA',
    'newyork': 'New York, USA',
    'ny': 'New York, USA',
    'nyc': 'New York, USA',
    'manhattan': 'New York, USA',
    'big apple': 'New York, USA',
    
    // Rome variations
    'rome': 'Rome, Italy',
    'roma': 'Rome, Italy',
    'italy': 'Rome, Italy',
    'italian': 'Rome, Italy',
    
    // Barcelona variations
    'barcelona': 'Barcelona, Spain',
    'barca': 'Barcelona, Spain',
    'spain': 'Barcelona, Spain',
    'espana': 'Barcelona, Spain',
    
    // Dubai variations
    'dubai': 'Dubai, UAE',
    'dubay': 'Dubai, UAE',
    'uae': 'Dubai, UAE',
    'emirates': 'Dubai, UAE',
    
    // Bangkok variations
    'bangkok': 'Bangkok, Thailand',
    'thailand': 'Bangkok, Thailand',
    'thai': 'Bangkok, Thailand',
    
    // Sydney variations
    'sydney': 'Sydney, Australia',
    'sidney': 'Sydney, Australia',
    'australia': 'Sydney, Australia',
    'aussie': 'Sydney, Australia',
    
    // Singapore variations
    'singapore': 'Singapore',
    'singapur': 'Singapore',
    'sing': 'Singapore',
    'sg': 'Singapore'
  };
  
  // Direct match
  if (destinationMap[normalized]) {
    return destinationMap[normalized];
  }
  
  // Fuzzy matching using Levenshtein distance
  for (const [key, value] of Object.entries(destinationMap)) {
    if (levenshteinDistance(normalized, key) <= 2) {
      return value;
    }
  }
  
  // Check if input contains any destination keywords
  for (const [key, value] of Object.entries(destinationMap)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return value;
    }
  }
  
  return null;
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
  detectedDays?: number;
  detectedPeople?: number;
} {
  const result: any = {
    normalized: text
  };
  
  // Normalize numbers
  const normalizedText = normalizeNumberInput(text);
  result.normalized = normalizedText;
  
  // Try to detect destination
  const destination = fuzzyMatchDestination(text);
  if (destination) {
    result.detectedDestination = destination;
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
  if (possibleDestination) {
    return `Did you mean ${possibleDestination}?`;
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