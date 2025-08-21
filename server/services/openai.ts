import OpenAI from "openai";
import { ChatMessage } from "@shared/schema";
import { searchPlaces } from "./googlePlaces";
import { normalizeUserInput, fuzzyMatchDestination, suggestCorrection, popularCities } from "../utils/textProcessing";

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

// Enhanced fallback conversation logic with city-aware fuzzy matching
function fallbackConversation(context: ConversationContext): {
  response: string;
  nextStep: string;
  options?: string[];
  extractedInfo?: Partial<ConversationContext>;
} {
  const userMessage = context.messages[context.messages.length - 1]?.content || "";
  
  // Check what step we're on based on context to help with ambiguous inputs
  const isAskingForDays = context.destination && !context.days;
  const isAskingForPeople = context.destination && context.days && !context.people;
  const isAskingForTheme = context.destination && context.days && context.people && !context.theme;
  
  // Normalize the input (convert word numbers to digits, etc.)
  let { normalized, detectedDestination, isCountry, suggestedCities, detectedDays, detectedPeople } = normalizeUserInput(userMessage);
  
  // Context-aware interpretation of simple numbers
  if (/^\d+$/.test(userMessage.trim()) || /^[a-z]+$/.test(userMessage.trim().toLowerCase())) {
    const simpleNumber = parseInt(normalizeUserInput(userMessage.trim()).normalized);
    if (!isNaN(simpleNumber)) {
      if (isAskingForDays && !detectedDays) {
        detectedDays = simpleNumber;
      } else if (isAskingForPeople && !detectedPeople) {
        detectedPeople = simpleNumber;
      }
    }
  }
  
  // Step 1: Get destination (country or city)
  if (!context.destination) {
    if (detectedDestination) {
      // Check if it's a country - if so, suggest cities
      if (isCountry && suggestedCities && suggestedCities.length > 0) {
        const cityList = suggestedCities.slice(0, 5); // Show top 5 cities
        return {
          response: `${detectedDestination} is fantastic! Which city catches your eye? ${cityList.join(', ')} are all incredible, but feel free to type any city you prefer!`,
          nextStep: "question",
          options: cityList,
          extractedInfo: {} // Don't save destination yet, wait for city selection
        };
      } else {
        // It's a specific city, proceed normally
        return {
          response: `Excellent choice! ${detectedDestination} is an amazing destination. How long are you planning to stay there?`,
          nextStep: "question",
          extractedInfo: { destination: detectedDestination }
        };
      }
    } else {
      // Check if they're responding to a city suggestion from a previous country selection
      const previousMessages = context.messages;
      let currentCountry = "";
      let isStuckInLoop = false;
      
      // Check if we're stuck in a loop (same message repeated)
      if (previousMessages.length >= 2) {
        const lastTwoResponses = previousMessages.slice(-2).filter(m => m.role === 'assistant');
        if (lastTwoResponses.length >= 2 && 
            lastTwoResponses[0].content === lastTwoResponses[1].content) {
          isStuckInLoop = true;
        }
      }
      
      // Find the most recent country context from the conversation
      for (let i = previousMessages.length - 1; i >= 0; i--) {
        const msg = previousMessages[i].content.toLowerCase();
        // Check if a country was mentioned in recent messages
        for (const country of Object.keys(popularCities)) {
          if (msg.includes(country)) {
            currentCountry = country;
            break;
          }
        }
        if (currentCountry) break;
      }
      
      // If we're stuck in a loop, try to accept the input as-is
      if (isStuckInLoop && userMessage.trim().length >= 3) {
        const cityName = userMessage.trim();
        const properCase = cityName.charAt(0).toUpperCase() + cityName.slice(1).toLowerCase();
        return {
          response: `Got it! Let's explore ${properCase}. How many days will you be there?`,
          nextStep: "question",
          extractedInfo: { destination: properCase }
        };
      }
      
      // If we have country context and user typed something that could be a city
      if (currentCountry && userMessage.trim().length > 0) {
        const userCity = userMessage.trim();
        
        // First check for exact match in our curated list
        const citiesForCountry = popularCities[currentCountry] || [];
        const exactMatch = citiesForCountry.find((city: string) => 
          city.toLowerCase() === userCity.toLowerCase()
        );
        
        if (exactMatch) {
          // Found exact match in curated list
          return {
            response: `Perfect! ${exactMatch} is an amazing choice. How many days will you be exploring there?`,
            nextStep: "question",
            extractedInfo: { destination: `${exactMatch}, ${currentCountry.charAt(0).toUpperCase() + currentCountry.slice(1)}` }
          };
        } else {
          // Not in curated list - accept it as-is (will validate via Google Places later)
          // This handles cities like Dallas, Okinawa, or any other city not in our list
          const countryName = currentCountry === 'usa' ? 'USA' : 
                             currentCountry === 'uk' ? 'UK' :
                             currentCountry.charAt(0).toUpperCase() + currentCountry.slice(1);
          
          return {
            response: `Great choice! ${userCity} sounds wonderful. How many days are you planning to stay there?`,
            nextStep: "question",
            extractedInfo: { destination: `${userCity}, ${countryName}` }
          };
        }
      }
      
      // Try standard city matching if no country context
      const cityMatch = fuzzyMatchDestination(userMessage);
      if (cityMatch.destination && !cityMatch.isCountry) {
        return {
          response: `Perfect! ${cityMatch.destination} it is. How many days will you be exploring there?`,
          nextStep: "question",
          extractedInfo: { destination: cityMatch.destination }
        };
      }
      
      // Suggest correction if input seems like a typo
      const correction = suggestCorrection(userMessage);
      if (correction) {
        return {
          response: `Hmm, I'm not sure I caught that. ${correction} Feel free to tell me any destination you have in mind!`,
          nextStep: "question",
          options: ["Japan", "France", "Italy", "USA", "Spain"]
        };
      }
      
      // Initial greeting - more conversational
      return {
        response: "Hey there! I'm excited to help you plan your next adventure. Where are you dreaming of going? Could be a country, a city, or even just a vibe you're after!",
        nextStep: "question",
        options: ["Japan", "France", "Italy", "USA", "Spain"]
      };
    }
  }
  
  // Step 2: Get number of days - more conversational
  if (!context.days) {
    if (detectedDays && detectedDays > 0 && detectedDays <= 30) {
      // Vary response based on trip length
      let dayResponse = "";
      if (detectedDays <= 3) {
        dayResponse = `A quick ${detectedDays}-day getaway to ${context.destination} - perfect for a weekend escape!`;
      } else if (detectedDays <= 7) {
        dayResponse = `Nice! ${detectedDays} days in ${context.destination} gives you enough time to really experience the city.`;
      } else {
        dayResponse = `Wonderful! ${detectedDays} days in ${context.destination} - you'll have time to explore at a relaxed pace.`;
      }
      return {
        response: `${dayResponse} Are you traveling solo or with others?`,
        nextStep: "question",
        extractedInfo: { days: detectedDays }
      };
    } else if (detectedDays && detectedDays > 30) {
      return {
        response: "Wow, that's an epic journey! I typically help with trips up to 30 days to keep things focused. How about we plan for a shorter duration?",
        nextStep: "question",
        options: ["1 week", "2 weeks", "3 weeks", "1 month"]
      };
    } else {
      // Check for informal duration mentions
      const lowerNormalized = normalized.toLowerCase();
      if (lowerNormalized.includes("weekend")) {
        return {
          response: `A weekend trip to ${context.destination} sounds perfect! So that's about 2-3 days. Who's joining you on this adventure?`,
          nextStep: "question",
          extractedInfo: { days: 3 }
        };
      } else if (lowerNormalized.includes("week")) {
        const weeks = lowerNormalized.includes("two") ? 14 : lowerNormalized.includes("three") ? 21 : 7;
        return {
          response: `${weeks === 7 ? 'A week' : weeks === 14 ? 'Two weeks' : 'Three weeks'} in ${context.destination} - perfect amount of time! Will you be traveling alone or with company?`,
          nextStep: "question",
          extractedInfo: { days: weeks }
        };
      }
      
      return {
        response: `How long are you thinking of staying in ${context.destination}? A weekend getaway? A week-long adventure? Or something else?`,
        nextStep: "question",
        options: ["Weekend (2-3 days)", "One week", "10 days", "Two weeks"]
      };
    }
  }
  
  // Step 3: Get number of people - more natural conversation
  if (!context.people) {
    // First check if we can detect a number directly in the input
    const lowerNormalized = normalized.toLowerCase();
    
    // Check for direct number input (handles "3", "three", "we are 3", etc.)
    if (detectedPeople && detectedPeople > 0 && detectedPeople <= 20) {
      let peopleResponse = "";
      if (detectedPeople === 1) {
        peopleResponse = "Solo travel - love it! There's something special about exploring on your own terms.";
      } else if (detectedPeople === 2) {
        peopleResponse = "Perfect for two! Whether it's romance or friendship, traveling as a pair is always fun.";
      } else if (detectedPeople <= 4) {
        peopleResponse = `Nice small group of ${detectedPeople}! That's ideal for flexibility and shared experiences.`;
      } else {
        peopleResponse = `A group of ${detectedPeople} - that'll be quite the adventure!`;
      }
      
      // Directly proceed to theme selection - no redundant confirmation
      return {
        response: `${peopleResponse} For your trip to ${context.destination}, are there any must-visit places or experiences you definitely want to include?`,
        nextStep: "preferences",
        options: [], // Let frontend show city-specific tags
        extractedInfo: { people: detectedPeople }
      };
    } 
    
    // Handle numbers too large
    if (detectedPeople && detectedPeople > 20) {
      return {
        response: "Wow, that's quite the crew! I typically help with groups up to 20 to keep things manageable. Could you give me a more specific number?",
        nextStep: "question"
      };
    }
    
    // Check for various people count expressions even without explicit numbers
    if (lowerNormalized.includes("just me") || lowerNormalized.includes("only me") ||
        lowerNormalized.includes("by myself") || lowerNormalized.includes("on my own")) {
      return {
        response: `Solo adventure it is! I love the freedom of traveling alone. For ${context.destination}, are there any must-visit places or experiences on your list?`,
        nextStep: "preferences",
        options: [], // Let frontend show city-specific tags
        extractedInfo: { people: 1 }
      };
    }
    
    // Handle "we are X" patterns
    const weAreMatch = lowerNormalized.match(/we\s*(?:are|'re)?\s*(\w+)/);
    if (weAreMatch) {
      const numberWord = weAreMatch[1];
      // Try to parse if it's a number word
      const { detectedPeople: parsedPeople } = normalizeUserInput(numberWord);
      if (parsedPeople && parsedPeople > 0 && parsedPeople <= 20) {
        let peopleResponse = parsedPeople <= 4 ? 
          `Great, ${parsedPeople} of you traveling together!` :
          `A group of ${parsedPeople} - that'll be fun!`;
        
        return {
          response: `${peopleResponse} For your trip to ${context.destination}, are there any must-visit places or experiences you definitely want to include?`,
          nextStep: "preferences",
          options: [], // Let frontend show city-specific tags
          extractedInfo: { people: parsedPeople }
        };
      }
    }
    
    // Otherwise, check for informal people counts
    else {
      // Check for other informal people counts
      if (lowerNormalized.includes("solo") || lowerNormalized.includes("alone") || 
          lowerNormalized.includes("myself")) {
        return {
          response: `Solo adventure it is! I love the freedom of traveling alone. For ${context.destination}, are there any must-visit places or experiences on your list?`,
          nextStep: "preferences",
          options: [], // Let frontend show city-specific tags
          extractedInfo: { people: 1 }
        };
      } else if (lowerNormalized.includes("couple") || lowerNormalized.includes("partner") ||
                 lowerNormalized.includes("boyfriend") || lowerNormalized.includes("girlfriend") ||
                 lowerNormalized.includes("husband") || lowerNormalized.includes("wife") ||
                 lowerNormalized.includes("two of us") || lowerNormalized.includes("both of us")) {
        return {
          response: `How romantic! Traveling as a couple is always special. For ${context.destination}, are there any must-visit places or experiences you both want to include?`,
          nextStep: "preferences",
          options: [], // Let frontend show city-specific tags
          extractedInfo: { people: 2 }
        };
      } else if (lowerNormalized.includes("family")) {
        // Only ask for specifics if they just say "family" without a number
        return {
          response: "Family trips create the best memories! How many of you will be traveling together?",
          nextStep: "question",
          options: ["3 people", "4 people", "5 people", "More than 5"]
        };
      } else if (lowerNormalized.includes("friends") || lowerNormalized.includes("group")) {
        // Only ask for specifics if they don't provide a number
        return {
          response: "Traveling with friends is always a blast! How many in your crew?",
          nextStep: "question",
          options: ["3-4 friends", "5-6 friends", "7-8 friends", "Larger group"]
        };
      }
      
      // Initial question if nothing detected
      return {
        response: `Will you be exploring ${context.destination} solo or with others? Just let me know the number!`,
        nextStep: "question",
        options: ["Solo adventure", "Couple's trip", "Family vacation", "Friends getaway"]
      };
    }
  }
  
  // Step 4: Get theme/preference - natural conversation style
  if (!context.theme) {
    let theme = "classic";
    const lowerMessage = normalized.toLowerCase();
    
    // Check if this is from TagSelector (format: "I'm interested in: tag1, tag2, tag3")
    if (lowerMessage.includes("i'm interested in:") || lowerMessage.includes("i am interested in:")) {
      // Extract the tags part after the colon
      const tagsPart = userMessage.split(':')[1]?.trim() || "";
      
      // Store the specific tags/interests for later use
      theme = tagsPart || "custom";
      
      // If we got specific tags, use them as the theme
      if (tagsPart) {
        // Create a personalized response based on the selected interests
        const interests = tagsPart.split(',').map(t => t.trim());
        const interestList = interests.length > 2 
          ? interests.slice(0, -1).join(', ') + ', and ' + interests[interests.length - 1]
          : interests.join(' and ');
          
        return {
          response: `Fantastic choices! I'll create packages focusing on ${interestList}. Let me find the best experiences in ${context.destination} that match your interests...`,
          nextStep: "generate",
          extractedInfo: { theme }
        };
      }
    }
    
    // Fallback to generic theme mapping for non-tag-based inputs
    if (lowerMessage.includes("food") || lowerMessage.includes("eat") || 
        lowerMessage.includes("culinary") || lowerMessage.includes("restaurant") ||
        lowerMessage.includes("foodie") || lowerMessage.includes("cuisine") ||
        lowerMessage.includes("local food") || lowerMessage.includes("dining")) {
      theme = "foodie";
    } else if (lowerMessage.includes("budget") || lowerMessage.includes("cheap") || 
               lowerMessage.includes("affordable") || lowerMessage.includes("economical") ||
               lowerMessage.includes("save") || lowerMessage.includes("backpack")) {
      theme = "budget";
    } else if (lowerMessage.includes("highlight") || lowerMessage.includes("must-see") ||
               lowerMessage.includes("tourist") || lowerMessage.includes("landmark") ||
               lowerMessage.includes("famous") || lowerMessage.includes("popular") ||
               lowerMessage.includes("classic") || lowerMessage.includes("main")) {
      theme = "classic";
    } else if (lowerMessage.includes("hidden") || lowerMessage.includes("local") ||
               lowerMessage.includes("authentic") || lowerMessage.includes("off") ||
               lowerMessage.includes("secret")) {
      theme = "adventure";
    } else if (lowerMessage.includes("everything") || lowerMessage.includes("mix") ||
               lowerMessage.includes("variety") || lowerMessage.includes("both") ||
               lowerMessage.includes("all")) {
      theme = "balanced";
    }
    
    // Create a personalized summary message
    let summaryMessage = "";
    if (context.people === 1) {
      summaryMessage = `Brilliant! I'm crafting ${context.days}-day solo adventure packages for ${context.destination}`;
    } else if (context.people === 2) {
      summaryMessage = `Perfect! Creating ${context.days}-day packages for two in ${context.destination}`;
    } else {
      summaryMessage = `Excellent! Putting together ${context.days}-day packages for your group of ${context.people} in ${context.destination}`;
    }
    
    // Add theme-specific flavor
    let themeMessage = "";
    switch(theme) {
      case "foodie":
        themeMessage = " with a focus on amazing local cuisine and dining experiences";
        break;
      case "budget":
        themeMessage = " that won't break the bank but still hit all the right spots";
        break;
      case "adventure":
        themeMessage = " featuring hidden gems and local favorites";
        break;
      case "balanced":
        themeMessage = " with a perfect mix of must-sees and local experiences";
        break;
      default:
        themeMessage = " covering all the iconic highlights";
    }
    
    return {
      response: `${summaryMessage}${themeMessage}. Give me just a moment to pull together some amazing options using real places and current recommendations...`,
      nextStep: "generate",
      extractedInfo: { theme }
    };
  }
  
  // Default response if we have all info but somehow reach here
  return {
    response: `Great! I've got everything I need for your ${context.days}-day trip to ${context.destination}. Let me create some personalized packages for you...`,
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
