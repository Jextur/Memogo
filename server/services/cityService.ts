import { db } from '../db';
import { cities, placesCache, type City, type InsertCity } from '@shared/schema';
import { eq, and, desc, inArray, sql, gte } from 'drizzle-orm';

// Curated cities data - our foundation database
export const curatedCities: Omit<InsertCity, 'googlePlaceId' | 'latitude' | 'longitude'>[] = [
  // Japan
  { cityName: 'Tokyo', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Tokyo', isCurated: true, popularity: 100 },
  { cityName: 'Kyoto', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Kyoto', isCurated: true, popularity: 95 },
  { cityName: 'Osaka', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Osaka', isCurated: true, popularity: 90 },
  { cityName: 'Okinawa', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Okinawa', isCurated: true, popularity: 85 },
  { cityName: 'Sapporo', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Hokkaido', isCurated: true, popularity: 80 },
  { cityName: 'Fukuoka', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Fukuoka', isCurated: true, popularity: 75 },
  { cityName: 'Yokohama', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Kanagawa', isCurated: true, popularity: 70 },
  { cityName: 'Nagoya', countryCode: 'JP', countryName: 'Japan', adminLevel1: 'Aichi', isCurated: true, popularity: 65 },
  
  // USA
  { cityName: 'New York', countryCode: 'US', countryName: 'United States', adminLevel1: 'New York', isCurated: true, popularity: 100 },
  { cityName: 'Los Angeles', countryCode: 'US', countryName: 'United States', adminLevel1: 'California', isCurated: true, popularity: 95 },
  { cityName: 'San Francisco', countryCode: 'US', countryName: 'United States', adminLevel1: 'California', isCurated: true, popularity: 90 },
  { cityName: 'Miami', countryCode: 'US', countryName: 'United States', adminLevel1: 'Florida', isCurated: true, popularity: 85 },
  { cityName: 'Las Vegas', countryCode: 'US', countryName: 'United States', adminLevel1: 'Nevada', isCurated: true, popularity: 85 },
  { cityName: 'Chicago', countryCode: 'US', countryName: 'United States', adminLevel1: 'Illinois', isCurated: true, popularity: 80 },
  { cityName: 'Dallas', countryCode: 'US', countryName: 'United States', adminLevel1: 'Texas', isCurated: true, popularity: 75 },
  { cityName: 'Seattle', countryCode: 'US', countryName: 'United States', adminLevel1: 'Washington', isCurated: true, popularity: 75 },
  
  // France
  { cityName: 'Paris', countryCode: 'FR', countryName: 'France', adminLevel1: 'Île-de-France', isCurated: true, popularity: 100 },
  { cityName: 'Nice', countryCode: 'FR', countryName: 'France', adminLevel1: 'Provence-Alpes-Côte d\'Azur', isCurated: true, popularity: 85 },
  { cityName: 'Lyon', countryCode: 'FR', countryName: 'France', adminLevel1: 'Auvergne-Rhône-Alpes', isCurated: true, popularity: 75 },
  { cityName: 'Marseille', countryCode: 'FR', countryName: 'France', adminLevel1: 'Provence-Alpes-Côte d\'Azur', isCurated: true, popularity: 70 },
  { cityName: 'Bordeaux', countryCode: 'FR', countryName: 'France', adminLevel1: 'Nouvelle-Aquitaine', isCurated: true, popularity: 65 },
  { cityName: 'Strasbourg', countryCode: 'FR', countryName: 'France', adminLevel1: 'Grand Est', isCurated: true, popularity: 60 },
  
  // Italy
  { cityName: 'Rome', countryCode: 'IT', countryName: 'Italy', adminLevel1: 'Lazio', isCurated: true, popularity: 100 },
  { cityName: 'Venice', countryCode: 'IT', countryName: 'Italy', adminLevel1: 'Veneto', isCurated: true, popularity: 95 },
  { cityName: 'Florence', countryCode: 'IT', countryName: 'Italy', adminLevel1: 'Tuscany', isCurated: true, popularity: 90 },
  { cityName: 'Milan', countryCode: 'IT', countryName: 'Italy', adminLevel1: 'Lombardy', isCurated: true, popularity: 85 },
  { cityName: 'Naples', countryCode: 'IT', countryName: 'Italy', adminLevel1: 'Campania', isCurated: true, popularity: 75 },
  { cityName: 'Venice', countryCode: 'IT', countryName: 'Italy', adminLevel1: 'Veneto', isCurated: true, popularity: 70 },
  
  // Spain
  { cityName: 'Barcelona', countryCode: 'ES', countryName: 'Spain', adminLevel1: 'Catalonia', isCurated: true, popularity: 100 },
  { cityName: 'Madrid', countryCode: 'ES', countryName: 'Spain', adminLevel1: 'Madrid', isCurated: true, popularity: 95 },
  { cityName: 'Seville', countryCode: 'ES', countryName: 'Spain', adminLevel1: 'Andalusia', isCurated: true, popularity: 85 },
  { cityName: 'Valencia', countryCode: 'ES', countryName: 'Spain', adminLevel1: 'Valencia', isCurated: true, popularity: 75 },
  { cityName: 'Granada', countryCode: 'ES', countryName: 'Spain', adminLevel1: 'Andalusia', isCurated: true, popularity: 70 },
  { cityName: 'Malaga', countryCode: 'ES', countryName: 'Spain', adminLevel1: 'Andalusia', isCurated: true, popularity: 65 },
  
  // United Kingdom
  { cityName: 'London', countryCode: 'GB', countryName: 'United Kingdom', adminLevel1: 'England', isCurated: true, popularity: 100 },
  { cityName: 'Edinburgh', countryCode: 'GB', countryName: 'United Kingdom', adminLevel1: 'Scotland', isCurated: true, popularity: 85 },
  { cityName: 'Manchester', countryCode: 'GB', countryName: 'United Kingdom', adminLevel1: 'England', isCurated: true, popularity: 75 },
  { cityName: 'Liverpool', countryCode: 'GB', countryName: 'United Kingdom', adminLevel1: 'England', isCurated: true, popularity: 70 },
  { cityName: 'Cambridge', countryCode: 'GB', countryName: 'United Kingdom', adminLevel1: 'England', isCurated: true, popularity: 65 },
  { cityName: 'Oxford', countryCode: 'GB', countryName: 'United Kingdom', adminLevel1: 'England', isCurated: true, popularity: 65 },
  
  // Thailand
  { cityName: 'Bangkok', countryCode: 'TH', countryName: 'Thailand', adminLevel1: 'Bangkok', isCurated: true, popularity: 100 },
  { cityName: 'Phuket', countryCode: 'TH', countryName: 'Thailand', adminLevel1: 'Phuket', isCurated: true, popularity: 90 },
  { cityName: 'Chiang Mai', countryCode: 'TH', countryName: 'Thailand', adminLevel1: 'Chiang Mai', isCurated: true, popularity: 85 },
  { cityName: 'Pattaya', countryCode: 'TH', countryName: 'Thailand', adminLevel1: 'Chonburi', isCurated: true, popularity: 75 },
  { cityName: 'Krabi', countryCode: 'TH', countryName: 'Thailand', adminLevel1: 'Krabi', isCurated: true, popularity: 70 },
  { cityName: 'Koh Samui', countryCode: 'TH', countryName: 'Thailand', adminLevel1: 'Surat Thani', isCurated: true, popularity: 65 },
];

export class CityService {
  // Get cities by country code
  async getCitiesByCountry(countryCode: string): Promise<City[]> {
    return await db
      .select()
      .from(cities)
      .where(eq(cities.countryCode, countryCode.toUpperCase()))
      .orderBy(desc(cities.popularity), cities.cityName);
  }

  // Get curated cities (our recommendations)
  async getCuratedCities(countryCode?: string): Promise<City[]> {
    const conditions = [eq(cities.isCurated, true)];
    if (countryCode) {
      conditions.push(eq(cities.countryCode, countryCode.toUpperCase()));
    }
    
    return await db
      .select()
      .from(cities)
      .where(and(...conditions))
      .orderBy(desc(cities.popularity), cities.cityName);
  }

  // Find city by name and country
  async findCity(cityName: string, countryCode?: string): Promise<City | null> {
    const conditions = [eq(cities.cityName, cityName)];
    if (countryCode) {
      conditions.push(eq(cities.countryCode, countryCode.toUpperCase()));
    }
    
    const result = await db
      .select()
      .from(cities)
      .where(and(...conditions))
      .limit(1);
    
    return result[0] || null;
  }

  // Find city by Google Place ID
  async findCityByPlaceId(googlePlaceId: string): Promise<City | null> {
    const result = await db
      .select()
      .from(cities)
      .where(eq(cities.googlePlaceId, googlePlaceId))
      .limit(1);
    
    return result[0] || null;
  }

  // Upsert city (insert or update)
  async upsertCity(cityData: InsertCity): Promise<City> {
    const existing = await this.findCityByPlaceId(cityData.googlePlaceId);
    
    if (existing) {
      // Update existing city
      const updateData: any = {
        cityName: cityData.cityName,
        countryCode: cityData.countryCode,
        countryName: cityData.countryName,
        adminLevel1: cityData.adminLevel1,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        isCurated: cityData.isCurated,
        updatedAt: new Date()
      };
      
      if (cityData.popularity !== undefined) {
        updateData.popularity = cityData.popularity;
      }
      if (cityData.metadata !== undefined) {
        updateData.metadata = cityData.metadata;
      }
      if (cityData.lastValidated !== undefined) {
        updateData.lastValidated = cityData.lastValidated;
      }
      
      const [updated] = await db
        .update(cities)
        .set(updateData)
        .where(eq(cities.googlePlaceId, cityData.googlePlaceId))
        .returning();
      return updated;
    } else {
      // Insert new city
      const [inserted] = await db
        .insert(cities)
        .values([cityData])
        .returning();
      return inserted;
    }
  }

  // Cache Google Places API response
  async cacheResponse(cacheKey: string, data: any, ttlSeconds: number = 3600): Promise<void> {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
    
    // Delete old cache entry if exists
    await db.delete(placesCache).where(eq(placesCache.cacheKey, cacheKey));
    
    // Insert new cache entry
    await db.insert(placesCache).values({
      cacheKey,
      responseData: data,
      expiresAt
    });
  }

  // Get cached response
  async getCachedResponse(cacheKey: string): Promise<any | null> {
    const now = new Date();
    
    const result = await db
      .select()
      .from(placesCache)
      .where(and(
        eq(placesCache.cacheKey, cacheKey),
        gte(placesCache.expiresAt, now)
      ))
      .limit(1);
    
    if (result.length > 0) {
      return result[0].responseData;
    }
    
    return null;
  }

  // Clean expired cache entries
  async cleanExpiredCache(): Promise<void> {
    const now = new Date();
    await db.delete(placesCache).where(sql`${placesCache.expiresAt} < ${now}`);
  }

  // Search cities with fuzzy matching
  async searchCities(query: string, countryCode?: string): Promise<City[]> {
    const searchPattern = `%${query}%`;
    const conditions = [sql`${cities.cityName} ILIKE ${searchPattern}`];
    
    if (countryCode) {
      conditions.push(eq(cities.countryCode, countryCode.toUpperCase()));
    }
    
    return await db
      .select()
      .from(cities)
      .where(and(...conditions))
      .orderBy(desc(cities.popularity), cities.cityName)
      .limit(10);
  }

  // Increment city popularity (when selected by users)
  async incrementPopularity(cityId: number): Promise<void> {
    await db
      .update(cities)
      .set({
        popularity: sql`${cities.popularity} + 1`
      })
      .where(eq(cities.id, cityId));
  }
}

export const cityService = new CityService();