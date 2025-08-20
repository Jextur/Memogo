import { CityTag, TagAlias, InsertCityTag, InsertTagAlias } from '@shared/schema';
import { storage } from '../storage';

interface TagMatch {
  tag: CityTag;
  confidence: number;
  matchType: 'exact' | 'alias' | 'semantic' | 'fuzzy';
}

interface NormalizedTag {
  originalInput: string;
  normalized: string;
  matched?: TagMatch;
  isNew: boolean;
  validatedPlaceId?: string;
}

export class TagNormalizationService {
  // Normalize text for matching
  private normalizeText(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[\s-_]+/g, '') // Remove spaces, hyphens, underscores
      .replace(/[^\w\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf\u3400-\u4dbf]/g, ''); // Keep alphanumeric + Japanese
  }

  // Calculate string similarity (Levenshtein distance)
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Common Japanese romanization variations
  private getJapaneseVariations(text: string): string[] {
    const variations = [text];
    
    // Common romanization differences
    const replacements = [
      { from: 'ou', to: 'o' },
      { from: 'uu', to: 'u' },
      { from: 'づ', to: 'zu' },
      { from: 'ぢ', to: 'ji' },
      { from: 'tsu', to: 'tu' },
      { from: 'chi', to: 'ti' },
      { from: 'shi', to: 'si' }
    ];
    
    replacements.forEach(({ from, to }) => {
      if (text.includes(from)) {
        variations.push(text.replace(new RegExp(from, 'g'), to));
      }
      if (text.includes(to)) {
        variations.push(text.replace(new RegExp(to, 'g'), from));
      }
    });
    
    return [...new Set(variations)];
  }

  // Match user input against existing tags
  async matchTags(
    userInput: string,
    cityId: number,
    threshold: number = 0.75
  ): Promise<NormalizedTag> {
    const normalized = this.normalizeText(userInput);
    const variations = this.getJapaneseVariations(normalized);
    
    // Get city tags and aliases
    const cityTags = await storage.getCityTags(cityId);
    const allAliases = await storage.getTagAliasesByCityId(cityId);
    
    let bestMatch: TagMatch | undefined;
    let bestScore = 0;
    
    // Check each tag
    for (const tag of cityTags) {
      const tagNormalized = this.normalizeText(tag.label);
      
      // Check exact match
      if (variations.includes(tagNormalized)) {
        return {
          originalInput: userInput,
          normalized,
          matched: {
            tag,
            confidence: 1.0,
            matchType: 'exact'
          },
          isNew: false
        };
      }
      
      // Check fuzzy match
      for (const variant of variations) {
        const similarity = this.calculateSimilarity(variant, tagNormalized);
        if (similarity > bestScore) {
          bestScore = similarity;
          bestMatch = {
            tag,
            confidence: similarity,
            matchType: 'fuzzy'
          };
        }
      }
      
      // Check aliases
      const tagAliases = allAliases.filter(a => a.tagId === tag.id);
      for (const alias of tagAliases) {
        const aliasNormalized = this.normalizeText(alias.alias);
        
        if (variations.includes(aliasNormalized)) {
          return {
            originalInput: userInput,
            normalized,
            matched: {
              tag,
              confidence: Number(alias.confidence || 1.0),
              matchType: 'alias'
            },
            isNew: false
          };
        }
        
        // Fuzzy match on aliases
        for (const variant of variations) {
          const similarity = this.calculateSimilarity(variant, aliasNormalized);
          const weightedScore = similarity * Number(alias.confidence || 1.0);
          if (weightedScore > bestScore) {
            bestScore = weightedScore;
            bestMatch = {
              tag,
              confidence: weightedScore,
              matchType: 'alias'
            };
          }
        }
      }
    }
    
    // Return best match if above threshold
    if (bestMatch && bestScore >= threshold) {
      return {
        originalInput: userInput,
        normalized,
        matched: bestMatch,
        isNew: false
      };
    }
    
    // No match found - this is a new tag
    return {
      originalInput: userInput,
      normalized,
      isNew: true
    };
  }

  // Validate a new tag with Google Places API
  async validateWithPlaces(
    tagText: string,
    cityName: string,
    countryCode: string,
    googleApiKey: string
  ): Promise<{ valid: boolean; placeId?: string; details?: any }> {
    try {
      // Search for the place within the city
      const searchQuery = `${tagText} in ${cityName}, ${countryCode}`;
      const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${googleApiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const place = data.results[0];
        
        // Check if the place is actually in the specified city
        const addressComponents = place.address_components || [];
        const cityMatch = addressComponents.some((comp: any) => 
          comp.types.includes('locality') && 
          this.normalizeText(comp.long_name) === this.normalizeText(cityName)
        );
        
        if (cityMatch || place.vicinity?.toLowerCase().includes(cityName.toLowerCase())) {
          return {
            valid: true,
            placeId: place.place_id,
            details: {
              name: place.name,
              rating: place.rating,
              userRatingsTotal: place.user_ratings_total,
              types: place.types,
              photoReference: place.photos?.[0]?.photo_reference
            }
          };
        }
      }
      
      return { valid: false };
    } catch (error) {
      console.error('Error validating with Places API:', error);
      return { valid: false };
    }
  }

  // Normalize user input to find or create appropriate tags
  async normalizeUserInput(
    userInput: string,
    cityId: number,
    inputType: 'text' | 'select' = 'text'
  ): Promise<{
    matchedTag?: CityTag;
    candidateTags: CityTag[];
    confidence: number;
  }> {
    // Get city tags for this city
    const cityTags = await storage.getCityTags(cityId);
    
    // Normalize the input tag
    const normalizedResult = await this.normalizeTag(
      userInput,
      cityTags,
      await storage.getTagAliases(),
      0.75 // 75% similarity threshold
    );
    
    if (normalizedResult.matched) {
      return {
        matchedTag: normalizedResult.matched.tag,
        candidateTags: [],
        confidence: normalizedResult.matched.confidence
      };
    }
    
    // If no match, create a candidate tag
    const candidateTag: CityTag = {
      id: -1, // Temporary ID for candidates
      cityId,
      label: userInput,
      normalizedLabel: this.normalizeText(userInput),
      source: 'user',
      score: '0.50',
      placeIds: [],
      metadata: { inputType },
      usageCount: 0,
      isActive: false, // Candidates are not active until validated
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return {
      matchedTag: undefined,
      candidateTags: [candidateTag],
      confidence: 0
    };
  }

  // Create a new tag from user input
  async createUserTag(
    tagText: string,
    cityId: number,
    placeId?: string,
    metadata?: any
  ): Promise<CityTag> {
    const normalized = this.normalizeText(tagText);
    
    const newTag: InsertCityTag = {
      cityId,
      label: tagText,
      normalizedLabel: normalized,
      source: 'user_add',
      score: '0.50', // Start with lower score for user-added tags
      placeIds: placeId ? [placeId] : [],
      metadata: metadata || {},
      usageCount: 1,
      isActive: true
    };
    
    return await storage.createCityTag(newTag);
  }

  // Process multiple user inputs
  async processUserTags(
    inputs: string[],
    cityId: number,
    cityName: string,
    countryCode: string,
    googleApiKey?: string
  ): Promise<{ matched: CityTag[]; new: string[]; invalid: string[] }> {
    const matched: CityTag[] = [];
    const newTags: string[] = [];
    const invalid: string[] = [];
    
    for (const input of inputs) {
      const result = await this.matchTags(input, cityId);
      
      if (result.matched) {
        matched.push(result.matched.tag);
        
        // Increment usage count
        await storage.incrementTagUsage(result.matched.tag.id);
      } else if (result.isNew) {
        // Validate with Places API if available
        if (googleApiKey) {
          const validation = await this.validateWithPlaces(
            input,
            cityName,
            countryCode,
            googleApiKey
          );
          
          if (validation.valid) {
            // Create new tag
            const newTag = await this.createUserTag(
              input,
              cityId,
              validation.placeId,
              validation.details
            );
            matched.push(newTag);
          } else {
            // Still allow custom tags without Places validation
            newTags.push(input);
          }
        } else {
          newTags.push(input);
        }
      }
    }
    
    return { matched, new: newTags, invalid };
  }

  // Add common aliases for a tag
  async addCommonAliases(tagId: number, tagLabel: string): Promise<void> {
    const aliases: InsertTagAlias[] = [];
    
    // Common abbreviations
    if (tagLabel.toLowerCase().includes('disney')) {
      aliases.push({
        tagId,
        alias: 'TDL',
        normalizedAlias: this.normalizeText('TDL'),
        language: 'en',
        aliasType: 'abbreviation',
        confidence: '0.90'
      });
    }
    
    if (tagLabel.toLowerCase().includes('universal studios')) {
      aliases.push({
        tagId,
        alias: 'USJ',
        normalizedAlias: this.normalizeText('USJ'),
        language: 'en',
        aliasType: 'abbreviation',
        confidence: '0.90'
      });
    }
    
    // Japanese translations for Tokyo attractions
    const japaneseTranslations: Record<string, string> = {
      'Tokyo Tower': '東京タワー',
      'Senso-ji Temple': '浅草寺',
      'Tsukiji Market': '築地市場',
      'Akihabara': '秋葉原',
      'Shibuya Crossing': '渋谷スクランブル交差点',
      'TeamLab Planets': 'チームラボプラネッツ'
    };
    
    if (japaneseTranslations[tagLabel]) {
      aliases.push({
        tagId,
        alias: japaneseTranslations[tagLabel],
        normalizedAlias: this.normalizeText(japaneseTranslations[tagLabel]),
        language: 'ja',
        aliasType: 'translation',
        confidence: '1.00'
      });
    }
    
    // Common typos and variations
    const commonTypos: Record<string, string[]> = {
      'Akihabara': ['Akiba', 'Akihabra', 'Akhihabara'],
      'TeamLab': ['Team Lab', 'Teamlab', 'Team-Lab'],
      'Senso-ji': ['Sensoji', 'Senso ji', 'Sensouji'],
      'Fushimi Inari': ['Fushimi-Inari', 'Fushimi Inari Shrine', 'Inari Shrine']
    };
    
    if (commonTypos[tagLabel]) {
      for (const typo of commonTypos[tagLabel]) {
        aliases.push({
          tagId,
          alias: typo,
          normalizedAlias: this.normalizeText(typo),
          language: 'en',
          aliasType: typo.includes(' ') ? 'synonym' : 'typo',
          confidence: '0.85'
        });
      }
    }
    
    // Save all aliases
    for (const alias of aliases) {
      await storage.createTagAlias(alias);
    }
  }
}

export const tagNormalizationService = new TagNormalizationService();