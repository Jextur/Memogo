import { 
  type User, type InsertUser, 
  type Conversation, type InsertConversation, 
  type TravelPackage, type InsertTravelPackage, 
  type POI, type InsertPOI,
  type CityTag, type InsertCityTag,
  type TagAlias, type InsertTagAlias,
  type City
} from "@shared/schema";
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

  // City operations
  getCityByName(cityName: string, countryCode: string): Promise<City | undefined>;
  
  // City tag operations
  getCityTags(cityId: number): Promise<CityTag[]>;
  getCityTag(id: number): Promise<CityTag | undefined>;
  createCityTag(tag: InsertCityTag): Promise<CityTag>;
  updateCityTag(id: number, updates: Partial<CityTag>): Promise<CityTag | undefined>;
  incrementTagUsage(tagId: number): Promise<void>;
  
  // Tag alias operations
  getTagAliasesByCityId(cityId: number): Promise<TagAlias[]>;
  getTagAliases(tagId: number): Promise<TagAlias[]>;
  createTagAlias(alias: InsertTagAlias): Promise<TagAlias>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private conversations: Map<string, Conversation>;
  private travelPackages: Map<string, TravelPackage>;
  private pois: Map<string, POI>;
  private cities: Map<number, City>;
  private cityTags: Map<number, CityTag>;
  private tagAliases: Map<number, TagAlias>;
  private cityTagCounter = 1000; // Start from 1000 for in-memory IDs

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.travelPackages = new Map();
    this.pois = new Map();
    this.cities = new Map();
    this.cityTags = new Map();
    this.tagAliases = new Map();
    
    // Initialize with some default cities for testing
    this.initializeDefaultCities();
  }
  
  private initializeDefaultCities() {
    // Add some default cities
    const cities = [
      // Japan cities
      {
        id: 1,
        googlePlaceId: 'ChIJ51cu8IcbXWARiRtXIothAS4',
        cityName: 'Tokyo',
        countryCode: 'JP',
        countryName: 'Japan',
        adminLevel1: 'Tokyo',
        latitude: '35.6762',
        longitude: '139.6503',
        isCurated: true,
        popularity: 100,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        googlePlaceId: 'ChIJ8S7pTtpwhlQRZmpW5qLvGEU',
        cityName: 'Kyoto',
        countryCode: 'JP',
        countryName: 'Japan',
        adminLevel1: 'Kyoto',
        latitude: '35.0116',
        longitude: '135.7681',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        googlePlaceId: 'ChIJoZ5KYnGJAGARKtGkqbh5oJg',
        cityName: 'Osaka',
        countryCode: 'JP',
        countryName: 'Japan',
        adminLevel1: 'Osaka',
        latitude: '34.6937',
        longitude: '135.5023',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // USA cities
      {
        id: 4,
        googlePlaceId: 'ChIJOwg_06VPwokRYv534QaPC8g',
        cityName: 'New York',
        countryCode: 'US',
        countryName: 'USA',
        adminLevel1: 'New York',
        latitude: '40.7128',
        longitude: '-74.0060',
        isCurated: true,
        popularity: 100,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        googlePlaceId: 'ChIJE9on3F3HwoAR9AhGJW_fL-I',
        cityName: 'Los Angeles',
        countryCode: 'US',
        countryName: 'USA',
        adminLevel1: 'California',
        latitude: '34.0522',
        longitude: '-118.2437',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        googlePlaceId: 'ChIJ0X31pIK3voARo3mz1ebVzDo',
        cityName: 'Las Vegas',
        countryCode: 'US',
        countryName: 'USA',
        adminLevel1: 'Nevada',
        latitude: '36.1699',
        longitude: '-115.1398',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 7,
        googlePlaceId: 'ChIJIQBpAG2ahYAR_6128GcTUEo',
        cityName: 'San Francisco',
        countryCode: 'US',
        countryName: 'USA',
        adminLevel1: 'California',
        latitude: '37.7749',
        longitude: '-122.4194',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        googlePlaceId: 'ChIJEWSIqIas3YcRcr1FI7ZWpFA',
        cityName: 'Miami',
        countryCode: 'US',
        countryName: 'USA',
        adminLevel1: 'Florida',
        latitude: '25.7617',
        longitude: '-80.1918',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    cities.forEach(city => {
      this.cities.set(city.id, city as City);
    });
    
    // Initialize default tags for Tokyo
    this.initializeDefaultTags();
  }
  
  private initializeDefaultTags() {
    const cityTagsData = [
      // Tokyo tags
      {
        cityId: 1,
        tags: [
          { label: 'Tokyo Disneyland', aliases: ['TDL', '東京ディズニーランド', 'disney'], category: 'attraction' },
          { label: 'Tokyo Tower', aliases: ['東京タワー'], category: 'attraction' },
          { label: 'Akihabara', aliases: ['Akiba', '秋葉原', 'akihabra'], category: 'district' },
          { label: 'Tsukiji Market', aliases: ['築地市場', 'Tsukiji', '築地'], category: 'experience' },
          { label: 'Shibuya Crossing', aliases: ['渋谷スクランブル交差点', 'shibuya'], category: 'attraction' },
          { label: 'Senso-ji Temple', aliases: ['浅草寺', 'Sensoji', 'sensouji'], category: 'attraction' },
          { label: 'TeamLab Planets', aliases: ['チームラボプラネッツ', 'Team Lab', 'teamlab'], category: 'experience' },
          { label: 'Shinjuku', aliases: ['新宿'], category: 'district' },
          { label: 'Harajuku', aliases: ['原宿'], category: 'district' },
          { label: 'Roppongi', aliases: ['六本木'], category: 'district' }
        ]
      },
      // Kyoto tags
      {
        cityId: 2,
        tags: [
          { label: 'Fushimi Inari', aliases: ['伏見稲荷', 'fushimi-inari'], category: 'attraction' },
          { label: 'Golden Pavilion', aliases: ['金閣寺', 'Kinkaku-ji'], category: 'attraction' },
          { label: 'Bamboo Forest', aliases: ['竹林', 'Arashiyama'], category: 'experience' },
          { label: 'Gion District', aliases: ['祇園'], category: 'district' },
          { label: 'Kiyomizu Temple', aliases: ['清水寺'], category: 'attraction' }
        ]
      },
      // Osaka tags
      {
        cityId: 3,
        tags: [
          { label: 'Osaka Castle', aliases: ['大阪城'], category: 'attraction' },
          { label: 'Dotonbori', aliases: ['道頓堀'], category: 'district' },
          { label: 'Universal Studios Japan', aliases: ['USJ', 'ユニバーサル'], category: 'attraction' },
          { label: 'Shinsekai', aliases: ['新世界'], category: 'district' },
          { label: 'Namba', aliases: ['難波'], category: 'district' }
        ]
      },
      // New York tags
      {
        cityId: 4,
        tags: [
          { label: 'Times Square', aliases: ['time square'], category: 'attraction' },
          { label: 'Central Park', aliases: ['central prk'], category: 'attraction' },
          { label: 'Statue of Liberty', aliases: ['lady liberty', 'liberty statue'], category: 'attraction' },
          { label: 'Empire State Building', aliases: ['empire state'], category: 'attraction' },
          { label: 'Brooklyn Bridge', aliases: ['brooklyn'], category: 'attraction' },
          { label: 'Metropolitan Museum', aliases: ['The Met', 'met museum'], category: 'experience' },
          { label: 'Broadway', aliases: ['broadway shows'], category: 'experience' },
          { label: 'Wall Street', aliases: ['financial district'], category: 'district' },
          { label: '9/11 Memorial', aliases: ['ground zero', 'world trade center'], category: 'attraction' },
          { label: 'High Line', aliases: ['highline park'], category: 'experience' }
        ]
      },
      // Los Angeles tags
      {
        cityId: 5,
        tags: [
          { label: 'Hollywood', aliases: ['hollywood sign', 'hollywood hills'], category: 'district' },
          { label: 'Universal Studios', aliases: ['universal'], category: 'attraction' },
          { label: 'Santa Monica Pier', aliases: ['santa monica beach'], category: 'attraction' },
          { label: 'Beverly Hills', aliases: ['rodeo drive'], category: 'district' },
          { label: 'Griffith Observatory', aliases: ['griffith park'], category: 'attraction' },
          { label: 'Venice Beach', aliases: ['venice'], category: 'attraction' },
          { label: 'Disneyland', aliases: ['disney'], category: 'attraction' },
          { label: 'Getty Center', aliases: ['getty museum'], category: 'experience' },
          { label: 'Malibu', aliases: ['malibu beach'], category: 'district' },
          { label: 'Walk of Fame', aliases: ['hollywood walk'], category: 'attraction' }
        ]
      },
      // Las Vegas tags
      {
        cityId: 6,
        tags: [
          { label: 'The Strip', aliases: ['las vegas strip', 'vegas strip'], category: 'district' },
          { label: 'Bellagio Fountains', aliases: ['bellagio'], category: 'attraction' },
          { label: 'Fremont Street', aliases: ['fremont'], category: 'district' },
          { label: 'Grand Canyon Tours', aliases: ['grand canyon'], category: 'experience' },
          { label: 'Caesars Palace', aliases: ['caesars'], category: 'attraction' },
          { label: 'The Venetian', aliases: ['venetian'], category: 'attraction' },
          { label: 'MGM Grand', aliases: ['mgm'], category: 'attraction' },
          { label: 'Cirque du Soleil', aliases: ['cirque shows'], category: 'experience' },
          { label: 'Red Rock Canyon', aliases: ['red rocks'], category: 'experience' },
          { label: 'Hoover Dam', aliases: ['hoover'], category: 'attraction' }
        ]
      },
      // San Francisco tags
      {
        cityId: 7,
        tags: [
          { label: 'Golden Gate Bridge', aliases: ['golden gate'], category: 'attraction' },
          { label: 'Alcatraz Island', aliases: ['alcatraz'], category: 'attraction' },
          { label: 'Fishermans Wharf', aliases: ['fisherman wharf'], category: 'district' },
          { label: 'Chinatown', aliases: ['china town'], category: 'district' },
          { label: 'Lombard Street', aliases: ['crooked street'], category: 'attraction' },
          { label: 'Union Square', aliases: ['union sq'], category: 'district' },
          { label: 'Golden Gate Park', aliases: ['gg park'], category: 'experience' },
          { label: 'Cable Cars', aliases: ['trolley'], category: 'experience' },
          { label: 'Pier 39', aliases: ['pier39'], category: 'attraction' },
          { label: 'Sausalito', aliases: ['sausalito ferry'], category: 'experience' }
        ]
      },
      // Miami tags
      {
        cityId: 8,
        tags: [
          { label: 'South Beach', aliases: ['south beach miami', 'sobe'], category: 'attraction' },
          { label: 'Art Deco District', aliases: ['art deco'], category: 'district' },
          { label: 'Little Havana', aliases: ['calle ocho'], category: 'district' },
          { label: 'Wynwood Walls', aliases: ['wynwood'], category: 'attraction' },
          { label: 'Everglades Tours', aliases: ['everglades'], category: 'experience' },
          { label: 'Bayside Marketplace', aliases: ['bayside'], category: 'attraction' },
          { label: 'Key Biscayne', aliases: ['key biscayne beach'], category: 'attraction' },
          { label: 'Vizcaya Museum', aliases: ['vizcaya'], category: 'experience' },
          { label: 'Ocean Drive', aliases: ['ocean dr'], category: 'district' },
          { label: 'Coconut Grove', aliases: ['the grove'], category: 'district' }
        ]
      }
    ];
    
    let tagIdCounter = 1;
    cityTagsData.forEach(cityData => {
      cityData.tags.forEach((tagData) => {
        const tagId = tagIdCounter++;
        const tag: CityTag = {
          id: tagId,
          cityId: cityData.cityId,
          label: tagData.label,
          normalizedLabel: tagData.label.toLowerCase().replace(/[\s-_]+/g, ''),
          source: 'curated',
          score: '1.00',
          placeIds: [],
          metadata: { category: tagData.category },
          usageCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        this.cityTags.set(tagId, tag);
        
        // Add aliases
        tagData.aliases.forEach((aliasText, aliasIndex) => {
          const alias: TagAlias = {
            id: tagId * 100 + aliasIndex,
            tagId,
            alias: aliasText,
            normalizedAlias: aliasText.toLowerCase().replace(/[\s-_]+/g, ''),
            language: aliasText.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/) ? 'ja' : 'en',
            aliasType: aliasText.length <= 3 ? 'abbreviation' : 'translation',
            confidence: '1.00',
            createdAt: new Date()
          };
          this.tagAliases.set(alias.id, alias);
        });
      });
    });
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

  // City operations
  async getCityByName(cityName: string, countryCode: string): Promise<City | undefined> {
    return Array.from(this.cities.values()).find(
      city => city.cityName.toLowerCase() === cityName.toLowerCase() && 
              city.countryCode === countryCode
    );
  }

  // City tag operations
  async getCityTags(cityId: number): Promise<CityTag[]> {
    return Array.from(this.cityTags.values())
      .filter(tag => tag.cityId === cityId && tag.isActive)
      .sort((a, b) => Number(b.score) - Number(a.score));
  }

  async getCityTag(id: number): Promise<CityTag | undefined> {
    return this.cityTags.get(id);
  }

  async createCityTag(tag: InsertCityTag): Promise<CityTag> {
    const id = ++this.cityTagCounter;
    const newTag: CityTag = {
      id,
      ...tag,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.cityTags.set(id, newTag);
    return newTag;
  }

  async updateCityTag(id: number, updates: Partial<CityTag>): Promise<CityTag | undefined> {
    const tag = this.cityTags.get(id);
    if (!tag) return undefined;
    
    const updated = { ...tag, ...updates, updatedAt: new Date() };
    this.cityTags.set(id, updated);
    return updated;
  }

  async incrementTagUsage(tagId: number): Promise<void> {
    const tag = this.cityTags.get(tagId);
    if (tag) {
      await this.updateCityTag(tagId, { 
        usageCount: tag.usageCount + 1,
        score: (Number(tag.score) + 0.01).toFixed(2) // Slightly increase score with usage
      });
    }
  }

  // Tag alias operations
  async getTagAliasesByCityId(cityId: number): Promise<TagAlias[]> {
    const cityTagIds = Array.from(this.cityTags.values())
      .filter(tag => tag.cityId === cityId)
      .map(tag => tag.id);
    
    return Array.from(this.tagAliases.values())
      .filter(alias => cityTagIds.includes(alias.tagId));
  }

  async getTagAliases(tagId: number): Promise<TagAlias[]> {
    return Array.from(this.tagAliases.values())
      .filter(alias => alias.tagId === tagId);
  }

  async createTagAlias(alias: InsertTagAlias): Promise<TagAlias> {
    const id = Math.max(...Array.from(this.tagAliases.keys()), 0) + 1;
    const newAlias: TagAlias = {
      id,
      ...alias,
      createdAt: new Date()
    };
    this.tagAliases.set(id, newAlias);
    return newAlias;
  }
}

export const storage = new MemStorage();
