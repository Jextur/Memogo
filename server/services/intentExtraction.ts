import OpenAI from 'openai';
import { z } from 'zod';
import { tagNormalizationService } from './tagNormalizationService';
import { storage } from '../storage';

// Schema for extracted intent
const ExtractedIntentSchema = z.object({
  destination_city: z.string().nullable(),
  destination_country: z.string().nullable(),
  duration_days: z.number().nullable(),
  people_count: z.number().nullable(),
  companions: z.enum(['solo', 'couple', 'family', 'friends', 'other']).nullable(),
  dates: z.object({
    start: z.string().nullable(),
    end: z.string().nullable()
  }).nullable(),
  budget_tier: z.enum(['cheap', 'moderate', 'luxury']).nullable(),
  tags: z.array(z.string()),
  notes: z.string().nullable()
});

export type ExtractedIntent = z.infer<typeof ExtractedIntentSchema>;

class IntentExtractionService {
  private openai: OpenAI;

  constructor() {
    // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async extractIntent(userInput: string): Promise<ExtractedIntent> {
    try {
      const systemPrompt = `You are a travel intent extraction system. Extract structured information from user's natural language input about their travel plans.

Extract the following fields:
- destination_city: The specific city they want to visit
- destination_country: The country of the destination
- duration_days: Number of days for the trip (convert "a week" → 7, "2 weeks" → 14, etc.)
- people_count: Number of people traveling
- companions: Type of travel group - map to one of: solo (1 person), couple (2 people romantic), family (with kids/parents), friends (group of friends), other
- dates: Start and end dates if mentioned (ISO format YYYY-MM-DD)
- budget_tier: cheap, moderate, or luxury if mentioned
- tags: Array of specific attractions, activities, or interests mentioned
- notes: Any other constraints or preferences

If a field is not mentioned, set it to null.
For tags, extract specific places (e.g., "Tokyo Tower"), activities (e.g., "skiing"), or interests (e.g., "ramen", "shopping").

Respond with valid JSON matching the required schema.`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 500
      });

      const extracted = JSON.parse(response.choices[0].message.content || '{}');
      return ExtractedIntentSchema.parse(extracted);
    } catch (error) {
      console.error('Intent extraction failed:', error);
      // Return empty intent on failure
      return {
        destination_city: null,
        destination_country: null,
        duration_days: null,
        people_count: null,
        companions: null,
        dates: null,
        budget_tier: null,
        tags: [],
        notes: null
      };
    }
  }

  async normalizeExtractedIntent(intent: ExtractedIntent): Promise<{
    normalized: ExtractedIntent;
    cityId?: number;
    confidence: number;
  }> {
    let cityId: number | undefined;
    let confidence = 1.0;

    // Normalize city/country
    if (intent.destination_city && intent.destination_country) {
      const city = await storage.getCityByName(intent.destination_city, intent.destination_country);
      if (city) {
        cityId = city.id;
        intent.destination_city = city.cityName;
        intent.destination_country = city.countryName;
      } else {
        // Try fuzzy matching
        const cities = await storage.searchCities(intent.destination_city);
        if (cities.length > 0) {
          const topMatch = cities[0];
          cityId = topMatch.id;
          intent.destination_city = topMatch.cityName;
          intent.destination_country = topMatch.countryName;
          confidence *= 0.8; // Lower confidence for fuzzy match
        }
      }
    }

    // Normalize tags using the tag normalization service
    if (intent.tags.length > 0 && cityId) {
      const normalizedTags: string[] = [];
      for (const tag of intent.tags) {
        try {
          const result = await tagNormalizationService.normalizeUserInput(
            tag,
            cityId,
            'text'
          );
          
          if (result.matchedTag) {
            normalizedTags.push(result.matchedTag.label);
          } else if (result.candidateTags.length > 0) {
            normalizedTags.push(result.candidateTags[0].label);
          } else {
            // Keep original if no match found
            normalizedTags.push(tag);
          }
        } catch (error) {
          console.error(`Failed to normalize tag "${tag}":`, error);
          normalizedTags.push(tag);
        }
      }
      intent.tags = normalizedTags;
    }

    // Infer companions from people_count if not specified
    if (!intent.companions && intent.people_count) {
      if (intent.people_count === 1) {
        intent.companions = 'solo';
      } else if (intent.people_count === 2) {
        // Default to couple for 2 people unless notes suggest otherwise
        intent.companions = intent.notes?.toLowerCase().includes('friend') ? 'friends' : 'couple';
      } else if (intent.notes?.toLowerCase().includes('family') || intent.notes?.toLowerCase().includes('kids')) {
        intent.companions = 'family';
      } else {
        intent.companions = 'friends';
      }
    }

    // Infer people_count from companions if not specified
    if (!intent.people_count && intent.companions) {
      switch (intent.companions) {
        case 'solo':
          intent.people_count = 1;
          break;
        case 'couple':
          intent.people_count = 2;
          break;
        case 'family':
          intent.people_count = 4; // Default family size
          break;
        case 'friends':
          intent.people_count = 3; // Default friend group size
          break;
      }
    }

    return {
      normalized: intent,
      cityId,
      confidence
    };
  }

  determineNextStep(intent: ExtractedIntent): {
    ready: boolean;
    missingFields: string[];
    nextQuestion?: string;
  } {
    const missingFields: string[] = [];
    
    // Check required fields
    if (!intent.destination_city && !intent.destination_country) {
      missingFields.push('destination');
    }
    if (!intent.duration_days) {
      missingFields.push('duration');
    }
    if (!intent.people_count && !intent.companions) {
      missingFields.push('travelers');
    }
    if (intent.tags.length === 0 && !intent.notes) {
      missingFields.push('interests');
    }

    // Determine if ready to generate
    const ready = intent.destination_city !== null && 
                  intent.duration_days !== null && 
                  (intent.tags.length > 0 || intent.notes !== null);

    // Generate next question
    let nextQuestion: string | undefined;
    if (!ready && missingFields.length > 0) {
      switch (missingFields[0]) {
        case 'destination':
          nextQuestion = "Where would you like to go?";
          break;
        case 'duration':
          nextQuestion = "How many days are you planning to travel?";
          break;
        case 'travelers':
          nextQuestion = "How many people will be traveling?";
          break;
        case 'interests':
          nextQuestion = "What are you interested in seeing or doing?";
          break;
      }
    }

    return {
      ready,
      missingFields,
      nextQuestion
    };
  }
}

export const intentExtractionService = new IntentExtractionService();