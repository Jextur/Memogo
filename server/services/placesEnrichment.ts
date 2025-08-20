import { cityService } from './cityService';
import type { InsertCity } from '@shared/schema';

// Google Places API integration for city enrichment
export class PlacesEnrichmentService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY || '';
    if (!this.apiKey) {
      console.warn('GOOGLE_PLACES_API_KEY not set - Places enrichment will be limited');
    }
  }

  // Get place details from Google Places API
  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.apiKey) {
      throw new Error('Google Places API key not configured');
    }

    // Check cache first
    const cacheKey = `place_details:${placeId}`;
    const cached = await cityService.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/details/json`;
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'name,formatted_address,geometry,types,photos,address_components,utc_offset_minutes',
        key: this.apiKey
      });

      const response = await fetch(`${url}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result) {
        // Cache the response for 24 hours
        await cityService.cacheResponse(cacheKey, data.result, 86400);
        return data.result;
      } else {
        console.error('Place details error:', data.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      return null;
    }
  }

  // Autocomplete for city search
  async autocompleteCities(input: string, countryCode?: string): Promise<any[]> {
    if (!this.apiKey) {
      // Fallback to database search if no API key
      return await cityService.searchCities(input, countryCode);
    }

    // Check cache first
    const cacheKey = `autocomplete:${input}:${countryCode || 'all'}`;
    const cached = await cityService.getCachedResponse(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const url = `${this.baseUrl}/autocomplete/json`;
      const params: any = {
        input,
        types: '(cities)',
        key: this.apiKey
      };

      // Add country restriction if provided
      if (countryCode) {
        params.components = `country:${countryCode.toLowerCase()}`;
      }

      const response = await fetch(`${url}?${new URLSearchParams(params)}`);
      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        // Cache for 1 hour
        await cityService.cacheResponse(cacheKey, data.predictions, 3600);
        return data.predictions;
      } else {
        console.error('Autocomplete error:', data.status);
        return [];
      }
    } catch (error) {
      console.error('Error in autocomplete:', error);
      return [];
    }
  }

  // Convert Google Place to our City format
  async enrichCityFromPlace(placeId: string, isCurated: boolean = false): Promise<InsertCity | null> {
    const details = await this.getPlaceDetails(placeId);
    if (!details) {
      return null;
    }

    // Extract country code and admin level from address components
    let countryCode = '';
    let countryName = '';
    let adminLevel1 = '';

    for (const component of details.address_components || []) {
      if (component.types.includes('country')) {
        countryCode = component.short_name;
        countryName = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        adminLevel1 = component.long_name;
      }
    }

    if (!countryCode) {
      console.error('Could not extract country code from place details');
      return null;
    }

    const cityData: InsertCity = {
      googlePlaceId: placeId,
      cityName: details.name,
      countryCode,
      countryName,
      adminLevel1,
      latitude: details.geometry.location.lat.toString(),
      longitude: details.geometry.location.lng.toString(),
      isCurated,
      metadata: {
        formattedAddress: details.formatted_address,
        types: details.types,
        photoReferences: details.photos?.map((p: any) => p.photo_reference) || [],
        timezone: details.utc_offset_minutes ? `UTC${details.utc_offset_minutes >= 0 ? '+' : ''}${Math.floor(details.utc_offset_minutes / 60)}` : undefined
      },
      lastValidated: new Date()
    };

    return cityData;
  }

  // Validate and enrich a city by name
  async validateAndEnrichCity(cityName: string, countryCode?: string): Promise<InsertCity | null> {
    // First, try autocomplete to get the place ID
    const predictions = await this.autocompleteCities(cityName, countryCode);
    
    if (predictions.length > 0) {
      // Use the first prediction (most relevant)
      const placeId = predictions[0].place_id;
      return await this.enrichCityFromPlace(placeId);
    }

    return null;
  }

  // Seed database with curated cities
  async seedCuratedCities(): Promise<void> {
    console.log('Seeding curated cities...');
    
    // Import curated cities from cityService
    const { curatedCities } = await import('./cityService');
    
    for (const city of curatedCities) {
      try {
        // Try to get Google Place ID for each curated city
        const enrichedCity = await this.validateAndEnrichCity(city.cityName, city.countryCode);
        
        if (enrichedCity) {
          // Merge curated data with Google data
          const finalCity: InsertCity = {
            ...enrichedCity,
            isCurated: true,
            popularity: city.popularity || 0
          };
          
          await cityService.upsertCity(finalCity);
          console.log(`✓ Seeded ${city.cityName}, ${city.countryName}`);
        } else {
          console.warn(`✗ Could not enrich ${city.cityName}, ${city.countryName} - will add without Google Place ID`);
          
          // Add without Google Place ID as fallback
          const fallbackCity: InsertCity = {
            googlePlaceId: `manual_${city.countryCode}_${city.cityName.toLowerCase().replace(/\s+/g, '_')}`,
            cityName: city.cityName,
            countryCode: city.countryCode,
            countryName: city.countryName,
            adminLevel1: city.adminLevel1 || '',
            latitude: '0',
            longitude: '0',
            isCurated: true,
            popularity: city.popularity || 0,
            metadata: {}
          };
          
          await cityService.upsertCity(fallbackCity);
        }
      } catch (error) {
        console.error(`Error seeding ${city.cityName}:`, error);
      }
    }
    
    console.log('Curated cities seeding complete!');
  }
}

export const placesEnrichmentService = new PlacesEnrichmentService();