import { Router } from 'express';
import { cityService } from '../services/cityService';
import { placesEnrichmentService } from '../services/placesEnrichment';
import { z } from 'zod';

const router = Router();

// Get cities by country
router.get('/cities/country/:countryCode', async (req, res) => {
  try {
    const { countryCode } = req.params;
    const cities = await cityService.getCitiesByCountry(countryCode);
    res.json(cities);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
});

// Get curated cities (our recommendations)
router.get('/cities/curated', async (req, res) => {
  try {
    const { country } = req.query;
    const cities = await cityService.getCuratedCities(country as string);
    res.json(cities);
  } catch (error) {
    console.error('Error fetching curated cities:', error);
    res.status(500).json({ error: 'Failed to fetch curated cities' });
  }
});

// Autocomplete cities
router.get('/cities/autocomplete', async (req, res) => {
  try {
    const { q, country } = req.query;
    
    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }
    
    // Try Google Places autocomplete if available
    const predictions = await placesEnrichmentService.autocompleteCities(q, country as string);
    
    // Also search our database
    const dbCities = await cityService.searchCities(q, country as string);
    
    // Combine results (Google predictions + DB results)
    const results = {
      predictions,
      cities: dbCities
    };
    
    res.json(results);
  } catch (error) {
    console.error('Error in city autocomplete:', error);
    res.status(500).json({ error: 'Failed to autocomplete cities' });
  }
});

// Validate and add a city
router.post('/cities/validate', async (req, res) => {
  try {
    const schema = z.object({
      cityName: z.string(),
      countryCode: z.string().optional()
    });
    
    const { cityName, countryCode } = schema.parse(req.body);
    
    // First check if we already have this city
    let city = await cityService.findCity(cityName, countryCode);
    
    if (!city) {
      // Try to enrich from Google Places
      const enrichedCity = await placesEnrichmentService.validateAndEnrichCity(cityName, countryCode);
      
      if (enrichedCity) {
        city = await cityService.upsertCity(enrichedCity);
      } else {
        return res.status(404).json({ error: 'City not found or could not be validated' });
      }
    }
    
    // Increment popularity when a city is selected
    if (city) {
      await cityService.incrementPopularity(city.id);
    }
    
    res.json(city);
  } catch (error) {
    console.error('Error validating city:', error);
    res.status(500).json({ error: 'Failed to validate city' });
  }
});

// Seed curated cities (admin endpoint)
router.post('/cities/seed', async (req, res) => {
  try {
    await placesEnrichmentService.seedCuratedCities();
    res.json({ message: 'Curated cities seeded successfully' });
  } catch (error) {
    console.error('Error seeding cities:', error);
    res.status(500).json({ error: 'Failed to seed cities' });
  }
});

export default router;