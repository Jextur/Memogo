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
    // Add major cities from around the world
    const cities = [
      // Asia
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
      {
        id: 4,
        googlePlaceId: 'ChIJa3usHd5YXWARIr8t-vx1U-o',
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
        id: 5,
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        cityName: 'Singapore',
        countryCode: 'SG',
        countryName: 'Singapore',
        adminLevel1: 'Singapore',
        latitude: '1.3521',
        longitude: '103.8198',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        googlePlaceId: 'ChIJP3Sa8ziYEmsRKV5g1SyaHQ',
        cityName: 'Bangkok',
        countryCode: 'TH',
        countryName: 'Thailand',
        adminLevel1: 'Bangkok',
        latitude: '13.7563',
        longitude: '100.5018',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // North America
      {
        id: 7,
        googlePlaceId: 'ChIJOwg_06VPwokRYv534QaPC8g',
        cityName: 'New York',
        countryCode: 'US',
        countryName: 'United States',
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
        id: 8,
        googlePlaceId: 'ChIJE9on3F3HwoAR9AhGJW_fL-I',
        cityName: 'Los Angeles',
        countryCode: 'US',
        countryName: 'United States',
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
        id: 9,
        googlePlaceId: 'ChIJ7cv00DwsDogRAMDACa2m4K8',
        cityName: 'Chicago',
        countryCode: 'US',
        countryName: 'United States',
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
      {
        id: 10,
        googlePlaceId: 'ChIJDbdkHFQayUwR9-X3aUlKGww',
        cityName: 'Toronto',
        countryCode: 'CA',
        countryName: 'Canada',
        adminLevel1: 'Ontario',
        latitude: '43.6532',
        longitude: '-79.3832',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Europe
      {
        id: 11,
        googlePlaceId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI',
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
        id: 12,
        googlePlaceId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ',
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
        googlePlaceId: 'ChIJa76xwh5ymkcRW-WRjmtd6HU',
        cityName: 'Rome',
        countryCode: 'IT',
        countryName: 'Italy',
        adminLevel1: 'Lazio',
        latitude: '41.9028',
        longitude: '12.4964',
        isCurated: true,
        popularity: 95,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 14,
        googlePlaceId: 'ChIJi7xhMnjjQUgR7_q_5vahg',
        cityName: 'Barcelona',
        countryCode: 'ES',
        countryName: 'Spain',
        adminLevel1: 'Catalonia',
        latitude: '41.3851',
        longitude: '2.1734',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 15,
        googlePlaceId: 'ChIJAVkDPzdOqEcRcDteW0YgIQQ',
        cityName: 'Berlin',
        countryCode: 'DE',
        countryName: 'Germany',
        adminLevel1: 'Berlin',
        latitude: '52.5200',
        longitude: '13.4050',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Oceania
      {
        id: 16,
        googlePlaceId: 'ChIJ90260rVG1moRkM2MIXVWBAQ',
        cityName: 'Sydney',
        countryCode: 'AU',
        countryName: 'Australia',
        adminLevel1: 'New South Wales',
        latitude: '-33.8688',
        longitude: '151.2093',
        isCurated: true,
        popularity: 90,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 17,
        googlePlaceId: 'ChIJ07-FWN8_MioRgE7w0F5rlvE',
        cityName: 'Melbourne',
        countryCode: 'AU',
        countryName: 'Australia',
        adminLevel1: 'Victoria',
        latitude: '-37.8136',
        longitude: '144.9631',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // South America
      {
        id: 18,
        googlePlaceId: 'ChIJkWK-FBFsWpERCobTb1_1vUI',
        cityName: 'Rio de Janeiro',
        countryCode: 'BR',
        countryName: 'Brazil',
        adminLevel1: 'Rio de Janeiro',
        latitude: '-22.9068',
        longitude: '-43.1729',
        isCurated: true,
        popularity: 85,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 19,
        googlePlaceId: 'ChIJvQz5TjvKvJURh47oiC6Bs6A',
        cityName: 'Buenos Aires',
        countryCode: 'AR',
        countryName: 'Argentina',
        adminLevel1: 'Buenos Aires',
        latitude: '-34.6037',
        longitude: '-58.3816',
        isCurated: true,
        popularity: 80,
        metadata: {},
        lastValidated: null,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      // Middle East & Africa
      {
        id: 20,
        googlePlaceId: 'ChIJQztFXHsYWBQRJnx3fiIZGO4',
        cityName: 'Dubai',
        countryCode: 'AE',
        countryName: 'United Arab Emirates',
        adminLevel1: 'Dubai',
        latitude: '25.2048',
        longitude: '55.2708',
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
          { label: 'Kiyomizu Temple', aliases: ['清水寺'], category: 'attraction' },
          { label: 'Philosopher\'s Path', aliases: ['哲学の道'], category: 'experience' },
          { label: 'Nijo Castle', aliases: ['二条城'], category: 'attraction' },
          { label: 'Traditional Tea Ceremony', aliases: ['茶道'], category: 'experience' }
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
          { label: 'Namba', aliases: ['難波'], category: 'district' },
          { label: 'Osaka Aquarium', aliases: ['海遊館', 'Kaiyukan'], category: 'attraction' },
          { label: 'Street Food Tour', aliases: ['たこ焼き', 'takoyaki'], category: 'food' },
          { label: 'Umeda Sky Building', aliases: ['梅田スカイビル'], category: 'attraction' }
        ]
      },
      // Seoul tags
      {
        cityId: 4,
        tags: [
          { label: 'Gyeongbokgung Palace', aliases: ['경복궁', 'Gyeongbok'], category: 'attraction' },
          { label: 'Myeongdong', aliases: ['명동'], category: 'district' },
          { label: 'Bukchon Hanok Village', aliases: ['북촌한옥마을'], category: 'experience' },
          { label: 'N Seoul Tower', aliases: ['남산타워', 'Namsan Tower'], category: 'attraction' },
          { label: 'Gangnam District', aliases: ['강남', 'Gangnam'], category: 'district' },
          { label: 'Korean BBQ Experience', aliases: ['삼겹살', 'samgyeopsal'], category: 'food' },
          { label: 'Hongdae', aliases: ['홍대'], category: 'district' },
          { label: 'Lotte World', aliases: ['롯데월드'], category: 'attraction' },
          { label: 'Dongdaemun Market', aliases: ['동대문시장', 'DDP'], category: 'experience' },
          { label: 'War Memorial', aliases: ['전쟁기념관'], category: 'attraction' }
        ]
      },
      // Singapore tags
      {
        cityId: 5,
        tags: [
          { label: 'Marina Bay Sands', aliases: ['MBS', 'SkyPark'], category: 'attraction' },
          { label: 'Gardens by the Bay', aliases: ['Supertree Grove'], category: 'attraction' },
          { label: 'Sentosa Island', aliases: ['Universal Studios Singapore'], category: 'experience' },
          { label: 'Chinatown', aliases: ['牛车水'], category: 'district' },
          { label: 'Little India', aliases: ['Tekka Centre'], category: 'district' },
          { label: 'Hawker Centers', aliases: ['Maxwell', 'Lau Pa Sat'], category: 'food' },
          { label: 'Orchard Road', aliases: ['ION', 'Takashimaya'], category: 'district' },
          { label: 'Singapore Zoo', aliases: ['Night Safari'], category: 'attraction' },
          { label: 'Clarke Quay', aliases: ['Boat Quay'], category: 'district' },
          { label: 'Merlion Park', aliases: ['Merlion statue'], category: 'attraction' }
        ]
      },
      // Bangkok tags
      {
        cityId: 6,
        tags: [
          { label: 'Grand Palace', aliases: ['พระบรมมหาราชวัง', 'Wat Phra Kaew'], category: 'attraction' },
          { label: 'Wat Pho', aliases: ['วัดโพธิ์', 'Reclining Buddha'], category: 'attraction' },
          { label: 'Chatuchak Market', aliases: ['JJ Market', 'จตุจักร'], category: 'experience' },
          { label: 'Khao San Road', aliases: ['ข้าวสาร'], category: 'district' },
          { label: 'Floating Markets', aliases: ['Damnoen Saduak', 'ตลาดน้ำ'], category: 'experience' },
          { label: 'Street Food Tour', aliases: ['Pad Thai', 'Som Tam'], category: 'food' },
          { label: 'Wat Arun', aliases: ['วัดอรุณ', 'Temple of Dawn'], category: 'attraction' },
          { label: 'Siam Square', aliases: ['สยาม', 'MBK'], category: 'district' },
          { label: 'Chao Phraya River', aliases: ['แม่น้ำเจ้าพระยา'], category: 'experience' },
          { label: 'Thai Massage', aliases: ['นวดแผนไทย'], category: 'experience' }
        ]
      },
      // New York tags
      {
        cityId: 7,
        tags: [
          { label: 'Statue of Liberty', aliases: ['Liberty Island', 'Ellis Island'], category: 'attraction' },
          { label: 'Times Square', aliases: ['Broadway', 'Theater District'], category: 'district' },
          { label: 'Central Park', aliases: ['Sheep Meadow', 'Bethesda Fountain'], category: 'attraction' },
          { label: 'Empire State Building', aliases: ['ESB', 'Observatory'], category: 'attraction' },
          { label: 'Brooklyn Bridge', aliases: ['DUMBO', 'Brooklyn Heights'], category: 'attraction' },
          { label: 'Museums', aliases: ['MoMA', 'Met', 'Natural History'], category: 'attraction' },
          { label: 'High Line', aliases: ['Chelsea Market', 'Hudson Yards'], category: 'experience' },
          { label: 'Greenwich Village', aliases: ['Washington Square', 'NYU'], category: 'district' },
          { label: 'Wall Street', aliases: ['Financial District', 'NYSE'], category: 'district' },
          { label: '9/11 Memorial', aliases: ['Ground Zero', 'One World Trade'], category: 'attraction' }
        ]
      },
      // Los Angeles tags
      {
        cityId: 8,
        tags: [
          { label: 'Hollywood', aliases: ['Walk of Fame', 'TCL Chinese Theatre'], category: 'district' },
          { label: 'Universal Studios', aliases: ['Harry Potter World', 'Studio Tour'], category: 'attraction' },
          { label: 'Santa Monica Pier', aliases: ['Venice Beach', 'Pacific Park'], category: 'attraction' },
          { label: 'Beverly Hills', aliases: ['Rodeo Drive', '90210'], category: 'district' },
          { label: 'Griffith Observatory', aliases: ['Hollywood Sign', 'Griffith Park'], category: 'attraction' },
          { label: 'Getty Center', aliases: ['Getty Villa', 'Art Museum'], category: 'attraction' },
          { label: 'Downtown LA', aliases: ['DTLA', 'Arts District'], category: 'district' },
          { label: 'Disneyland', aliases: ['Disney California Adventure', 'Anaheim'], category: 'attraction' },
          { label: 'Malibu', aliases: ['Zuma Beach', 'Point Dume'], category: 'experience' },
          { label: 'Studio Tours', aliases: ['Warner Bros', 'Paramount'], category: 'experience' }
        ]
      },
      // Chicago tags
      {
        cityId: 9,
        tags: [
          { label: 'Willis Tower', aliases: ['Sears Tower', 'Skydeck'], category: 'attraction' },
          { label: 'Millennium Park', aliases: ['Cloud Gate', 'The Bean'], category: 'attraction' },
          { label: 'Navy Pier', aliases: ['Ferris Wheel', 'Fireworks'], category: 'attraction' },
          { label: 'Art Institute', aliases: ['Museum', 'Impressionist Art'], category: 'attraction' },
          { label: 'Chicago Riverwalk', aliases: ['Architecture Boat Tour'], category: 'experience' },
          { label: 'Deep Dish Pizza', aliases: ["Lou Malnati's", "Giordano's"], category: 'food' },
          { label: 'Magnificent Mile', aliases: ['Michigan Avenue', 'Shopping'], category: 'district' },
          { label: 'Wrigley Field', aliases: ['Cubs', 'Baseball'], category: 'attraction' },
          { label: 'Lincoln Park Zoo', aliases: ['Free Zoo', 'Conservatory'], category: 'attraction' },
          { label: 'Second City', aliases: ['Comedy Club', 'Improv'], category: 'experience' }
        ]
      },
      // Toronto tags
      {
        cityId: 10,
        tags: [
          { label: 'CN Tower', aliases: ['SkyPod', 'EdgeWalk'], category: 'attraction' },
          { label: 'Niagara Falls', aliases: ['Horseshoe Falls', 'Maid of the Mist'], category: 'experience' },
          { label: 'Toronto Islands', aliases: ['Centre Island', 'Ferry'], category: 'experience' },
          { label: 'Casa Loma', aliases: ['Castle', 'Gardens'], category: 'attraction' },
          { label: 'St. Lawrence Market', aliases: ['Food Market', 'Peameal Bacon'], category: 'food' },
          { label: 'Distillery District', aliases: ['Victorian Architecture', 'Christmas Market'], category: 'district' },
          { label: 'Royal Ontario Museum', aliases: ['ROM', 'Dinosaurs'], category: 'attraction' },
          { label: 'Harbourfront', aliases: ['Waterfront', 'Festival'], category: 'district' },
          { label: 'Kensington Market', aliases: ['Vintage Shops', 'Street Art'], category: 'district' },
          { label: 'Hockey Hall of Fame', aliases: ['Maple Leafs', 'Stanley Cup'], category: 'attraction' }
        ]
      },
      // London tags
      {
        cityId: 11,
        tags: [
          { label: 'Big Ben', aliases: ['Parliament', 'Westminster'], category: 'attraction' },
          { label: 'Tower of London', aliases: ['Crown Jewels', 'Beefeaters'], category: 'attraction' },
          { label: 'British Museum', aliases: ['Rosetta Stone', 'Egyptian Mummies'], category: 'attraction' },
          { label: 'Buckingham Palace', aliases: ['Changing of the Guard', 'Royal'], category: 'attraction' },
          { label: 'London Eye', aliases: ['Millennium Wheel', 'Thames View'], category: 'attraction' },
          { label: 'West End Theatre', aliases: ['Musical', 'Covent Garden'], category: 'experience' },
          { label: 'Camden Market', aliases: ['Alternative', 'Street Food'], category: 'district' },
          { label: 'Hyde Park', aliases: ["Speaker's Corner", 'Serpentine'], category: 'attraction' },
          { label: 'Tower Bridge', aliases: ['Thames', 'Glass Floor'], category: 'attraction' },
          { label: 'Notting Hill', aliases: ['Portobello Road', 'Carnival'], category: 'district' }
        ]
      },
      // Paris tags
      {
        cityId: 12,
        tags: [
          { label: 'Eiffel Tower', aliases: ['Tour Eiffel', 'Iron Lady'], category: 'attraction' },
          { label: 'Louvre Museum', aliases: ['Mona Lisa', 'Musée du Louvre'], category: 'attraction' },
          { label: 'Notre-Dame', aliases: ['Cathedral', 'Île de la Cité'], category: 'attraction' },
          { label: 'Arc de Triomphe', aliases: ['Champs-Élysées', 'Arch'], category: 'attraction' },
          { label: 'Montmartre', aliases: ['Sacré-Cœur', 'Artists Quarter'], category: 'district' },
          { label: 'Versailles', aliases: ['Palace', 'Gardens'], category: 'experience' },
          { label: 'Seine River Cruise', aliases: ['Bateaux', 'River Tour'], category: 'experience' },
          { label: 'Latin Quarter', aliases: ['Quartier Latin', 'Sorbonne'], category: 'district' },
          { label: 'Marais District', aliases: ['Jewish Quarter', 'Place des Vosges'], category: 'district' },
          { label: 'French Cuisine', aliases: ['Bistro', 'Croissant', 'Wine'], category: 'food' }
        ]
      },
      // Rome tags
      {
        cityId: 13,
        tags: [
          { label: 'Colosseum', aliases: ['Colosseo', 'Gladiators'], category: 'attraction' },
          { label: 'Vatican City', aliases: ['Sistine Chapel', "St. Peter's"], category: 'attraction' },
          { label: 'Trevi Fountain', aliases: ['Fontana di Trevi', 'Coins'], category: 'attraction' },
          { label: 'Roman Forum', aliases: ['Foro Romano', 'Palatine Hill'], category: 'attraction' },
          { label: 'Pantheon', aliases: ['Ancient Temple', 'Dome'], category: 'attraction' },
          { label: 'Spanish Steps', aliases: ['Piazza di Spagna', 'Trinità'], category: 'attraction' },
          { label: 'Trastevere', aliases: ['Nightlife', 'Authentic'], category: 'district' },
          { label: 'Villa Borghese', aliases: ['Gardens', 'Gallery'], category: 'attraction' },
          { label: 'Italian Cuisine', aliases: ['Pasta', 'Pizza', 'Gelato'], category: 'food' },
          { label: 'Catacombs', aliases: ['Underground', 'Christian'], category: 'experience' }
        ]
      },
      // Barcelona tags
      {
        cityId: 14,
        tags: [
          { label: 'Sagrada Familia', aliases: ['Gaudí', 'Basilica'], category: 'attraction' },
          { label: 'Park Güell', aliases: ['Mosaic', 'Gaudí Park'], category: 'attraction' },
          { label: 'La Rambla', aliases: ['Las Ramblas', 'Pedestrian Street'], category: 'district' },
          { label: 'Gothic Quarter', aliases: ['Barri Gòtic', 'Medieval'], category: 'district' },
          { label: 'Camp Nou', aliases: ['FC Barcelona', 'Football'], category: 'attraction' },
          { label: 'Barceloneta Beach', aliases: ['Beach', 'Mediterranean'], category: 'experience' },
          { label: 'Montjuïc', aliases: ['Magic Fountain', 'Cable Car'], category: 'attraction' },
          { label: 'Tapas Tour', aliases: ['Pintxos', 'Spanish Food'], category: 'food' },
          { label: 'Casa Batlló', aliases: ['Gaudí House', 'Modernisme'], category: 'attraction' },
          { label: 'Picasso Museum', aliases: ['Museu Picasso', 'Art'], category: 'attraction' }
        ]
      },
      // Berlin tags
      {
        cityId: 15,
        tags: [
          { label: 'Brandenburg Gate', aliases: ['Brandenburger Tor', 'Victory'], category: 'attraction' },
          { label: 'Berlin Wall', aliases: ['East Side Gallery', 'Checkpoint Charlie'], category: 'attraction' },
          { label: 'Museum Island', aliases: ['Museumsinsel', 'Pergamon'], category: 'attraction' },
          { label: 'Reichstag', aliases: ['Parliament', 'Glass Dome'], category: 'attraction' },
          { label: 'Tiergarten', aliases: ['Park', 'Victory Column'], category: 'attraction' },
          { label: 'Kreuzberg', aliases: ['Alternative', 'Turkish Market'], category: 'district' },
          { label: 'Prenzlauer Berg', aliases: ['Trendy', 'Cafes'], category: 'district' },
          { label: 'TV Tower', aliases: ['Fernsehturm', 'Alexanderplatz'], category: 'attraction' },
          { label: 'Jewish Museum', aliases: ['Holocaust Memorial', 'History'], category: 'attraction' },
          { label: 'Berlin Nightlife', aliases: ['Berghain', 'Techno'], category: 'experience' }
        ]
      },
      // Sydney tags
      {
        cityId: 16,
        tags: [
          { label: 'Sydney Opera House', aliases: ['Harbour', 'Performance'], category: 'attraction' },
          { label: 'Harbour Bridge', aliases: ['BridgeClimb', 'Coathanger'], category: 'attraction' },
          { label: 'Bondi Beach', aliases: ['Surfing', 'Coastal Walk'], category: 'experience' },
          { label: 'The Rocks', aliases: ['Historic', 'Weekend Market'], category: 'district' },
          { label: 'Darling Harbour', aliases: ['Waterfront', 'Aquarium'], category: 'district' },
          { label: 'Blue Mountains', aliases: ['Three Sisters', 'Scenic World'], category: 'experience' },
          { label: 'Manly Beach', aliases: ['Ferry', 'Northern Beaches'], category: 'experience' },
          { label: 'Taronga Zoo', aliases: ['Wildlife', 'Harbour Views'], category: 'attraction' },
          { label: 'Royal Botanic Gardens', aliases: ['Mrs Macquarie', 'Gardens'], category: 'attraction' },
          { label: 'Surry Hills', aliases: ['Cafes', 'Vintage Shopping'], category: 'district' }
        ]
      },
      // Melbourne tags
      {
        cityId: 17,
        tags: [
          { label: 'Federation Square', aliases: ['Fed Square', 'ACMI'], category: 'attraction' },
          { label: 'Laneways', aliases: ['Street Art', 'Hidden Cafes'], category: 'experience' },
          { label: 'Queen Victoria Market', aliases: ['QVM', 'Fresh Produce'], category: 'experience' },
          { label: 'Great Ocean Road', aliases: ['Twelve Apostles', 'Coastal Drive'], category: 'experience' },
          { label: 'St Kilda', aliases: ['Beach', 'Luna Park'], category: 'district' },
          { label: 'Melbourne Cricket Ground', aliases: ['MCG', 'AFL'], category: 'attraction' },
          { label: 'Royal Botanic Gardens', aliases: ['Gardens', 'Lake'], category: 'attraction' },
          { label: 'Fitzroy', aliases: ['Hipster', 'Brunswick Street'], category: 'district' },
          { label: 'Coffee Culture', aliases: ['Flat White', 'Cafe Scene'], category: 'food' },
          { label: 'Yarra Valley', aliases: ['Wine Region', 'Vineyards'], category: 'experience' }
        ]
      },
      // Rio de Janeiro tags
      {
        cityId: 18,
        tags: [
          { label: 'Christ the Redeemer', aliases: ['Cristo Redentor', 'Corcovado'], category: 'attraction' },
          { label: 'Copacabana Beach', aliases: ['Beach', 'Promenade'], category: 'experience' },
          { label: 'Sugarloaf Mountain', aliases: ['Pão de Açúcar', 'Cable Car'], category: 'attraction' },
          { label: 'Ipanema Beach', aliases: ['Beach', 'Sunset'], category: 'experience' },
          { label: 'Lapa', aliases: ['Nightlife', 'Selarón Steps'], category: 'district' },
          { label: 'Santa Teresa', aliases: ['Bohemian', 'Tram'], category: 'district' },
          { label: 'Maracanã Stadium', aliases: ['Football', 'Soccer'], category: 'attraction' },
          { label: 'Tijuca Forest', aliases: ['National Park', 'Waterfalls'], category: 'experience' },
          { label: 'Carnival', aliases: ['Samba', 'Parade'], category: 'experience' },
          { label: 'Brazilian BBQ', aliases: ['Churrascaria', 'Rodizio'], category: 'food' }
        ]
      },
      // Buenos Aires tags
      {
        cityId: 19,
        tags: [
          { label: 'La Boca', aliases: ['Caminito', 'Colorful Houses'], category: 'district' },
          { label: 'Recoleta Cemetery', aliases: ['Evita', 'Mausoleums'], category: 'attraction' },
          { label: 'Palermo', aliases: ['Parks', 'Trendy Restaurants'], category: 'district' },
          { label: 'Tango Show', aliases: ['Dance', 'Milonga'], category: 'experience' },
          { label: 'San Telmo', aliases: ['Antiques', 'Sunday Market'], category: 'district' },
          { label: 'Teatro Colón', aliases: ['Opera House', 'Performance'], category: 'attraction' },
          { label: 'Plaza de Mayo', aliases: ['Casa Rosada', 'History'], category: 'attraction' },
          { label: 'Puerto Madero', aliases: ['Waterfront', 'Modern'], category: 'district' },
          { label: 'Steak Houses', aliases: ['Parrilla', 'Asado'], category: 'food' },
          { label: 'MALBA Museum', aliases: ['Modern Art', 'Latin American'], category: 'attraction' }
        ]
      },
      // Dubai tags
      {
        cityId: 20,
        tags: [
          { label: 'Burj Khalifa', aliases: ['Tallest Building', 'At The Top'], category: 'attraction' },
          { label: 'Dubai Mall', aliases: ['Shopping', 'Aquarium'], category: 'experience' },
          { label: 'Burj Al Arab', aliases: ['7-Star Hotel', 'Luxury'], category: 'attraction' },
          { label: 'Desert Safari', aliases: ['Dune Bashing', 'Camel Ride'], category: 'experience' },
          { label: 'Dubai Marina', aliases: ['JBR Beach', 'Walk'], category: 'district' },
          { label: 'Gold Souk', aliases: ['Traditional Market', 'Spice Souk'], category: 'experience' },
          { label: 'Palm Jumeirah', aliases: ['Atlantis', 'Man-made Island'], category: 'attraction' },
          { label: 'Dubai Frame', aliases: ['Old vs New', 'Observatory'], category: 'attraction' },
          { label: 'Global Village', aliases: ['Cultural Park', 'Festival'], category: 'experience' },
          { label: 'Dubai Creek', aliases: ['Abra Ride', 'Old Dubai'], category: 'experience' }
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
