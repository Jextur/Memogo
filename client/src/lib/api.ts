import { apiRequest } from "./queryClient";
import { ChatMessage, Conversation, TravelPackage, POI } from "../types/travel";

// Conversation API
export async function createConversation(data: {
  userId?: string;
  destination?: string;
  days?: number;
  people?: number;
  theme?: string;
}): Promise<Conversation> {
  const response = await apiRequest("POST", "/api/conversation", data);
  return await response.json();
}

export async function sendMessage(conversationId: string, message: string): Promise<{
  conversation: Conversation;
  aiResponse: ChatMessage;
  nextStep: string;
}> {
  const response = await apiRequest("POST", `/api/conversation/${conversationId}/message`, { message });
  return await response.json();
}

export async function getConversation(conversationId: string): Promise<Conversation> {
  const response = await apiRequest("GET", `/api/conversation/${conversationId}`);
  return await response.json();
}

// Package API
export async function generatePackages(conversationId: string): Promise<{ packages: TravelPackage[] }> {
  const response = await apiRequest("POST", `/api/conversation/${conversationId}/generate-packages`);
  return await response.json();
}

export async function getPackage(packageId: string): Promise<TravelPackage> {
  const response = await apiRequest("GET", `/api/packages/${packageId}`);
  return await response.json();
}

export async function getPackagesByConversation(conversationId: string): Promise<TravelPackage[]> {
  const response = await apiRequest("GET", `/api/conversation/${conversationId}/packages`);
  return await response.json();
}

export async function refinePackage(packageId: string, refinementRequest: string): Promise<TravelPackage> {
  const response = await apiRequest("POST", `/api/packages/${packageId}/refine`, { refinementRequest });
  return await response.json();
}

export async function exportPackage(packageId: string): Promise<void> {
  const response = await apiRequest("GET", `/api/packages/${packageId}/export`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `travel_package_${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Places API
export async function searchPlaces(
  query: string, 
  options?: {
    theme?: string;
    city?: string;
    tags?: string[];
    timeSlot?: string;
    conversationId?: string;
  }
): Promise<{ results: POI[] }> {
  const params = new URLSearchParams({ query });
  if (options?.theme) params.append('theme', options.theme);
  if (options?.city) params.append('city', options.city);
  if (options?.tags?.length) params.append('tags', options.tags.join(','));
  if (options?.timeSlot) params.append('timeSlot', options.timeSlot);
  if (options?.conversationId) params.append('conversationId', options.conversationId);
  
  const response = await apiRequest("GET", `/api/places/search?${params}`);
  return await response.json();
}

export async function getPlaceDetails(placeId: string): Promise<{ result: POI }> {
  const response = await apiRequest("GET", `/api/places/details/${placeId}`);
  return await response.json();
}

export function getPhotoUrl(photoRef: string, maxWidth: number = 400): string {
  return `/api/places/photo?ref=${photoRef}&maxwidth=${maxWidth}`;
}

// Get city-specific tags/attractions
export async function getCityTags(cityName: string, countryCode: string): Promise<{ tags: string[], isDefault: boolean }> {
  const response = await apiRequest("GET", `/api/cities/tags/${encodeURIComponent(cityName)}/${encodeURIComponent(countryCode)}`);
  return await response.json();
}
