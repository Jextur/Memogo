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
      },
      {
        id: 9,
        googlePlaceId: 'ChIJ0fr0GnnDwoARRr_e8vnfGEU',
        cityName: 'Chicago',
        countryCode: 'US',
        countryName: 'USA',
        adminLevel1: 'Illinois',
        latitude: '41.8781',
        longitude: '-87.6298',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // UK cities
      {
        id: 10,
        googlePlaceId: 'ChIJdd4hrwug2EcRcJCL3JGz6II',
        cityName: 'London',
        countryCode: 'GB',
        countryName: 'United Kingdom',
        adminLevel1: 'England',
        latitude: '51.5074',
        longitude: '-0.1278',
        isCurated: true,
        popularity: 100,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 11,
        googlePlaceId: 'ChIJIyaYpQC4h0gRVxbTGowStCE',
        cityName: 'Edinburgh',
        countryCode: 'GB',
        countryName: 'United Kingdom',
        adminLevel1: 'Scotland',
        latitude: '55.9533',
        longitude: '-3.1883',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // France cities
      {
        id: 12,
        googlePlaceId: 'ChIJD7fiBh9u5kcRPFkwD4g6AKI',
        cityName: 'Paris',
        countryCode: 'FR',
        countryName: 'France',
        adminLevel1: 'Île-de-France',
        latitude: '48.8566',
        longitude: '2.3522',
        isCurated: true,
        popularity: 100,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 13,
        googlePlaceId: 'ChIJW2hEJh1zzxIRnSP3W4Lj2lU',
        cityName: 'Nice',
        countryCode: 'FR',
        countryName: 'France',
        adminLevel1: 'Provence-Alpes-Côte d\'Azur',
        latitude: '43.7102',
        longitude: '7.2620',
        isCurated: true,
        popularity: 80,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Italy cities
      {
        id: 14,
        googlePlaceId: 'ChIJu46S-XhDMxMRAhMZFCJ5Z5E',
        cityName: 'Rome',
        countryCode: 'IT',
        countryName: 'Italy',
        adminLevel1: 'Lazio',
        latitude: '41.9028',
        longitude: '12.4964',
        isCurated: true,
        popularity: 100,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 15,
        googlePlaceId: 'ChIJr5EZ5JkxGxARNj6RRgJKY5g',
        cityName: 'Venice',
        countryCode: 'IT',
        countryName: 'Italy',
        adminLevel1: 'Veneto',
        latitude: '45.4408',
        longitude: '12.3155',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 16,
        googlePlaceId: 'ChIJQRDbubUuKRMR9I5e-VWUJqA',
        cityName: 'Florence',
        countryCode: 'IT',
        countryName: 'Italy',
        adminLevel1: 'Tuscany',
        latitude: '43.7696',
        longitude: '11.2558',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 17,
        googlePlaceId: 'ChIJ53USP0nBhkcR3EqI0CRDP5c',
        cityName: 'Milan',
        countryCode: 'IT',
        countryName: 'Italy',
        adminLevel1: 'Lombardy',
        latitude: '45.4642',
        longitude: '9.1900',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Spain cities
      {
        id: 18,
        googlePlaceId: 'ChIJ5TCOcRaYZQgR5JHf8JXBNwY',
        cityName: 'Barcelona',
        countryCode: 'ES',
        countryName: 'Spain',
        adminLevel1: 'Catalonia',
        latitude: '41.3851',
        longitude: '2.1734',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 19,
        googlePlaceId: 'ChIJi7xhMnjjQgwRE4ELH79cOkQ',
        cityName: 'Madrid',
        countryCode: 'ES',
        countryName: 'Spain',
        adminLevel1: 'Community of Madrid',
        latitude: '40.4168',
        longitude: '-3.7038',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // More Japan cities 
      {
        id: 20,
        googlePlaceId: 'ChIJ-wBUcqA3GTURqP7nVvUi0lg',
        cityName: 'Okinawa',
        countryCode: 'JP',
        countryName: 'Japan',
        adminLevel1: 'Okinawa',
        latitude: '26.2124',
        longitude: '127.6809',
        isCurated: true,
        popularity: 80,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 21,
        googlePlaceId: 'ChIJRx_3uqJXJV8RLhGKRAObwec',
        cityName: 'Sapporo',
        countryCode: 'JP',
        countryName: 'Japan',
        adminLevel1: 'Hokkaido',
        latitude: '43.0621',
        longitude: '141.3544',
        isCurated: true,
        popularity: 75,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // South Korea cities
      {
        id: 22,
        googlePlaceId: 'ChIJzWXFYeuifDcRXwmC8j-H2nI',
        cityName: 'Seoul',
        countryCode: 'KR',
        countryName: 'South Korea',
        adminLevel1: 'Seoul',
        latitude: '37.5665',
        longitude: '126.9780',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 23,
        googlePlaceId: 'ChIJNc0j6G3jYjcRPLWhsNuF0FE',
        cityName: 'Busan',
        countryCode: 'KR',
        countryName: 'South Korea',
        adminLevel1: 'Busan',
        latitude: '35.1796',
        longitude: '129.0756',
        isCurated: true,
        popularity: 80,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Thailand cities
      {
        id: 24,
        googlePlaceId: 'ChIJ82ENKDJLHTQRIhWK-9Z_cc0',
        cityName: 'Bangkok',
        countryCode: 'TH',
        countryName: 'Thailand',
        adminLevel1: 'Bangkok',
        latitude: '13.7563',
        longitude: '100.5018',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 25,
        googlePlaceId: 'ChIJayW5xvJAQTARCpzTbmZq7Qs',
        cityName: 'Chiang Mai',
        countryCode: 'TH',
        countryName: 'Thailand',
        adminLevel1: 'Chiang Mai',
        latitude: '18.7061',
        longitude: '98.9817',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 26,
        googlePlaceId: 'ChIJgUbEoXqeUDARGBvyXM6gybQ',
        cityName: 'Phuket',
        countryCode: 'TH',
        countryName: 'Thailand',
        adminLevel1: 'Phuket',
        latitude: '7.8804',
        longitude: '98.3923',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Singapore
      {
        id: 27,
        googlePlaceId: 'ChIJdZOL_jEb2jERre9qlCOBnFs',
        cityName: 'Singapore',
        countryCode: 'SG',
        countryName: 'Singapore',
        adminLevel1: 'Singapore',
        latitude: '1.3521',
        longitude: '103.8198',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Australia cities
      {
        id: 28,
        googlePlaceId: 'ChIJP3Sa8ziEEmsRUKgyFmh9AQM',
        cityName: 'Sydney',
        countryCode: 'AU',
        countryName: 'Australia',
        adminLevel1: 'New South Wales',
        latitude: '-33.8688',
        longitude: '151.2093',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 29,
        googlePlaceId: 'ChIJ90260rVG1moRlmhyKguEjSY',
        cityName: 'Melbourne',
        countryCode: 'AU',
        countryName: 'Australia',
        adminLevel1: 'Victoria',
        latitude: '-37.8136',
        longitude: '144.9631',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // China cities
      {
        id: 30,
        googlePlaceId: 'ChIJAVuH1DRU8DURATjXVMblfCk',
        cityName: 'Beijing',
        countryCode: 'CN',
        countryName: 'China',
        adminLevel1: 'Beijing',
        latitude: '39.9042',
        longitude: '116.4074',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 31,
        googlePlaceId: 'ChIJMzz1sUBwsjURKBH6_1npgpI',
        cityName: 'Shanghai',
        countryCode: 'CN',
        countryName: 'China',
        adminLevel1: 'Shanghai',
        latitude: '31.2304',
        longitude: '121.4737',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 32,
        googlePlaceId: 'ChIJBcB_sVoFAjQR3RbANwlRSpo',
        cityName: 'Hong Kong',
        countryCode: 'HK',
        countryName: 'Hong Kong',
        adminLevel1: 'Hong Kong',
        latitude: '22.3193',
        longitude: '114.1694',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // UAE cities
      {
        id: 33,
        googlePlaceId: 'ChIJRcbZaklDXz4RYlEphFBu5r0',
        cityName: 'Dubai',
        countryCode: 'AE',
        countryName: 'UAE',
        adminLevel1: 'Dubai',
        latitude: '25.2048',
        longitude: '55.2708',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 34,
        googlePlaceId: 'ChIJoVLydJVuXj4R3tOaZ4mjXrw',
        cityName: 'Abu Dhabi',
        countryCode: 'AE',
        countryName: 'UAE',
        adminLevel1: 'Abu Dhabi',
        latitude: '24.4539',
        longitude: '54.3773',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Turkey
      {
        id: 35,
        googlePlaceId: 'ChIJOwY1H6OLlxQR7c-RZnKgrds',
        cityName: 'Istanbul',
        countryCode: 'TR',
        countryName: 'Turkey',
        adminLevel1: 'Istanbul',
        latitude: '41.0082',
        longitude: '28.9784',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Germany cities
      {
        id: 36,
        googlePlaceId: 'ChIJAVkDPzpRqEcRcE5YH9XQnvs',
        cityName: 'Berlin',
        countryCode: 'DE',
        countryName: 'Germany',
        adminLevel1: 'Berlin',
        latitude: '52.5200',
        longitude: '13.4050',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 37,
        googlePlaceId: 'ChIJ2e-gOrxfnkcRbXvXWX0gJQU',
        cityName: 'Munich',
        countryCode: 'DE',
        countryName: 'Germany',
        adminLevel1: 'Bavaria',
        latitude: '48.1351',
        longitude: '11.5820',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Greece cities
      {
        id: 38,
        googlePlaceId: 'ChIJ8UNwBw-YoRQRP6rmh8JgECg',
        cityName: 'Athens',
        countryCode: 'GR',
        countryName: 'Greece',
        adminLevel1: 'Attica',
        latitude: '37.9838',
        longitude: '23.7275',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 39,
        googlePlaceId: 'ChIJW9SU68U4mhQRn-LJBBdcFIM',
        cityName: 'Santorini',
        countryCode: 'GR',
        countryName: 'Greece',
        adminLevel1: 'South Aegean',
        latitude: '36.3932',
        longitude: '25.4615',
        isCurated: true,
        popularity: 90,
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
      },
      // Chicago tags
      {
        cityId: 9,
        tags: [
          { label: 'Millennium Park', aliases: ['millennium'], category: 'attraction' },
          { label: 'Willis Tower', aliases: ['sears tower'], category: 'attraction' },
          { label: 'Navy Pier', aliases: ['pier'], category: 'attraction' },
          { label: 'Art Institute', aliases: ['art museum'], category: 'experience' },
          { label: 'The Bean', aliases: ['cloud gate'], category: 'attraction' },
          { label: 'River Architecture Cruise', aliases: ['river cruise'], category: 'experience' },
          { label: 'Deep Dish Pizza', aliases: ['pizza'], category: 'food' },
          { label: 'Magnificent Mile', aliases: ['mag mile'], category: 'district' },
          { label: 'Wrigley Field', aliases: ['cubs stadium'], category: 'attraction' },
          { label: 'Lincoln Park Zoo', aliases: ['zoo'], category: 'attraction' },
          { label: 'Chicago Theatre', aliases: ['theater'], category: 'experience' }
        ]
      },
      // London tags
      {
        cityId: 10,
        tags: [
          { label: 'Big Ben', aliases: ['clock tower', 'elizabeth tower'], category: 'attraction' },
          { label: 'Tower Bridge', aliases: ['bridge'], category: 'attraction' },
          { label: 'Buckingham Palace', aliases: ['palace'], category: 'attraction' },
          { label: 'British Museum', aliases: ['museum'], category: 'experience' },
          { label: 'London Eye', aliases: ['observation wheel'], category: 'attraction' },
          { label: 'Tower of London', aliases: ['tower'], category: 'attraction' },
          { label: 'Westminster Abbey', aliases: ['abbey'], category: 'attraction' },
          { label: 'Camden Market', aliases: ['camden'], category: 'district' },
          { label: 'Covent Garden', aliases: ['covent'], category: 'district' },
          { label: 'Hyde Park', aliases: ['park'], category: 'attraction' },
          { label: 'West End Shows', aliases: ['theatre', 'theater'], category: 'experience' },
          { label: 'Notting Hill', aliases: ['nottinghill'], category: 'district' },
          { label: 'Borough Market', aliases: ['food market'], category: 'food' }
        ]
      },
      // Edinburgh tags
      {
        cityId: 11,
        tags: [
          { label: 'Edinburgh Castle', aliases: ['castle'], category: 'attraction' },
          { label: 'Royal Mile', aliases: ['mile'], category: 'district' },
          { label: 'Arthur\'s Seat', aliases: ['arthurs seat'], category: 'attraction' },
          { label: 'Princes Street', aliases: ['shopping'], category: 'district' },
          { label: 'National Museum', aliases: ['museum'], category: 'experience' },
          { label: 'Holyrood Palace', aliases: ['palace'], category: 'attraction' },
          { label: 'Edinburgh Festival', aliases: ['fringe', 'festival'], category: 'experience' },
          { label: 'Ghost Tours', aliases: ['haunted tours'], category: 'experience' },
          { label: 'Scotch Whisky Experience', aliases: ['whisky', 'whiskey'], category: 'experience' },
          { label: 'Calton Hill', aliases: ['hill'], category: 'attraction' },
          { label: 'Dean Village', aliases: ['village'], category: 'district' }
        ]
      },
      // Paris tags
      {
        cityId: 12,
        tags: [
          { label: 'Eiffel Tower', aliases: ['tour eiffel'], category: 'attraction' },
          { label: 'Louvre Museum', aliases: ['louvre', 'mona lisa'], category: 'experience' },
          { label: 'Arc de Triomphe', aliases: ['arc'], category: 'attraction' },
          { label: 'Notre-Dame', aliases: ['cathedral'], category: 'attraction' },
          { label: 'Champs-Élysées', aliases: ['champs elysees'], category: 'district' },
          { label: 'Montmartre', aliases: ['sacre coeur'], category: 'district' },
          { label: 'Versailles', aliases: ['palace'], category: 'attraction' },
          { label: 'Seine River Cruise', aliases: ['river cruise'], category: 'experience' },
          { label: 'Latin Quarter', aliases: ['quartier latin'], category: 'district' },
          { label: 'Marais District', aliases: ['le marais'], category: 'district' },
          { label: 'Orsay Museum', aliases: ["musée d'orsay"], category: 'experience' },
          { label: 'Moulin Rouge', aliases: ['cabaret'], category: 'experience' },
          { label: 'Sainte-Chapelle', aliases: ['chapel'], category: 'attraction' }
        ]
      },
      // Nice tags
      {
        cityId: 13,
        tags: [
          { label: 'Promenade des Anglais', aliases: ['promenade'], category: 'attraction' },
          { label: 'Old Town', aliases: ['vieux nice'], category: 'district' },
          { label: 'Castle Hill', aliases: ['colline du château'], category: 'attraction' },
          { label: 'Beach Clubs', aliases: ['private beaches'], category: 'attraction' },
          { label: 'Cours Saleya Market', aliases: ['flower market'], category: 'food' },
          { label: 'Monaco Day Trip', aliases: ['monte carlo'], category: 'experience' },
          { label: 'Russian Cathedral', aliases: ['cathedral'], category: 'attraction' },
          { label: 'Marc Chagall Museum', aliases: ['chagall'], category: 'experience' },
          { label: 'Cap Ferrat', aliases: ['saint jean'], category: 'district' },
          { label: 'Antibes', aliases: ['juan les pins'], category: 'experience' }
        ]
      },
      // Rome tags
      {
        cityId: 14,
        tags: [
          { label: 'Colosseum', aliases: ['colosseo'], category: 'attraction' },
          { label: 'Vatican City', aliases: ['vatican', 'st peters'], category: 'attraction' },
          { label: 'Trevi Fountain', aliases: ['fontana di trevi'], category: 'attraction' },
          { label: 'Roman Forum', aliases: ['forum'], category: 'attraction' },
          { label: 'Pantheon', aliases: ['pantheon temple'], category: 'attraction' },
          { label: 'Spanish Steps', aliases: ['piazza di spagna'], category: 'attraction' },
          { label: 'Trastevere', aliases: ['trastevere district'], category: 'district' },
          { label: 'Campo de\' Fiori', aliases: ['market'], category: 'district' },
          { label: 'Borghese Gallery', aliases: ['villa borghese'], category: 'experience' },
          { label: 'Sistine Chapel', aliases: ['cappella sistina'], category: 'attraction' },
          { label: 'Piazza Navona', aliases: ['navona'], category: 'district' },
          { label: 'Catacombs', aliases: ['underground rome'], category: 'experience' }
        ]
      },
      // Venice tags
      {
        cityId: 15,
        tags: [
          { label: 'St. Mark\'s Square', aliases: ['piazza san marco'], category: 'attraction' },
          { label: 'Grand Canal', aliases: ['canal grande'], category: 'attraction' },
          { label: 'Rialto Bridge', aliases: ['ponte di rialto'], category: 'attraction' },
          { label: 'Gondola Ride', aliases: ['gondola'], category: 'experience' },
          { label: 'Doge\'s Palace', aliases: ['palazzo ducale'], category: 'attraction' },
          { label: 'St. Mark\'s Basilica', aliases: ['basilica'], category: 'attraction' },
          { label: 'Murano Island', aliases: ['murano glass'], category: 'experience' },
          { label: 'Burano Island', aliases: ['colorful houses'], category: 'experience' },
          { label: 'Bridge of Sighs', aliases: ['ponte dei sospiri'], category: 'attraction' },
          { label: 'Peggy Guggenheim', aliases: ['guggenheim'], category: 'experience' },
          { label: 'Venetian Masks', aliases: ['carnival masks'], category: 'experience' }
        ]
      },
      // Florence tags
      {
        cityId: 16,
        tags: [
          { label: 'Uffizi Gallery', aliases: ['uffizi'], category: 'experience' },
          { label: 'Duomo', aliases: ['cathedral', 'brunelleschi dome'], category: 'attraction' },
          { label: 'Ponte Vecchio', aliases: ['old bridge'], category: 'attraction' },
          { label: 'David Statue', aliases: ['michelangelo david'], category: 'attraction' },
          { label: 'Boboli Gardens', aliases: ['gardens'], category: 'attraction' },
          { label: 'Piazzale Michelangelo', aliases: ['viewpoint'], category: 'attraction' },
          { label: 'Santa Croce', aliases: ['basilica'], category: 'attraction' },
          { label: 'Pitti Palace', aliases: ['palazzo pitti'], category: 'attraction' },
          { label: 'Mercato Centrale', aliases: ['central market'], category: 'food' },
          { label: 'San Lorenzo Market', aliases: ['leather market'], category: 'district' },
          { label: 'Oltrarno District', aliases: ['artisan quarter'], category: 'district' }
        ]
      },
      // Milan tags
      {
        cityId: 17,
        tags: [
          { label: 'Milan Cathedral', aliases: ['duomo di milano'], category: 'attraction' },
          { label: 'Galleria Vittorio Emanuele', aliases: ['galleria'], category: 'attraction' },
          { label: 'La Scala Opera', aliases: ['teatro alla scala'], category: 'experience' },
          { label: 'Fashion District', aliases: ['quadrilatero'], category: 'district' },
          { label: 'Navigli Canals', aliases: ['navigli'], category: 'district' },
          { label: 'Sforza Castle', aliases: ['castello sforzesco'], category: 'attraction' },
          { label: 'Brera District', aliases: ['brera'], category: 'district' },
          { label: 'Last Supper', aliases: ['cenacolo'], category: 'attraction' },
          { label: 'Aperitivo Culture', aliases: ['happy hour'], category: 'food' },
          { label: 'San Siro Stadium', aliases: ['giuseppe meazza'], category: 'attraction' }
        ]
      },
      // Barcelona tags
      {
        cityId: 18,
        tags: [
          { label: 'Sagrada Familia', aliases: ['sagrada', 'gaudi'], category: 'attraction' },
          { label: 'Park Güell', aliases: ['park guell', 'parc guell'], category: 'attraction' },
          { label: 'Las Ramblas', aliases: ['la rambla'], category: 'district' },
          { label: 'Gothic Quarter', aliases: ['barri gotic'], category: 'district' },
          { label: 'Casa Batlló', aliases: ['batllo'], category: 'attraction' },
          { label: 'Camp Nou', aliases: ['fc barcelona'], category: 'attraction' },
          { label: 'Barceloneta Beach', aliases: ['beach'], category: 'attraction' },
          { label: 'Boqueria Market', aliases: ['la boqueria'], category: 'food' },
          { label: 'Montjuïc', aliases: ['montjuic hill'], category: 'attraction' },
          { label: 'Picasso Museum', aliases: ['museu picasso'], category: 'experience' },
          { label: 'El Born', aliases: ['born district'], category: 'district' },
          { label: 'Tapas Tours', aliases: ['tapas crawl'], category: 'food' }
        ]
      },
      // Madrid tags
      {
        cityId: 19,
        tags: [
          { label: 'Prado Museum', aliases: ['museo del prado'], category: 'experience' },
          { label: 'Royal Palace', aliases: ['palacio real'], category: 'attraction' },
          { label: 'Retiro Park', aliases: ['parque del retiro'], category: 'attraction' },
          { label: 'Plaza Mayor', aliases: ['main square'], category: 'district' },
          { label: 'Puerta del Sol', aliases: ['sol'], category: 'district' },
          { label: 'Reina Sofia Museum', aliases: ['museo reina sofia'], category: 'experience' },
          { label: 'Gran Via', aliases: ['shopping street'], category: 'district' },
          { label: 'Mercado San Miguel', aliases: ['san miguel market'], category: 'food' },
          { label: 'Santiago Bernabéu', aliases: ['real madrid'], category: 'attraction' },
          { label: 'El Rastro Flea Market', aliases: ['rastro'], category: 'district' },
          { label: 'Malasaña District', aliases: ['malasana'], category: 'district' },
          { label: 'Flamenco Shows', aliases: ['flamenco'], category: 'experience' }
        ]
      },
      // Okinawa tags
      {
        cityId: 20,
        tags: [
          { label: 'Churaumi Aquarium', aliases: ['aquarium', '美ら海水族館'], category: 'attraction' },
          { label: 'Shuri Castle', aliases: ['首里城', 'castle'], category: 'attraction' },
          { label: 'Kokusai Street', aliases: ['国際通り', 'shopping street'], category: 'district' },
          { label: 'Beautiful Beaches', aliases: ['beaches', 'emerald beach'], category: 'attraction' },
          { label: 'Snorkeling & Diving', aliases: ['blue cave', 'diving'], category: 'experience' },
          { label: 'Island Hopping', aliases: ['ishigaki', 'miyako'], category: 'experience' },
          { label: 'Okinawa World', aliases: ['gyokusendo cave'], category: 'attraction' },
          { label: 'American Village', aliases: ['mihama'], category: 'district' },
          { label: 'Naha Market', aliases: ['makishi market'], category: 'food' },
          { label: 'Traditional Ryukyu Culture', aliases: ['ryukyu village'], category: 'experience' }
        ]
      },
      // Sapporo tags
      {
        cityId: 21,
        tags: [
          { label: 'Snow Festival', aliases: ['雪まつり', 'yuki matsuri'], category: 'experience' },
          { label: 'Sapporo Beer Museum', aliases: ['beer garden', 'ビール博物館'], category: 'experience' },
          { label: 'Susukino District', aliases: ['すすきの', 'nightlife'], category: 'district' },
          { label: 'Odori Park', aliases: ['大通公園'], category: 'attraction' },
          { label: 'Mount Moiwa', aliases: ['もいわ山', 'ropeway'], category: 'attraction' },
          { label: 'Ramen Alley', aliases: ['ラーメン横丁', 'miso ramen'], category: 'food' },
          { label: 'Jingisukan', aliases: ['lamb bbq', 'ジンギスカン'], category: 'food' },
          { label: 'Nijo Market', aliases: ['二条市場', 'seafood market'], category: 'food' },
          { label: 'Historic Village', aliases: ['開拓の村'], category: 'experience' },
          { label: 'Hot Springs', aliases: ['jozankei onsen', '温泉'], category: 'experience' }
        ]
      },
      // Seoul tags
      {
        cityId: 22,
        tags: [
          { label: 'Gyeongbokgung Palace', aliases: ['경복궁', 'palace'], category: 'attraction' },
          { label: 'N Seoul Tower', aliases: ['namsan tower', '남산타워'], category: 'attraction' },
          { label: 'Myeongdong', aliases: ['명동', 'shopping'], category: 'district' },
          { label: 'Bukchon Hanok Village', aliases: ['북촌한옥마을', 'traditional village'], category: 'district' },
          { label: 'Insadong', aliases: ['인사동', 'art street'], category: 'district' },
          { label: 'Gangnam District', aliases: ['강남', 'gangnam style'], category: 'district' },
          { label: 'Korean BBQ', aliases: ['kbbq', '고기구이'], category: 'food' },
          { label: 'K-Pop Experience', aliases: ['kpop', 'bts'], category: 'experience' },
          { label: 'DMZ Tour', aliases: ['demilitarized zone'], category: 'experience' },
          { label: 'Dongdaemun Market', aliases: ['동대문', 'ddm'], category: 'district' },
          { label: 'Han River', aliases: ['한강', 'hangang park'], category: 'attraction' },
          { label: 'Street Food Markets', aliases: ['gwangjang', '광장시장'], category: 'food' }
        ]
      },
      // Busan tags
      {
        cityId: 23,
        tags: [
          { label: 'Haeundae Beach', aliases: ['해운대', 'beach'], category: 'attraction' },
          { label: 'Gamcheon Culture Village', aliases: ['감천문화마을', 'colorful village'], category: 'district' },
          { label: 'Jagalchi Fish Market', aliases: ['자갈치시장', 'seafood'], category: 'food' },
          { label: 'Haedong Yonggungsa Temple', aliases: ['해동용궁사', 'seaside temple'], category: 'attraction' },
          { label: 'Gwangalli Beach', aliases: ['광안리', 'diamond bridge'], category: 'attraction' },
          { label: 'Taejongdae Park', aliases: ['태종대', 'coastal park'], category: 'attraction' },
          { label: 'Spa Land', aliases: ['스파랜드', 'jjimjilbang'], category: 'experience' },
          { label: 'BIFF Square', aliases: ['부산국제영화제', 'film festival'], category: 'district' },
          { label: 'Gukje Market', aliases: ['국제시장', 'traditional market'], category: 'district' },
          { label: 'Beomeosa Temple', aliases: ['범어사'], category: 'attraction' }
        ]
      },
      // Bangkok tags
      {
        cityId: 24,
        tags: [
          { label: 'Grand Palace', aliases: ['พระบรมมหาราชวัง', 'royal palace'], category: 'attraction' },
          { label: 'Wat Pho', aliases: ['วัดโพธิ์', 'reclining buddha'], category: 'attraction' },
          { label: 'Wat Arun', aliases: ['วัดอรุณ', 'temple of dawn'], category: 'attraction' },
          { label: 'Chatuchak Market', aliases: ['จตุจักร', 'weekend market'], category: 'district' },
          { label: 'Floating Markets', aliases: ['damnoen saduak', 'amphawa'], category: 'experience' },
          { label: 'Street Food Tours', aliases: ['pad thai', 'tom yum'], category: 'food' },
          { label: 'Khao San Road', aliases: ['ถนนข้าวสาร', 'backpacker street'], category: 'district' },
          { label: 'Rooftop Bars', aliases: ['sky bar', 'lebua'], category: 'experience' },
          { label: 'Chinatown', aliases: ['yaowarat', 'เยาวราช'], category: 'district' },
          { label: 'Jim Thompson House', aliases: ['silk house'], category: 'attraction' },
          { label: 'Thai Massage', aliases: ['spa', 'นวดแผนไทย'], category: 'experience' },
          { label: 'Chao Phraya River', aliases: ['แม่น้ำเจ้าพระยา', 'river cruise'], category: 'experience' }
        ]
      },
      // Chiang Mai tags
      {
        cityId: 25,
        tags: [
          { label: 'Doi Suthep Temple', aliases: ['ดอยสุเทพ', 'mountain temple'], category: 'attraction' },
          { label: 'Old City Temples', aliases: ['wat chedi luang', 'wat phra singh'], category: 'attraction' },
          { label: 'Night Bazaar', aliases: ['ไนท์บาซาร์', 'night market'], category: 'district' },
          { label: 'Sunday Walking Street', aliases: ['ถนนคนเดิน', 'weekend market'], category: 'district' },
          { label: 'Elephant Sanctuary', aliases: ['ethical elephant'], category: 'experience' },
          { label: 'Thai Cooking Class', aliases: ['cooking school'], category: 'experience' },
          { label: 'Nimman Road', aliases: ['นิมมาน', 'trendy area'], category: 'district' },
          { label: 'Khao Soi', aliases: ['ข้าวซอย', 'northern curry'], category: 'food' },
          { label: 'Doi Inthanon', aliases: ['highest peak'], category: 'experience' },
          { label: 'Yi Peng Festival', aliases: ['lantern festival', 'ยี่เป็ง'], category: 'experience' }
        ]
      },
      // Phuket tags
      {
        cityId: 26,
        tags: [
          { label: 'Patong Beach', aliases: ['ป่าตอง', 'party beach'], category: 'attraction' },
          { label: 'Phi Phi Islands', aliases: ['พีพี', 'island tour'], category: 'experience' },
          { label: 'Big Buddha', aliases: ['พระใหญ่', 'hilltop buddha'], category: 'attraction' },
          { label: 'Old Town Phuket', aliases: ['เมืองเก่าภูเก็ต', 'sino-portuguese'], category: 'district' },
          { label: 'Bangla Road', aliases: ['บางลา', 'nightlife'], category: 'district' },
          { label: 'Island Hopping', aliases: ['james bond island', 'similan'], category: 'experience' },
          { label: 'Kata Beach', aliases: ['กะตะ', 'surfing'], category: 'attraction' },
          { label: 'Thai Boxing', aliases: ['muay thai', 'มวยไทย'], category: 'experience' },
          { label: 'Promthep Cape', aliases: ['แหลมพรหมเทพ', 'sunset point'], category: 'attraction' },
          { label: 'Weekend Market', aliases: ['naka market', 'ตลาดนัด'], category: 'food' }
        ]
      },
      // Singapore tags
      {
        cityId: 27,
        tags: [
          { label: 'Marina Bay Sands', aliases: ['mbs', 'skypark'], category: 'attraction' },
          { label: 'Gardens by the Bay', aliases: ['supertrees', 'cloud forest'], category: 'attraction' },
          { label: 'Sentosa Island', aliases: ['universal studios', 'beach'], category: 'experience' },
          { label: 'Orchard Road', aliases: ['shopping belt'], category: 'district' },
          { label: 'Chinatown', aliases: ['牛车水', 'temple street'], category: 'district' },
          { label: 'Little India', aliases: ['tekka', 'serangoon'], category: 'district' },
          { label: 'Hawker Centers', aliases: ['maxwell', 'lau pa sat'], category: 'food' },
          { label: 'Singapore Zoo', aliases: ['night safari', 'river safari'], category: 'attraction' },
          { label: 'Clarke Quay', aliases: ['boat quay', 'nightlife'], category: 'district' },
          { label: 'Merlion Park', aliases: ['merlion statue'], category: 'attraction' },
          { label: 'Arab Street', aliases: ['kampong glam', 'haji lane'], category: 'district' },
          { label: 'Singapore Flyer', aliases: ['observation wheel'], category: 'attraction' }
        ]
      },
      // Sydney tags
      {
        cityId: 28,
        tags: [
          { label: 'Sydney Opera House', aliases: ['opera house'], category: 'attraction' },
          { label: 'Harbour Bridge', aliases: ['bridge climb'], category: 'attraction' },
          { label: 'Bondi Beach', aliases: ['bondi to coogee'], category: 'attraction' },
          { label: 'The Rocks', aliases: ['historic area'], category: 'district' },
          { label: 'Darling Harbour', aliases: ['harbour'], category: 'district' },
          { label: 'Royal Botanic Gardens', aliases: ['gardens'], category: 'attraction' },
          { label: 'Manly Beach', aliases: ['ferry to manly'], category: 'attraction' },
          { label: 'Blue Mountains', aliases: ['three sisters', 'katoomba'], category: 'experience' },
          { label: 'Taronga Zoo', aliases: ['zoo'], category: 'attraction' },
          { label: 'Circular Quay', aliases: ['ferry terminal'], category: 'district' },
          { label: 'Surry Hills', aliases: ['trendy suburb'], category: 'district' },
          { label: 'Fish Market', aliases: ['seafood market'], category: 'food' }
        ]
      },
      // Melbourne tags
      {
        cityId: 29,
        tags: [
          { label: 'Federation Square', aliases: ['fed square'], category: 'attraction' },
          { label: 'Great Ocean Road', aliases: ['12 apostles'], category: 'experience' },
          { label: 'Queen Victoria Market', aliases: ['vic market'], category: 'food' },
          { label: 'Laneways & Street Art', aliases: ['hosier lane', 'graffiti'], category: 'district' },
          { label: 'Melbourne Cricket Ground', aliases: ['mcg', 'sports'], category: 'attraction' },
          { label: 'St Kilda Beach', aliases: ['penguins', 'luna park'], category: 'attraction' },
          { label: 'Royal Botanic Gardens', aliases: ['gardens'], category: 'attraction' },
          { label: 'Coffee Culture', aliases: ['laneway cafes'], category: 'food' },
          { label: 'Fitzroy', aliases: ['hipster suburb'], category: 'district' },
          { label: 'Eureka Skydeck', aliases: ['skydeck 88'], category: 'attraction' },
          { label: 'Phillip Island', aliases: ['penguin parade'], category: 'experience' },
          { label: 'Yarra Valley', aliases: ['wine region'], category: 'experience' }
        ]
      },
      // Beijing tags
      {
        cityId: 30,
        tags: [
          { label: 'Great Wall', aliases: ['长城', 'mutianyu', 'badaling'], category: 'attraction' },
          { label: 'Forbidden City', aliases: ['故宫', 'palace museum'], category: 'attraction' },
          { label: 'Temple of Heaven', aliases: ['天坛'], category: 'attraction' },
          { label: 'Summer Palace', aliases: ['颐和园'], category: 'attraction' },
          { label: 'Tiananmen Square', aliases: ['天安门广场'], category: 'attraction' },
          { label: 'Hutong Tours', aliases: ['胡同', 'rickshaw'], category: 'experience' },
          { label: 'Peking Duck', aliases: ['北京烤鸭', 'roast duck'], category: 'food' },
          { label: 'Wangfujing Street', aliases: ['王府井', 'shopping'], category: 'district' },
          { label: 'Panjiayuan Market', aliases: ['潘家园', 'antique market'], category: 'district' },
          { label: '798 Art District', aliases: ['art zone'], category: 'district' },
          { label: 'Lama Temple', aliases: ['雍和宫'], category: 'attraction' },
          { label: 'Olympic Park', aliases: ['birds nest', '鸟巢'], category: 'attraction' }
        ]
      },
      // Shanghai tags
      {
        cityId: 31,
        tags: [
          { label: 'The Bund', aliases: ['外滩', 'waterfront'], category: 'attraction' },
          { label: 'Yu Garden', aliases: ['豫园', 'yuyuan'], category: 'attraction' },
          { label: 'Oriental Pearl Tower', aliases: ['东方明珠塔'], category: 'attraction' },
          { label: 'Shanghai Tower', aliases: ['上海中心大厦', 'skyscraper'], category: 'attraction' },
          { label: 'Nanjing Road', aliases: ['南京路', 'shopping street'], category: 'district' },
          { label: 'French Concession', aliases: ['法租界', 'xintiandi'], category: 'district' },
          { label: 'Zhujiajiao Water Town', aliases: ['朱家角', 'venice of shanghai'], category: 'experience' },
          { label: 'Shanghai Museum', aliases: ['上海博物馆'], category: 'experience' },
          { label: 'Tianzifang', aliases: ['田子坊', 'art district'], category: 'district' },
          { label: 'Xiaolongbao', aliases: ['小笼包', 'soup dumplings'], category: 'food' },
          { label: 'Pudong Skyline', aliases: ['浦东', 'lujiazui'], category: 'attraction' },
          { label: 'Jade Buddha Temple', aliases: ['玉佛寺'], category: 'attraction' }
        ]
      },
      // Hong Kong tags
      {
        cityId: 32,
        tags: [
          { label: 'Victoria Peak', aliases: ['太平山', 'peak tram'], category: 'attraction' },
          { label: 'Star Ferry', aliases: ['天星小輪', 'harbour crossing'], category: 'experience' },
          { label: 'Temple Street Market', aliases: ['廟街', 'night market'], category: 'district' },
          { label: 'Big Buddha', aliases: ['天壇大佛', 'lantau island'], category: 'attraction' },
          { label: 'Victoria Harbour', aliases: ['維多利亞港', 'symphony of lights'], category: 'attraction' },
          { label: 'Central District', aliases: ['中環', 'ifc mall'], category: 'district' },
          { label: 'Dim Sum', aliases: ['點心', 'yum cha'], category: 'food' },
          { label: 'Ladies Market', aliases: ['女人街', 'mong kok'], category: 'district' },
          { label: 'Ocean Park', aliases: ['海洋公園'], category: 'attraction' },
          { label: 'Disneyland', aliases: ['迪士尼樂園'], category: 'attraction' },
          { label: 'Lan Kwai Fong', aliases: ['蘭桂坊', 'nightlife'], category: 'district' },
          { label: 'Wong Tai Sin Temple', aliases: ['黃大仙祠'], category: 'attraction' }
        ]
      },
      // Dubai tags
      {
        cityId: 33,
        tags: [
          { label: 'Burj Khalifa', aliases: ['tallest building', 'برج خليفة'], category: 'attraction' },
          { label: 'Dubai Mall', aliases: ['shopping', 'aquarium'], category: 'attraction' },
          { label: 'Desert Safari', aliases: ['dune bashing', 'camel ride'], category: 'experience' },
          { label: 'Dubai Marina', aliases: ['marina walk', 'jbr beach'], category: 'district' },
          { label: 'Gold Souk', aliases: ['gold market', 'سوق الذهب'], category: 'district' },
          { label: 'Palm Jumeirah', aliases: ['palm island', 'atlantis'], category: 'attraction' },
          { label: 'Dubai Fountain', aliases: ['fountain show'], category: 'attraction' },
          { label: 'Burj Al Arab', aliases: ['7-star hotel', 'برج العرب'], category: 'attraction' },
          { label: 'Old Dubai', aliases: ['deira', 'bur dubai'], category: 'district' },
          { label: 'Dubai Creek', aliases: ['abra ride', 'خور دبي'], category: 'experience' },
          { label: 'Ski Dubai', aliases: ['indoor skiing'], category: 'experience' },
          { label: 'Global Village', aliases: ['القرية العالمية'], category: 'experience' }
        ]
      },
      // Abu Dhabi tags
      {
        cityId: 34,
        tags: [
          { label: 'Sheikh Zayed Mosque', aliases: ['grand mosque', 'مسجد الشيخ زايد'], category: 'attraction' },
          { label: 'Louvre Abu Dhabi', aliases: ['museum', 'اللوفر أبوظبي'], category: 'experience' },
          { label: 'Ferrari World', aliases: ['theme park', 'عالم فيراري'], category: 'attraction' },
          { label: 'Emirates Palace', aliases: ['luxury hotel', 'قصر الإمارات'], category: 'attraction' },
          { label: 'Corniche Beach', aliases: ['waterfront', 'كورنيش'], category: 'attraction' },
          { label: 'Yas Island', aliases: ['yas marina', 'جزيرة ياس'], category: 'district' },
          { label: 'Qasr Al Watan', aliases: ['presidential palace', 'قصر الوطن'], category: 'attraction' },
          { label: 'Heritage Village', aliases: ['traditional village'], category: 'experience' },
          { label: 'Mangrove Kayaking', aliases: ['eco tour'], category: 'experience' },
          { label: 'Saadiyat Island', aliases: ['beach clubs', 'جزيرة السعديات'], category: 'attraction' }
        ]
      },
      // Istanbul tags
      {
        cityId: 35,
        tags: [
          { label: 'Hagia Sophia', aliases: ['ayasofya', 'آيا صوفيا'], category: 'attraction' },
          { label: 'Blue Mosque', aliases: ['sultanahmet', 'sultan ahmed'], category: 'attraction' },
          { label: 'Topkapi Palace', aliases: ['topkapı sarayı'], category: 'attraction' },
          { label: 'Grand Bazaar', aliases: ['kapalıçarşı', 'covered bazaar'], category: 'district' },
          { label: 'Bosphorus Cruise', aliases: ['boğaziçi', 'strait cruise'], category: 'experience' },
          { label: 'Galata Tower', aliases: ['galata kulesi'], category: 'attraction' },
          { label: 'Basilica Cistern', aliases: ['yerebatan sarnıcı'], category: 'attraction' },
          { label: 'Spice Bazaar', aliases: ['mısır çarşısı', 'egyptian bazaar'], category: 'district' },
          { label: 'Taksim Square', aliases: ['istiklal street', 'beyoğlu'], category: 'district' },
          { label: 'Turkish Bath', aliases: ['hamam', 'حمام'], category: 'experience' },
          { label: 'Dolmabahce Palace', aliases: ['dolmabahçe sarayı'], category: 'attraction' },
          { label: 'Turkish Breakfast', aliases: ['kahvaltı', 'simit'], category: 'food' }
        ]
      },
      // Berlin tags
      {
        cityId: 36,
        tags: [
          { label: 'Brandenburg Gate', aliases: ['brandenburger tor'], category: 'attraction' },
          { label: 'Berlin Wall Memorial', aliases: ['east side gallery'], category: 'attraction' },
          { label: 'Museum Island', aliases: ['museumsinsel', 'pergamon'], category: 'experience' },
          { label: 'Reichstag', aliases: ['bundestag', 'parliament'], category: 'attraction' },
          { label: 'Checkpoint Charlie', aliases: ['cold war'], category: 'attraction' },
          { label: 'Tiergarten', aliases: ['central park'], category: 'attraction' },
          { label: 'Alexanderplatz', aliases: ['tv tower', 'fernsehturm'], category: 'district' },
          { label: 'Potsdamer Platz', aliases: ['sony center'], category: 'district' },
          { label: 'Kreuzberg', aliases: ['turkish market', 'hipster'], category: 'district' },
          { label: 'Berlin Cathedral', aliases: ['berliner dom'], category: 'attraction' },
          { label: 'Hackescher Markt', aliases: ['courtyards'], category: 'district' },
          { label: 'Techno Clubs', aliases: ['berghain', 'nightlife'], category: 'experience' }
        ]
      },
      // Munich tags
      {
        cityId: 37,
        tags: [
          { label: 'Marienplatz', aliases: ['glockenspiel', 'new town hall'], category: 'attraction' },
          { label: 'Neuschwanstein Castle', aliases: ['fairy tale castle', 'disney castle'], category: 'attraction' },
          { label: 'Oktoberfest', aliases: ['beer festival', 'wiesn'], category: 'experience' },
          { label: 'English Garden', aliases: ['englischer garten', 'surfers'], category: 'attraction' },
          { label: 'BMW Museum', aliases: ['bmw welt'], category: 'experience' },
          { label: 'Hofbräuhaus', aliases: ['beer hall'], category: 'food' },
          { label: 'Viktualienmarkt', aliases: ['food market'], category: 'food' },
          { label: 'Nymphenburg Palace', aliases: ['schloss nymphenburg'], category: 'attraction' },
          { label: 'Deutsches Museum', aliases: ['science museum'], category: 'experience' },
          { label: 'Olympic Park', aliases: ['olympiapark'], category: 'attraction' },
          { label: 'Dachau Memorial', aliases: ['concentration camp'], category: 'experience' }
        ]
      },
      // Athens tags
      {
        cityId: 38,
        tags: [
          { label: 'Acropolis', aliases: ['ακρόπολη', 'parthenon'], category: 'attraction' },
          { label: 'Ancient Agora', aliases: ['αγορά', 'marketplace'], category: 'attraction' },
          { label: 'Plaka District', aliases: ['πλάκα', 'old town'], category: 'district' },
          { label: 'National Gardens', aliases: ['εθνικός κήπος'], category: 'attraction' },
          { label: 'Syntagma Square', aliases: ['σύνταγμα', 'parliament'], category: 'district' },
          { label: 'Mount Lycabettus', aliases: ['λυκαβηττός', 'cable car'], category: 'attraction' },
          { label: 'National Archaeological Museum', aliases: ['museum'], category: 'experience' },
          { label: 'Monastiraki', aliases: ['μοναστηράκι', 'flea market'], category: 'district' },
          { label: 'Temple of Olympian Zeus', aliases: ['ολυμπιείον'], category: 'attraction' },
          { label: 'Psyrri', aliases: ['ψυρρή', 'nightlife'], category: 'district' },
          { label: 'Greek Tavernas', aliases: ['ταβέρνα', 'souvlaki'], category: 'food' }
        ]
      },
      // Santorini tags
      {
        cityId: 39,
        tags: [
          { label: 'Oia Sunset', aliases: ['οία', 'blue domes'], category: 'attraction' },
          { label: 'Red Beach', aliases: ['κόκκινη παραλία'], category: 'attraction' },
          { label: 'Fira Town', aliases: ['φηρά', 'capital'], category: 'district' },
          { label: 'Wine Tasting', aliases: ['santo wines', 'assyrtiko'], category: 'experience' },
          { label: 'Caldera Views', aliases: ['καλδέρα', 'volcano view'], category: 'attraction' },
          { label: 'Akrotiri', aliases: ['ακρωτήρι', 'ancient ruins'], category: 'attraction' },
          { label: 'Black Beach', aliases: ['περίσσα', 'kamari'], category: 'attraction' },
          { label: 'Cave Hotels', aliases: ['cliff hotels'], category: 'experience' },
          { label: 'Boat Tours', aliases: ['volcano tour', 'hot springs'], category: 'experience' },
          { label: 'Amoudi Bay', aliases: ['αμούδι', 'seafood'], category: 'food' }
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
    const user: User = { 
      ...insertUser, 
      id,
      email: insertUser.email || null,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  // Conversation operations
  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const conversationId = insertConversation.conversationId || randomUUID();
    const numericId = Math.max(...Array.from(this.conversations.values()).map(c => c.id || 0), 0) + 1;
    const conversation: Conversation = {
      id: numericId,
      conversationId: conversationId,
      userId: insertConversation.userId || null,
      destination: insertConversation.destination || null,
      days: insertConversation.days || null,
      people: insertConversation.people || null,
      theme: insertConversation.theme || null,
      selectedTags: insertConversation.selectedTags || null,
      status: insertConversation.status || "active",
      messages: insertConversation.messages as ChatMessage[] || [],
      refinementCount: insertConversation.refinementCount || 0,
      packagesGenerated: insertConversation.packagesGenerated || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // Use conversationId as the key for consistent lookups
    this.conversations.set(conversationId, conversation);
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
