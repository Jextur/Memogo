export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  options?: string[];
}

export interface Conversation {
  id: number | string;  // Can be numeric or string
  conversationId?: string;  // The UUID string identifier
  userId?: string;
  destination?: string;
  days?: number;
  people?: number;
  theme?: string;
  selectedTags?: string[];
  status: string;
  messages: ChatMessage[];
  refinementCount: number;
  packagesGenerated?: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface TravelPackage {
  id: string;
  conversationId?: string;
  name: string;
  type: "classic" | "foodie" | "budget";
  destination: string;
  days: number;
  budget: string;
  description?: string;
  route?: string;
  accommodation?: string;
  diningCount?: number;
  attractionCount?: number;
  highlights?: string[];
  itinerary?: ItineraryDay[];
  createdAt: Date;
}

export interface ItineraryDay {
  day: number;
  date?: string;
  location: string;
  title: string;
  description?: string;
  activities: Activity[];
}

export interface Activity {
  id: string;
  time: "morning" | "afternoon" | "evening";
  name: string;
  type: "restaurant" | "attraction" | "accommodation" | "transportation";
  address?: string;
  rating?: number;
  priceLevel?: number;
  placeId?: string;
  photoRef?: string;
  duration?: string;
}

export interface POI {
  place_id: string;
  name: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types?: string[];
  address?: string;
  location?: { lat: number; lng: number };
  open_now?: boolean;
  photo_ref?: string;
}
