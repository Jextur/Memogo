/**
 * Session-scoped tag processor for handling free-text preferences
 * These are NEVER persisted to the canonical database
 */

interface SessionTag {
  raw: string;
  normalized: string;
  category: 'water' | 'food' | 'culture' | 'nature' | 'shopping' | 'nightlife' | 'generic';
  confidence: number;
  searchQuery: string;
}

interface TagCandidate {
  tagRaw: string;
  tagNorm: string;
  cityId?: number;
  category: string;
  count: number;
  lastSeenAt: Date;
  samplePois?: string[];
}

// Safety filters - block inappropriate or nonsensical inputs
const BLOCKED_PATTERNS = [
  /\b(xxx|porn|adult|nsfw)\b/i,
  /\b(kill|murder|violence|bomb)\b/i,
  /\b(drug|weed|cocaine|heroin)\b/i,
  /^[^a-zA-Z0-9\s]+$/,  // Only special characters
  /^.{1,2}$/,  // Too short (1-2 chars)
  /^.{100,}$/,  // Too long (>100 chars)
];

// Normalized category mappings for free-text
const CATEGORY_MAPPINGS: Record<string, { category: SessionTag['category'], searchTerms: string[] }> = {
  // Water activities
  'water': { category: 'water', searchTerms: ['water parks', 'beaches', 'swimming pools', 'aquariums'] },
  'swim': { category: 'water', searchTerms: ['swimming pools', 'beaches', 'water sports'] },
  'beach': { category: 'water', searchTerms: ['beaches', 'seaside', 'coastal areas'] },
  'onsen': { category: 'water', searchTerms: ['hot springs', 'onsen', 'spa', 'thermal baths'] },
  'hot spring': { category: 'water', searchTerms: ['hot springs', 'onsen', 'thermal baths'] },
  'aquarium': { category: 'water', searchTerms: ['aquariums', 'marine life', 'sea world'] },
  
  // Food
  'food': { category: 'food', searchTerms: ['restaurants', 'local cuisine', 'food markets'] },
  'eat': { category: 'food', searchTerms: ['restaurants', 'cafes', 'dining'] },
  'restaurant': { category: 'food', searchTerms: ['restaurants', 'dining', 'eateries'] },
  'cafe': { category: 'food', searchTerms: ['cafes', 'coffee shops', 'bakeries'] },
  'street food': { category: 'food', searchTerms: ['street food', 'food markets', 'food stalls'] },
  'local food': { category: 'food', searchTerms: ['local cuisine', 'traditional restaurants', 'authentic food'] },
  
  // Culture
  'temple': { category: 'culture', searchTerms: ['temples', 'shrines', 'religious sites'] },
  'shrine': { category: 'culture', searchTerms: ['shrines', 'temples', 'spiritual sites'] },
  'museum': { category: 'culture', searchTerms: ['museums', 'galleries', 'exhibitions'] },
  'culture': { category: 'culture', searchTerms: ['cultural sites', 'heritage', 'historical places'] },
  'history': { category: 'culture', searchTerms: ['historical sites', 'monuments', 'heritage'] },
  'art': { category: 'culture', searchTerms: ['art galleries', 'museums', 'exhibitions'] },
  
  // Nature
  'nature': { category: 'nature', searchTerms: ['parks', 'gardens', 'nature reserves'] },
  'park': { category: 'nature', searchTerms: ['parks', 'gardens', 'green spaces'] },
  'garden': { category: 'nature', searchTerms: ['gardens', 'botanical gardens', 'parks'] },
  'mountain': { category: 'nature', searchTerms: ['mountains', 'hiking trails', 'viewpoints'] },
  'hike': { category: 'nature', searchTerms: ['hiking trails', 'nature walks', 'trekking'] },
  
  // Shopping
  'shop': { category: 'shopping', searchTerms: ['shopping malls', 'markets', 'stores'] },
  'shopping': { category: 'shopping', searchTerms: ['shopping centers', 'retail', 'boutiques'] },
  'market': { category: 'shopping', searchTerms: ['markets', 'bazaars', 'shopping streets'] },
  'mall': { category: 'shopping', searchTerms: ['shopping malls', 'department stores'] },
  
  // Nightlife
  'night': { category: 'nightlife', searchTerms: ['nightlife', 'bars', 'evening entertainment'] },
  'bar': { category: 'nightlife', searchTerms: ['bars', 'pubs', 'lounges'] },
  'club': { category: 'nightlife', searchTerms: ['nightclubs', 'dance clubs', 'party venues'] },
  'party': { category: 'nightlife', searchTerms: ['party venues', 'nightclubs', 'entertainment'] },
};

/**
 * Process free-text into session-scoped tags
 * These are NEVER saved to the database
 */
export function processSessionTags(freeText: string): SessionTag[] {
  const sessionTags: SessionTag[] = [];
  
  // Safety check - block inappropriate content
  if (BLOCKED_PATTERNS.some(pattern => pattern.test(freeText))) {
    console.warn('Blocked inappropriate input:', freeText);
    return [];
  }
  
  const lowerText = freeText.toLowerCase().trim();
  const words = lowerText.split(/\s+/);
  
  // Check for exact matches first
  for (const [key, mapping] of Object.entries(CATEGORY_MAPPINGS)) {
    if (lowerText.includes(key)) {
      sessionTags.push({
        raw: freeText,
        normalized: key,
        category: mapping.category,
        confidence: 0.9,
        searchQuery: mapping.searchTerms.join(' OR ')
      });
    }
  }
  
  // If no exact matches, try word-by-word
  if (sessionTags.length === 0) {
    for (const word of words) {
      if (CATEGORY_MAPPINGS[word]) {
        const mapping = CATEGORY_MAPPINGS[word];
        sessionTags.push({
          raw: word,
          normalized: word,
          category: mapping.category,
          confidence: 0.7,
          searchQuery: mapping.searchTerms.join(' OR ')
        });
      }
    }
  }
  
  // If still no matches, create a generic tag (but with low confidence)
  if (sessionTags.length === 0 && lowerText.length > 2) {
    sessionTags.push({
      raw: freeText,
      normalized: lowerText,
      category: 'generic',
      confidence: 0.3,
      searchQuery: lowerText
    });
  }
  
  return sessionTags;
}

/**
 * Log tag candidates for potential review (quarantined table)
 * This would be saved to a separate table with TTL, not the main tags table
 */
export function logTagCandidate(candidate: TagCandidate): void {
  // In production, this would insert into user_tag_candidates table with 30-day TTL
  console.log('Tag candidate logged for review:', {
    ...candidate,
    ttl: '30 days',
    status: 'quarantined'
  });
  
  // NOTE: We do NOT save this to the canonical tags table
  // Only after human review would these be promoted
}

/**
 * Convert session tags to search preferences
 * These are used ONLY for the current session's POI selection
 */
export function sessionTagsToPreferences(sessionTags: SessionTag[]): string[] {
  // Only use high-confidence tags for search
  return sessionTags
    .filter(tag => tag.confidence >= 0.5)
    .map(tag => tag.searchQuery);
}

/**
 * Check if a preference needs clarification
 */
export function needsClarification(freeText: string): boolean {
  const lowerText = freeText.toLowerCase().trim();
  
  // Too vague
  if (lowerText.length < 3) return true;
  
  // Contains question marks or unclear intent
  if (lowerText.includes('?')) return true;
  
  // No recognizable keywords at all
  const sessionTags = processSessionTags(freeText);
  if (sessionTags.length === 0 || sessionTags.every(t => t.confidence < 0.3)) {
    return true;
  }
  
  return false;
}