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

export async function continueConversation(context: ConversationContext): Promise<{
  response: string;
  nextStep: string;
  options?: string[];
  extractedInfo?: Partial<ConversationContext>;
}> {
  try {
    const systemPrompt = `You are a professional AI travel consultant for Travelify. Your goal is to gather travel preferences through a natural conversation (maximum 3 questions) and then generate personalized travel packages.

Current conversation context:
- Destination: ${context.destination || "not specified"}
- Days: ${context.days || "not specified"}
- People: ${context.people || "not specified"}
- Theme: ${context.theme || "not specified"}

Guidelines:
1. Ask only the most essential questions (max 3 total)
2. Be conversational and friendly, not robotic
3. If destination is not clear, ask for it first
4. If days/duration is not clear, ask for it second
5. If theme/preferences are not clear, ask for it third
6. Once you have destination, days, and theme - indicate you're ready to generate packages
7. Provide response options when helpful
8. Extract any travel information mentioned by the user

Respond in JSON format with:
{
  "response": "your conversational response",
  "nextStep": "question|generate|complete",
  "options": ["option1", "option2"] (optional),
  "extractedInfo": {
    "destination": "if mentioned",
    "days": number (if mentioned),
    "people": number (if mentioned),
    "theme": "if mentioned"
  }
}`;

    const messages = context.messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result;
  } catch (error) {
    console.error("OpenAI conversation error:", error);
    return {
      response: "I'm having trouble processing your request. Could you please try again?",
      nextStep: "question"
    };
  }
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
  try {
    // Fetch real POI data for context
    const poiContext = await fetchDestinationPOIs(request.destination);
    
    const systemPrompt = `You are an expert travel package generator. Create 3 distinct travel packages for the given requirements using real place data.

${poiContext}

Requirements:
- Destination: ${request.destination}
- Duration: ${request.days} days
- People: ${request.people || 1}
- Theme: ${request.theme}

Generate 3 packages:
1. Classic: Traditional/cultural focus with mid-range budget
2. Foodie: Culinary experiences with higher budget  
3. Budget: Essential experiences with lower budget

IMPORTANT: Use the real place names provided above when creating itineraries. Reference actual restaurants, attractions, and hotels from the data.

For each package, create:
- Realistic budget (total per person in USD)
- Detailed route through cities
- Accommodation type
- Number of dining experiences and attractions
- Key highlights (4-5 items)
- Day-by-day itinerary with REAL place names from the POI data

Respond in JSON format with an array of 3 packages:
[
  {
    "name": "package name",
    "type": "classic|foodie|budget",
    "budget": "$X,XXX",
    "description": "brief description",
    "route": "City1 → City2 → City3",
    "accommodation": "accommodation type",
    "diningCount": number,
    "attractionCount": number,
    "highlights": ["highlight1", "highlight2", "highlight3", "highlight4"],
    "itinerary": [
      {
        "day": 1,
        "location": "city",
        "title": "Day 1: Title",
        "description": "brief description",
        "activities": ["activity1", "activity2", "activity3"]
      }
    ]
  }
]`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Generate travel packages for ${request.destination}, ${request.days} days, ${request.theme} theme` }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
    });

    const result = JSON.parse(response.choices[0].message.content || "[]");
    return result.packages || result;
  } catch (error) {
    console.error("OpenAI package generation error:", error);
    throw new Error("Failed to generate travel packages");
  }
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
