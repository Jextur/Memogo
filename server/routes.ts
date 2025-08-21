import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { continueConversation, generateTravelPackages, refineItinerary } from "./services/openai";
import { searchPlaces, getPlaceDetails, getPhotoUrl } from "./services/googlePlaces";
import { insertConversationSchema, insertTravelPackageSchema } from "@shared/schema";
import { randomUUID } from "crypto";
import cityRoutes from "./routes/cities";

export async function registerRoutes(app: Express): Promise<Server> {
  // Register city routes
  app.use('/api/cities', cityRoutes);
  
  // Conversation endpoints
  app.post("/api/conversation", async (req, res) => {
    try {
      const { userId, destination, days, people, theme } = req.body;
      
      const conversationId = randomUUID();
      const conversation = await storage.createConversation({
        conversationId,
        userId,
        destination,
        days,
        people,
        theme,
        messages: [],
        status: "active",
        refinementCount: 0,
      });
      
      res.json(conversation);
    } catch (error) {
      console.error("Create conversation error:", error);
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.post("/api/conversation/:id/message", async (req, res) => {
    try {
      const { id } = req.params;
      const { message } = req.body;
      
      // Try to get conversation by conversationId first, then fall back to id
      let conversation = await storage.getConversation(id);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      // Add user message
      const userMessage = {
        id: randomUUID(),
        role: "user" as const,
        content: message,
        timestamp: new Date(),
      };
      
      const messages = [...(conversation.messages as any[]), userMessage];
      
      // Get AI response
      const context = {
        destination: conversation.destination || undefined,
        days: conversation.days || undefined,
        people: conversation.people || undefined,
        theme: conversation.theme || undefined,
        messages: messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) })),
      };
      
      const aiResponse = await continueConversation(context);
      
      // Add AI message
      const aiMessage = {
        id: randomUUID(),
        role: "assistant" as const,
        content: aiResponse.response,
        timestamp: new Date(),
        options: aiResponse.options,
      };
      
      const updatedMessages = [...messages, aiMessage];
      
      // Update conversation with extracted info
      // Parse selected tags from theme field if it contains "I'm interested in:"
      let selectedTags = conversation.selectedTags || [];
      if (aiResponse.extractedInfo?.theme && aiResponse.extractedInfo.theme.includes("I'm interested in:")) {
        const tagString = aiResponse.extractedInfo.theme.replace("I'm interested in:", "").trim();
        selectedTags = tagString.split(',').map(tag => tag.trim());
      }
      
      const updatedConversation = await storage.updateConversation(id, {
        messages: updatedMessages,
        destination: aiResponse.extractedInfo?.destination || conversation.destination,
        days: aiResponse.extractedInfo?.days || conversation.days,
        people: aiResponse.extractedInfo?.people || conversation.people,
        theme: aiResponse.extractedInfo?.theme || conversation.theme,
        selectedTags: selectedTags.length > 0 ? selectedTags : conversation.selectedTags,
      });
      
      res.json({
        conversation: updatedConversation,
        aiResponse: aiMessage,
        nextStep: aiResponse.nextStep,
      });
    } catch (error) {
      console.error("Message error:", error);
      res.status(500).json({ error: "Failed to process message" });
    }
  });

  app.get("/api/conversation/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Get conversation error:", error);
      res.status(500).json({ error: "Failed to get conversation" });
    }
  });

  // Package generation
  app.post("/api/conversation/:id/generate-packages", async (req, res) => {
    try {
      const { id } = req.params;
      const conversation = await storage.getConversation(id);
      
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      if (!conversation.destination || !conversation.days || !conversation.theme) {
        return res.status(400).json({ error: "Missing required conversation data" });
      }
      
      // Use enhanced package generator if tags are selected
      const { generateEnhancedTravelPackages } = await import('./services/enhancedPackageGenerator');
      
      const packages = await generateEnhancedTravelPackages({
        destination: conversation.destination,
        days: conversation.days,
        people: conversation.people || 1,
        theme: conversation.theme,
        selectedTags: conversation.selectedTags || []
      });
      
      // Save packages to storage
      const savedPackages = await Promise.all(
        packages.map(pkg => storage.createTravelPackage({
          conversationId: id,
          name: pkg.name,
          type: pkg.type,
          packageName: pkg.name,
          packageType: pkg.type,
          destination: conversation.destination!,
          days: conversation.days!,
          budget: pkg.budget,
          description: pkg.description,
          route: pkg.route,
          accommodation: pkg.accommodation,
          diningCount: pkg.diningCount,
          attractionCount: pkg.attractionCount,
          highlights: pkg.highlights,
          itinerary: pkg.itinerary,
        }))
      );
      
      // Update conversation status
      await storage.updateConversation(id, { status: "completed" });
      
      res.json({ packages: savedPackages });
    } catch (error) {
      console.error("Generate packages error:", error);
      res.status(500).json({ error: "Failed to generate packages" });
    }
  });

  // Package endpoints
  app.get("/api/packages/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const travelPackage = await storage.getTravelPackage(id);
      
      if (!travelPackage) {
        return res.status(404).json({ error: "Package not found" });
      }
      
      res.json(travelPackage);
    } catch (error) {
      console.error("Get package error:", error);
      res.status(500).json({ error: "Failed to get package" });
    }
  });

  app.get("/api/conversation/:id/packages", async (req, res) => {
    try {
      const { id } = req.params;
      const packages = await storage.getTravelPackagesByConversation(id);
      res.json(packages);
    } catch (error) {
      console.error("Get packages error:", error);
      res.status(500).json({ error: "Failed to get packages" });
    }
  });

  // Refinement endpoint
  app.post("/api/packages/:id/refine", async (req, res) => {
    try {
      const { id } = req.params;
      const { refinementRequest } = req.body;
      
      const travelPackage = await storage.getTravelPackage(id);
      if (!travelPackage) {
        return res.status(404).json({ error: "Package not found" });
      }
      
      const conversation = await storage.getConversation(travelPackage.conversationId!);
      if (!conversation) {
        return res.status(404).json({ error: "Conversation not found" });
      }
      
      if ((conversation.refinementCount || 0) >= 3) {
        return res.status(400).json({ error: "Maximum refinements reached" });
      }
      
      const refinedItinerary = await refineItinerary(
        travelPackage.itinerary,
        refinementRequest,
        {
          destination: travelPackage.destination,
          days: travelPackage.days,
          theme: conversation.theme || "general",
        }
      );
      
      // Update package
      const updatedPackage = await storage.updateTravelPackage(id, {
        itinerary: refinedItinerary,
      });
      
      // Increment refinement count
      await storage.updateConversation(travelPackage.conversationId!, {
        refinementCount: (conversation.refinementCount || 0) + 1,
      });
      
      res.json(updatedPackage);
    } catch (error) {
      console.error("Refine package error:", error);
      res.status(500).json({ error: "Failed to refine package" });
    }
  });

  // Google Places endpoints
  app.get("/api/places/search", async (req, res) => {
    try {
      const { query, theme, minRating, minReviews } = req.query;
      
      if (!query || typeof query !== "string") {
        return res.status(400).json({ error: "Query parameter required" });
      }
      
      // Apply quality filters
      const filters = {
        minRating: minRating ? parseFloat(minRating as string) : 4.2,
        minReviews: minReviews ? parseInt(minReviews as string) : 500,
        theme: theme as string | undefined
      };
      
      // Add theme-specific types
      const relevantTypes: Record<string, string[]> = {
        'foodie': ['restaurant', 'cafe', 'bakery', 'food'],
        'culture': ['museum', 'art_gallery', 'tourist_attraction', 'point_of_interest'],
        'adventure': ['park', 'tourist_attraction', 'natural_feature']
      };
      
      if (theme && typeof theme === 'string' && relevantTypes[theme]) {
        (filters as any).relevantTypes = relevantTypes[theme];
      }
      
      const results = await searchPlaces(query, filters);
      
      // Save POIs to storage with descriptions
      await Promise.all(
        results.map(async (place) => {
          const existingPOI = await storage.getPOIByPlaceId(place.place_id);
          if (!existingPOI) {
            await storage.createPOI({
              placeId: place.place_id,
              name: place.name,
              rating: place.rating ? place.rating.toString() : undefined,
              userRatingsTotal: place.user_ratings_total,
              priceLevel: place.price_level,
              types: place.types || [],
              address: place.address,
              location: place.location,
              photoRef: place.photo_ref,
              openNow: place.open_now,
            });
          }
        })
      );
      
      res.json({ results });
    } catch (error) {
      console.error("Places search error:", error);
      res.status(500).json({ error: "Failed to search places" });
    }
  });

  app.get("/api/places/details/:placeId", async (req, res) => {
    try {
      const { placeId } = req.params;
      const details = await getPlaceDetails(placeId);
      
      if (!details) {
        return res.status(404).json({ error: "Place not found" });
      }
      
      res.json({ result: details });
    } catch (error) {
      console.error("Place details error:", error);
      res.status(500).json({ error: "Failed to get place details" });
    }
  });

  app.get("/api/places/photo", async (req, res) => {
    try {
      const { ref, maxwidth = "400" } = req.query;
      
      if (!ref || typeof ref !== "string") {
        return res.status(400).json({ error: "Photo reference required" });
      }
      
      const photoUrl = getPhotoUrl(ref, parseInt(maxwidth as string));
      res.redirect(photoUrl);
    } catch (error) {
      console.error("Photo URL error:", error);
      res.status(500).json({ error: "Failed to get photo" });
    }
  });

  // Get enhanced city-specific tags with normalization
  app.get('/api/cities/tags/:cityName/:countryCode', async (req, res) => {
    try {
      const { cityName, countryCode } = req.params;
      
      // Get city from storage
      const city = await storage.getCityByName(cityName, countryCode);
      
      if (city) {
        // Get tags from enhanced storage
        const tags = await storage.getCityTags(city.id);
        
        res.json({
          tags: tags.map(t => t.label),
          isDefault: false,
          cityId: city.id,
          enhanced: tags.map(t => ({
            id: t.id,
            label: t.label,
            category: t.metadata?.category,
            score: t.score,
            usageCount: t.usageCount
          }))
        });
      } else {
        // For now, fall back to the old system for unsupported cities
        const { getCityTags, getDefaultTags } = await import('./data/cityTags');
        const tags = getCityTags(cityName, countryCode);
        
        if (tags.length === 0) {
          res.json({ tags: getDefaultTags(), isDefault: true });
        } else {
          res.json({ tags, isDefault: false });
        }
      }
    } catch (error) {
      console.error('Error getting city tags:', error);
      res.status(500).json({ error: 'Failed to get city tags' });
    }
  });

  // Export endpoint
  app.get("/api/packages/:id/export", async (req, res) => {
    try {
      const { id } = req.params;
      const travelPackage = await storage.getTravelPackage(id);
      
      if (!travelPackage) {
        return res.status(404).json({ error: "Package not found" });
      }
      
      const exportData = {
        package_name: travelPackage.name,
        destination: travelPackage.destination,
        duration: travelPackage.days,
        budget: travelPackage.budget,
        type: travelPackage.type,
        description: travelPackage.description,
        route: travelPackage.route,
        accommodation: travelPackage.accommodation,
        dining_experiences: travelPackage.diningCount,
        attractions: travelPackage.attractionCount,
        highlights: travelPackage.highlights,
        itinerary: travelPackage.itinerary,
        generated_at: new Date().toISOString(),
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=travel_package_${travelPackage.name.replace(/\s+/g, '_')}.json`);
      res.json(exportData);
    } catch (error) {
      console.error("Export error:", error);
      res.status(500).json({ error: "Failed to export package" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
