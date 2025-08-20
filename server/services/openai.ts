import OpenAI from "openai";
import { ChatMessage } from "@shared/schema";
import { searchPlaces } from "./googlePlaces";
import { normalizeUserInput, fuzzyMatchDestination, suggestCorrection } from "../utils/textProcessing";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "your_openai_api_key",
});

export interface ConversationContext {
  destination?: string;
  days?: number;
  people?: number;
  theme?: string;
  messages: ChatMessage[];
}

export interface PackageGenerationRequest {
  destination: string;
  days: number;
  people?: number;
  theme: string;
}

export interface GeneratedPackage {
  name: string;
  type: "classic" | "foodie" | "budget";
  budget: string;
  description: string;
  route: string;
  accommodation: string;
  diningCount: number;
  attractionCount: number;
  highlights: string[];
  itinerary: any[];
}

// Enhanced fallback conversation logic with fuzzy matching and better input handling
function fallbackConversation(context: ConversationContext): {
  response: string;
  nextStep: string;
  options?: string[];
  extractedInfo?: Partial<ConversationContext>;
} {
  const userMessage = context.messages[context.messages.length - 1]?.content || "";
  
  // Normalize the input (convert word numbers to digits, etc.)
  const { normalized, detectedDestination, detectedDays, detectedPeople } = normalizeUserInput(userMessage);
  
  // Step 1: Get destination
  if (!context.destination) {
    // Try fuzzy matching for destination
    const destination = detectedDestination || fuzzyMatchDestination(userMessage);
    
    if (destination) {
      return {
        response: `Great choice! ${destination} is amazing. How many days are you planning to stay?`,
        nextStep: "question",
        extractedInfo: { destination }
      };
    } else {
      // Suggest correction if input seems like a typo
      const correction = suggestCorrection(userMessage);
      if (correction) {
        return {
          response: `I didn't quite catch that. ${correction} Or you can tell me any destination you'd like to visit!`,
          nextStep: "question",
          options: ["London", "Paris", "Tokyo", "New York", "Rome"]
        };
      }
      
      // Default prompt for destination
      return {
        response: "I'd love to help you plan a trip! Where would you like to go? You can choose from popular destinations or tell me any place you have in mind.",
        nextStep: "question",
        options: ["London", "Paris", "Tokyo", "New York", "Rome"]
      };
    }
  }
  
  // Step 2: Get number of days
  if (!context.days) {
    if (detectedDays && detectedDays > 0 && detectedDays <= 30) {
      return {
        response: `Perfect! ${detectedDays} days in ${context.destination} sounds wonderful. How many people will be traveling?`,
        nextStep: "question",
        extractedInfo: { days: detectedDays }
      };
    } else if (detectedDays && detectedDays > 30) {
      return {
        response: "That's quite a long trip! For now, I can help plan trips up to 30 days. How many days would you like to stay (1-30)?",
        nextStep: "question"
      };
    } else {
      return {
        response: `How many days are you planning to spend in ${context.destination}? You can tell me in any format (e.g., "5 days", "five days", "a week").`,
        nextStep: "question",
        options: ["3 days", "5 days", "7 days", "10 days"]
      };
    }
  }
  
  // Step 3: Get number of people
  if (!context.people) {
    if (detectedPeople && detectedPeople > 0 && detectedPeople <= 20) {
      return {
        response: `Excellent! For ${detectedPeople} ${detectedPeople === 1 ? 'person' : 'people'}. What type of experience are you looking for?`,
        nextStep: "question",
        options: ["Classic sightseeing", "Food & dining focused", "Budget-friendly"],
        extractedInfo: { people: detectedPeople }
      };
    } else if (detectedPeople && detectedPeople > 20) {
      return {
        response: "That's a large group! I can help plan for groups up to 20 people. How many travelers will there be?",
        nextStep: "question"
      };
    } else {
      // Check for informal people counts
      if (normalized.includes("solo") || normalized.includes("alone") || normalized.includes("myself")) {
        return {
          response: "Perfect! A solo adventure. What type of experience are you looking for?",
          nextStep: "question",
          options: ["Classic sightseeing", "Food & dining focused", "Budget-friendly"],
          extractedInfo: { people: 1 }
        };
      } else if (normalized.includes("couple") || normalized.includes("two of us")) {
        return {
          response: "Excellent! For 2 people. What type of experience are you looking for?",
          nextStep: "question",
          options: ["Classic sightseeing", "Food & dining focused", "Budget-friendly"],
          extractedInfo: { people: 2 }
        };
      } else if (normalized.includes("family")) {
        return {
          response: "A family trip sounds wonderful! How many people total will be traveling?",
          nextStep: "question",
          options: ["2 people", "3 people", "4 people", "5+ people"]
        };
      }
      
      return {
        response: `How many people will be traveling to ${context.destination}? You can say things like "just me", "2 people", "a family of four", etc.`,
        nextStep: "question",
        options: ["Just me", "2 people", "3-4 people", "5+ people"]
      };
    }
  }
  
  // Step 4: Get theme/preference
  if (!context.theme) {
    let theme = "classic";
    const lowerMessage = normalized.toLowerCase();
    
    if (lowerMessage.includes("food") || lowerMessage.includes("dining") || 
        lowerMessage.includes("culinary") || lowerMessage.includes("restaurant") ||
        lowerMessage.includes("foodie")) {
      theme = "foodie";
    } else if (lowerMessage.includes("budget") || lowerMessage.includes("cheap") || 
               lowerMessage.includes("affordable") || lowerMessage.includes("economical") ||
               lowerMessage.includes("save money")) {
      theme = "budget";
    } else if (lowerMessage.includes("classic") || lowerMessage.includes("sightseeing") ||
               lowerMessage.includes("tourist") || lowerMessage.includes("landmark") ||
               lowerMessage.includes("must-see")) {
      theme = "classic";
    }
    
    return {
      response: `Perfect! I have all the information I need. Let me create personalized travel packages for your ${context.days}-day trip to ${context.destination} for ${context.people} ${context.people === 1 ? 'person' : 'people'}. This will take a moment...`,
      nextStep: "generate",
      extractedInfo: { theme }
    };
  }
  
  // Default response if we have all info but somehow reach here
  return {
    response: "I have all your travel details! Let me create your personalized packages now...",
    nextStep: "generate"
  };
}

export async function continueConversation(context: ConversationContext): Promise<{
  response: string;
  nextStep: string;
  options?: string[];
  extractedInfo?: Partial<ConversationContext>;
}> {
  // For now, use fallback conversation since OpenAI quota is exceeded
  return fallbackConversation(context);
  

}

async function fetchDestinationPOIs(destination: string): Promise<string> {
  try {
    // Fetch sample POIs to provide AI with real place data context
    const [restaurants, attractions, hotels] = await Promise.all([
      searchPlaces(`restaurants in ${destination}`),
      searchPlaces(`attractions in ${destination}`),
      searchPlaces(`hotels in ${destination}`)
    ]);

    const poiContext = `
Real places in ${destination}:
Restaurants: ${restaurants.slice(0, 5).map(p => `${p.name} (${p.rating}⭐)`).join(', ')}
Attractions: ${attractions.slice(0, 5).map(p => `${p.name} (${p.rating}⭐)`).join(', ')}
Hotels: ${hotels.slice(0, 3).map(p => `${p.name} (${p.rating}⭐)`).join(', ')}
    `;
    
    return poiContext;
  } catch (error) {
    console.error("Error fetching POI context:", error);
    return `Destination: ${destination} (authentic POI data unavailable)`;
  }
}

export async function generateTravelPackages(request: PackageGenerationRequest): Promise<GeneratedPackage[]> {
  console.log("Generating packages using Google Places data fallback for:", request.destination);
    
    // Fallback package generation using real Google Places data
    const [restaurants, attractions, hotels] = await Promise.all([
      searchPlaces(`restaurants in ${request.destination}`),
      searchPlaces(`attractions in ${request.destination}`),
      searchPlaces(`hotels in ${request.destination}`)
    ]);

    const baseItinerary = Array.from({ length: request.days }, (_, i) => ({
      day: i + 1,
      location: request.destination,
      title: `Day ${i + 1}: Explore ${request.destination}`,
      description: `Discover ${request.destination} with authentic local experiences`,
      activities: [
        restaurants[i % restaurants.length]?.name || `Local restaurant`,
        attractions[i % attractions.length]?.name || `Popular attraction`,
        `Evening leisure time`
      ]
    }));

    return [
      {
        name: `Classic ${request.destination}`,
        type: "classic" as const,
        budget: `$${800 + (request.days * 150)}`,
        description: `Traditional sightseeing experience in ${request.destination}`,
        route: request.destination,
        accommodation: hotels[0]?.name || "Mid-range hotel",
        diningCount: Math.min(restaurants.length, 8),
        attractionCount: Math.min(attractions.length, 6),
        highlights: attractions.slice(0, 4).map(a => a.name),
        itinerary: baseItinerary
      },
      {
        name: `Foodie ${request.destination}`,
        type: "foodie" as const,
        budget: `$${1200 + (request.days * 200)}`,
        description: `Culinary-focused journey through ${request.destination}`,
        route: request.destination,
        accommodation: hotels[1]?.name || "Boutique hotel",
        diningCount: Math.min(restaurants.length, 12),
        attractionCount: Math.min(attractions.length, 4),
        highlights: restaurants.slice(0, 4).map(r => r.name),
        itinerary: baseItinerary.map(day => ({
          ...day,
          activities: [
            restaurants[(day.day - 1) % restaurants.length]?.name || `Fine dining`,
            restaurants[((day.day - 1) + restaurants.length/2) % restaurants.length]?.name || `Local cuisine`,
            attractions[(day.day - 1) % attractions.length]?.name || `Cultural site`
          ]
        }))
      },
      {
        name: `Budget ${request.destination}`,
        type: "budget" as const,
        budget: `$${400 + (request.days * 80)}`,
        description: `Affordable exploration of ${request.destination}`,
        route: request.destination,
        accommodation: "Budget-friendly accommodation",
        diningCount: Math.min(restaurants.length, 4),
        attractionCount: Math.min(attractions.length, 8),
        highlights: attractions.slice(0, 4).map(a => a.name),
        itinerary: baseItinerary
      }
    ];
}

export async function refineItinerary(
  currentItinerary: any,
  refinementRequest: string,
  context: { destination: string; days: number; theme: string }
): Promise<any> {
  try {
    const systemPrompt = `You are helping refine a travel itinerary based on user feedback.

Current itinerary context:
- Destination: ${context.destination}
- Duration: ${context.days} days
- Theme: ${context.theme}

User refinement request: "${refinementRequest}"

Modify the itinerary according to the user's request while maintaining:
- Logical flow and timing
- Realistic travel distances
- Appropriate mix of activities
- Budget considerations

Return the updated itinerary in the same JSON format as the original.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Current itinerary: ${JSON.stringify(currentItinerary)}\n\nRefinement request: ${refinementRequest}` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result.itinerary || result;
  } catch (error) {
    console.error("OpenAI refinement error:", error);
    throw new Error("Failed to refine itinerary");
  }
}
