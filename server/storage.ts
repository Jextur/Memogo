import { type User, type InsertUser, type Conversation, type InsertConversation, type TravelPackage, type InsertTravelPackage, type POI, type InsertPOI } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  getConversationsByUser(userId: string): Promise<Conversation[]>;

  // Travel package operations
  getTravelPackage(id: string): Promise<TravelPackage | undefined>;
  createTravelPackage(pkg: InsertTravelPackage): Promise<TravelPackage>;
  updateTravelPackage(id: string, updates: Partial<TravelPackage>): Promise<TravelPackage | undefined>;
  getTravelPackagesByConversation(conversationId: string): Promise<TravelPackage[]>;

  // POI operations
  getPOI(id: string): Promise<POI | undefined>;
  getPOIByPlaceId(placeId: string): Promise<POI | undefined>;
  createPOI(poi: InsertPOI): Promise<POI>;
  updatePOI(id: string, updates: Partial<POI>): Promise<POI | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private travelPackages: Map<string, TravelPackage>;
  private pois: Map<string, POI>;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.travelPackages = new Map();
    this.pois = new Map();
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Conversation operations
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = randomUUID();
    const conversation: Conversation = {
      id,
      userId: insertConversation.userId || null,
      destination: insertConversation.destination || null,
      days: insertConversation.days || null,
      people: insertConversation.people || null,
      theme: insertConversation.theme || null,
      status: insertConversation.status || "active",
      messages: insertConversation.messages || [],
      refinementCount: insertConversation.refinementCount || 0,
      createdAt: new Date(),
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: string, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates };
    this.conversations.set(id, updated);
    return updated;
  }

  async getConversationsByUser(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values()).filter(
      (conv) => conv.userId === userId
    );
  }

  // Travel package operations
  async getTravelPackage(id: string): Promise<TravelPackage | undefined> {
    return this.travelPackages.get(id);
  }

  async createTravelPackage(insertPackage: InsertTravelPackage): Promise<TravelPackage> {
    const id = randomUUID();
    const travelPackage: TravelPackage = {
      id,
      conversationId: insertPackage.conversationId || null,
      name: insertPackage.name,
      type: insertPackage.type,
      destination: insertPackage.destination,
      days: insertPackage.days,
      budget: insertPackage.budget,
      description: insertPackage.description || null,
      route: insertPackage.route || null,
      accommodation: insertPackage.accommodation || null,
      diningCount: insertPackage.diningCount || null,
      attractionCount: insertPackage.attractionCount || null,
      highlights: insertPackage.highlights || [],
      itinerary: insertPackage.itinerary || [],
      createdAt: new Date(),
    };
    this.travelPackages.set(id, travelPackage);
    return travelPackage;
  }

  async updateTravelPackage(id: string, updates: Partial<TravelPackage>): Promise<TravelPackage | undefined> {
    const travelPackage = this.travelPackages.get(id);
    if (!travelPackage) return undefined;
    
    const updated = { ...travelPackage, ...updates };
    this.travelPackages.set(id, updated);
    return updated;
  }

  async getTravelPackagesByConversation(conversationId: string): Promise<TravelPackage[]> {
    return Array.from(this.travelPackages.values()).filter(
      (pkg) => pkg.conversationId === conversationId
    );
  }

  // POI operations
  async getPOI(id: string): Promise<POI | undefined> {
    return this.pois.get(id);
  }

  async getPOIByPlaceId(placeId: string): Promise<POI | undefined> {
    return Array.from(this.pois.values()).find(
      (poi) => poi.placeId === placeId
    );
  }

  async createPOI(insertPOI: InsertPOI): Promise<POI> {
    const id = randomUUID();
    const poi: POI = {
      id,
      placeId: insertPOI.placeId,
      name: insertPOI.name,
      rating: insertPOI.rating || null,
      userRatingsTotal: insertPOI.userRatingsTotal || null,
      priceLevel: insertPOI.priceLevel || null,
      types: insertPOI.types || [],
      address: insertPOI.address || null,
      location: insertPOI.location || null,
      photoRef: insertPOI.photoRef || null,
      openNow: insertPOI.openNow || null,
      createdAt: new Date(),
    };
    this.pois.set(id, poi);
    return poi;
  }

  async updatePOI(id: string, updates: Partial<POI>): Promise<POI | undefined> {
    const poi = this.pois.get(id);
    if (!poi) return undefined;
    
    const updated = { ...poi, ...updates };
    this.pois.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
