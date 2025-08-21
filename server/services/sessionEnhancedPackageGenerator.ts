import { searchPlaces, getPlaceDetails } from './googlePlaces';
import { generateEnhancedTravelPackages } from './enhancedPackageGenerator';
import { sessionManager } from './sessionManager';
import type { TravelPackage, POI } from '../../shared/schema';

export class SessionEnhancedPackageGenerator {
  constructor() {}
  
  async generatePackages(
    destination: string,
    duration: number,
    peopleCount: number,
    selectedTags: string[],
    freeTextPreferences: string[],
    conversationMessages: any[],
    sessionId?: string
  ): Promise<any[]> {
    // First, generate base packages using the global algorithm
    const basePackages = await generateEnhancedTravelPackages({
      destination,
      days: duration,
      people: peopleCount,
      theme: '',  // Theme is handled via tags/preferences
      selectedTags,
      freeTextPreferences
    });
    
    // If no session, return base packages
    if (!sessionId) {
      return basePackages;
    }
    
    // Get session preferences
    const sessionPrefs = sessionManager.getPreferences(sessionId);
    if (!sessionPrefs) {
      return basePackages;
    }
    
    console.log(`[SessionEnhancedPackageGenerator] Applying session personalization for ${sessionId}`);
    
    // Apply session-specific personalization to each package
    const personalizedPackages = await Promise.all(
      basePackages.map(async (pkg: any) => {
        const personalizedItinerary = await this.personalizeItinerary(
          pkg.itinerary,
          sessionId,
          destination
        );
        
        return {
          ...pkg,
          itinerary: personalizedItinerary
        };
      })
    );
    
    return personalizedPackages;
  }
  
  private async personalizeItinerary(
    itinerary: any[],
    sessionId: string,
    destination: string
  ): Promise<any[]> {
    const personalizedDays = await Promise.all(
      itinerary.map(async (day) => {
        const personalizedActivities = await this.personalizeActivities(
          day.activities,
          sessionId,
          destination,
          day.date
        );
        
        return {
          ...day,
          activities: personalizedActivities
        };
      })
    );
    
    return personalizedDays;
  }
  
  private async personalizeActivities(
    activities: any[],
    sessionId: string,
    destination: string,
    date: string
  ): Promise<any[]> {
    // Score all activities with session personalization
    const scoredActivities = activities.map(activity => {
      const baseScore = this.calculateBaseScore(activity);
      const sessionWeight = sessionManager.calculatePersonalizationWeights(sessionId, activity);
      const finalScore = baseScore * sessionWeight;
      
      return {
        activity,
        score: finalScore
      };
    });
    
    // Sort by personalized score
    scoredActivities.sort((a, b) => b.score - a.score);
    
    // Keep top activities based on personalized scoring
    const topActivities = scoredActivities.slice(0, 5).map(item => item.activity);
    
    // If session preferences suggest specific interests, try to add one more relevant POI
    const sessionPrefs = sessionManager.getPreferences(sessionId);
    if (sessionPrefs?.freeTextTags && sessionPrefs.freeTextTags.length > 0) {
      await this.tryAddSessionPreferredActivity(
        topActivities,
        sessionPrefs.freeTextTags,
        destination,
        sessionId
      );
    }
    
    return topActivities.slice(0, 5); // Ensure we don't exceed 5 activities
  }
  
  private calculateBaseScore(poi: any): number {
    // Calculate base score using global factors
    let score = 1.0;
    
    // Rating factor (40% weight)
    const rating = parseFloat(poi.rating || '0');
    score *= (0.6 + (rating / 5) * 0.4);
    
    // Review count factor (30% weight)
    const reviews = poi.userRatingsTotal || poi.user_ratings_total || 0;
    const reviewScore = Math.min(1, Math.log10(reviews + 1) / 4);
    score *= (0.7 + reviewScore * 0.3);
    
    // Must-see factor (30% weight)
    if (poi.types?.includes('tourist_attraction') || 
        poi.types?.includes('point_of_interest')) {
      score *= 1.3;
    }
    
    return score;
  }
  
  private async tryAddSessionPreferredActivity(
    activities: any[],
    freeTextTags: string[],
    destination: string,
    sessionId: string
  ): Promise<void> {
    // Try to find one activity highly relevant to session preferences
    for (const tag of freeTextTags) {
      try {
        const searchQuery = `${tag} in ${destination}`;
        const results = await searchPlaces(searchQuery, {
          minRating: 4.0,
          minReviews: 100
        });
        
        if (results.length > 0) {
          // Find the best match that's not already in activities
          for (const result of results) {
            const alreadyIncluded = activities.some(
              act => (act.placeId || act.place_id) === result.place_id
            );
            
            if (!alreadyIncluded) {
              // Calculate session-specific score
              const sessionWeight = sessionManager.calculatePersonalizationWeights(
                sessionId,
                result
              );
              
              if (sessionWeight >= 1.2) {
                // Strong match, replace the last activity
                // Convert GooglePlacesResult to POI format
                activities[activities.length - 1] = {
                  id: result.place_id,
                  placeId: result.place_id,
                  name: result.name,
                  rating: result.rating?.toString(),
                  userRatingsTotal: result.user_ratings_total,
                  priceLevel: result.price_level,
                  types: result.types,
                  address: result.address,
                  location: result.location,
                  photoRef: result.photo_ref,
                  openNow: result.open_now,
                  createdAt: new Date()
                };
                console.log(`[SessionEnhancedPackageGenerator] Added session-preferred POI: ${result.name}`);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error(`Failed to search for session preference "${tag}":`, error);
      }
    }
  }
}

export const sessionEnhancedPackageGenerator = new SessionEnhancedPackageGenerator();