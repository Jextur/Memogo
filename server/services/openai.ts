import OpenAI from "openai";
import { ChatMessage } from "@shared/schema";
import { searchPlaces } from "./googlePlaces";

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

// Simple fallback conversation logic for when OpenAI is unavailable
function fallbackConversation(context: ConversationContext): {
  response: string;
  nextStep: string;
  options?: string[];
  extractedInfo?: Partial<ConversationContext>;
} {
  const userMessage = context.messages[context.messages.length - 1]?.content.toLowerCase() || "";
  
  if (!context.destination && (userMessage.includes("paris") || userMessage.includes("france"))) {
    return {
      response: "Great choice! Paris is amazing. How many days are you planning to stay?",
      nextStep: "question",
      extractedInfo: { destination: "Paris, France" }
    };
  } else if (!context.destination && (userMessage.includes("tokyo") || userMessage.includes("japan"))) {
    return {
      response: "Tokyo is incredible! How many days would you like to explore Japan?",
      nextStep: "question",
      extractedInfo: { destination: "Tokyo, Japan" }
    };
  } else if (!context.destination && (userMessage.includes("london") || userMessage.includes("england") || userMessage.includes("uk"))) {
    return {
      response: "London is a fantastic choice! How many days are you planning to visit?",
      nextStep: "question", 
      extractedInfo: { destination: "London, England" }
    };
  } else if (!context.days && userMessage.match(/\d+\s*(day|night)/)) {
    const days = parseInt(userMessage.match(/(\d+)/)?.[1] || "3");
    return {
      response: `Perfect! ${days} days in ${context.destination || "your destination"} sounds wonderful. How many people will be traveling?`,
      nextStep: "question", 
      extractedInfo: { days }
    };
  } else if (!context.people && userMessage.match(/\d+\s*(people|person|traveler)/)) {
    const people = parseInt(userMessage.match(/(\d+)/)?.[1] || "2");
    return {
      response: `Excellent! For ${people} ${people === 1 ? 'person' : 'people'}. What type of experience are you looking for?`,
      nextStep: "question",
      options: ["Classic sightseeing", "Food & dining focused", "Budget-friendly"],
      extractedInfo: { people }
    };
  } else if (!context.theme) {
    let theme = "classic";
    if (userMessage.includes("food") || userMessage.includes("dining") || userMessage.includes("culinary")) {
      theme = "foodie";
    } else if (userMessage.includes("budget") || userMessage.includes("cheap") || userMessage.includes("affordable")) {
      theme = "budget";
    }
    return {
      response: "Perfect! I have all the information I need. Let me create personalized travel packages for you using real places and attractions. This will take a moment...",
      nextStep: "generate",
      extractedInfo: { theme }
    };
  } else {
    return {
      response: "I'd love to help you plan a trip! Where would you like to go? (Try Paris, Tokyo, or London)",
      nextStep: "question"
    };
  }
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
