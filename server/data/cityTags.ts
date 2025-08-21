// City-specific popular attractions and experiences
// These tags help users specify what they want to see/do in each city

export interface CityTags {
  cityName: string;
  countryCode: string;
  tags: string[];
}

export const cityTagsData: CityTags[] = [
  // Japan
  {
    cityName: 'Tokyo',
    countryCode: 'JP',
    tags: ['Tokyo Disneyland', 'Tokyo Tower', 'Akihabara', 'Tsukiji Market', 'Shibuya Crossing', 'Senso-ji Temple', 'TeamLab Planets']
  },
  {
    cityName: 'Kyoto',
    countryCode: 'JP',
    tags: ['Fushimi Inari', 'Golden Pavilion', 'Bamboo Forest', 'Gion District', 'Kiyomizu Temple', 'Traditional Tea Ceremony']
  },
  {
    cityName: 'Osaka',
    countryCode: 'JP',
    tags: ['Osaka Castle', 'Dotonbori', 'Universal Studios', 'Street Food Tour', 'Shinsekai', 'Sumiyoshi Shrine']
  },
  {
    cityName: 'Okinawa',
    countryCode: 'JP',
    tags: ['Churaumi Aquarium', 'Shuri Castle', 'Beach Hopping', 'Snorkeling', 'Island Tours', 'Local Cuisine']
  },
  {
    cityName: 'Sapporo',
    countryCode: 'JP',
    tags: ['Skiing', 'Snow Viewing', 'Sapporo Ramen', 'Snow Festival', 'Beer Museum', 'Odori Park', 'Fresh Seafood', 'Winter Scenery']
  },
  {
    cityName: 'Hakodate',
    countryCode: 'JP',
    tags: ['Hakodate Night View', 'Mount Hakodate', 'Fresh Seafood Market', 'Star-Shaped Fort', 'Hot Springs', 'Historical District', 'Winter Illuminations']
  },
  
  // USA
  {
    cityName: 'New York',
    countryCode: 'US',
    tags: ['Statue of Liberty', 'Broadway Show', 'Times Square', 'Central Park', 'Museums (MoMA/Met)', 'Brooklyn Bridge', 'Foodie Tour']
  },
  {
    cityName: 'Los Angeles',
    countryCode: 'US',
    tags: ['Hollywood Sign', 'Universal Studios', 'Santa Monica Pier', 'Griffith Observatory', 'Beverly Hills', 'Venice Beach', 'Studio Tours']
  },
  {
    cityName: 'San Francisco',
    countryCode: 'US',
    tags: ['Golden Gate Bridge', 'Alcatraz Island', 'Fisherman\'s Wharf', 'Cable Cars', 'Chinatown', 'Tech Tours', 'Wine Country']
  },
  {
    cityName: 'Las Vegas',
    countryCode: 'US',
    tags: ['Casino Experience', 'Shows & Entertainment', 'Grand Canyon Tour', 'Fremont Street', 'High Roller', 'Buffets', 'Nightlife']
  },
  {
    cityName: 'Miami',
    countryCode: 'US',
    tags: ['South Beach', 'Art Deco District', 'Little Havana', 'Everglades Tour', 'Wynwood Walls', 'Cuban Food', 'Nightlife']
  },
  
  // France
  {
    cityName: 'Paris',
    countryCode: 'FR',
    tags: ['Eiffel Tower', 'Louvre Museum', 'Notre-Dame', 'Versailles', 'Montmartre', 'Seine River Cruise', 'French Cuisine']
  },
  {
    cityName: 'Nice',
    countryCode: 'FR',
    tags: ['French Riviera', 'Old Town', 'Beach Clubs', 'Monaco Day Trip', 'Promenade des Anglais', 'Local Markets']
  },
  
  // Italy
  {
    cityName: 'Rome',
    countryCode: 'IT',
    tags: ['Colosseum', 'Vatican City', 'Trevi Fountain', 'Roman Forum', 'Pantheon', 'Trastevere', 'Italian Cuisine']
  },
  {
    cityName: 'Venice',
    countryCode: 'IT',
    tags: ['Gondola Ride', 'St. Mark\'s Square', 'Rialto Bridge', 'Murano Glass', 'Doge\'s Palace', 'Canal Tours']
  },
  {
    cityName: 'Florence',
    countryCode: 'IT',
    tags: ['Uffizi Gallery', 'Duomo', 'Ponte Vecchio', 'Michelangelo\'s David', 'Tuscan Wine', 'Leather Markets']
  },
  
  // Spain
  {
    cityName: 'Barcelona',
    countryCode: 'ES',
    tags: ['Sagrada Familia', 'Park Güell', 'Las Ramblas', 'Gothic Quarter', 'Beach Life', 'Tapas Tour', 'Camp Nou']
  },
  {
    cityName: 'Madrid',
    countryCode: 'ES',
    tags: ['Prado Museum', 'Royal Palace', 'Retiro Park', 'Flamenco Show', 'Tapas Crawl', 'Plaza Mayor', 'Bernabéu Stadium']
  },
  
  // United Kingdom
  {
    cityName: 'London',
    countryCode: 'GB',
    tags: ['Big Ben', 'Tower of London', 'British Museum', 'West End Show', 'Camden Market', 'Afternoon Tea', 'Harry Potter Tour']
  },
  {
    cityName: 'Edinburgh',
    countryCode: 'GB',
    tags: ['Edinburgh Castle', 'Royal Mile', 'Arthur\'s Seat', 'Whisky Tasting', 'Ghost Tours', 'Scottish Highlands']
  },
  
  // Thailand
  {
    cityName: 'Bangkok',
    countryCode: 'TH',
    tags: ['Grand Palace', 'Floating Markets', 'Street Food', 'Temple Tours', 'Chatuchak Market', 'River Cruise', 'Rooftop Bars']
  },
  {
    cityName: 'Phuket',
    countryCode: 'TH',
    tags: ['Island Hopping', 'Beach Clubs', 'Old Town', 'Big Buddha', 'Snorkeling/Diving', 'Night Markets', 'Thai Massage']
  },
  {
    cityName: 'Chiang Mai',
    countryCode: 'TH',
    tags: ['Elephant Sanctuary', 'Temple Circuit', 'Night Bazaar', 'Cooking Class', 'Doi Suthep', 'Jungle Trek', 'Sunday Market']
  },
  
  // Australia
  {
    cityName: 'Sydney',
    countryCode: 'AU',
    tags: ['Opera House', 'Harbour Bridge', 'Bondi Beach', 'Blue Mountains', 'Taronga Zoo', 'Darling Harbour', 'Coastal Walk']
  },
  {
    cityName: 'Melbourne',
    countryCode: 'AU',
    tags: ['Laneways & Coffee', 'Great Ocean Road', 'Queen Victoria Market', 'Street Art', 'Yarra Valley Wine', 'Sports Events']
  },
  
  // Singapore
  {
    cityName: 'Singapore',
    countryCode: 'SG',
    tags: ['Marina Bay Sands', 'Gardens by the Bay', 'Sentosa Island', 'Hawker Centers', 'Orchard Road', 'Chinatown', 'Night Safari']
  },
  
  // Dubai
  {
    cityName: 'Dubai',
    countryCode: 'AE',
    tags: ['Burj Khalifa', 'Desert Safari', 'Dubai Mall', 'Gold Souk', 'Beach Clubs', 'Dubai Fountain', 'Luxury Shopping']
  },
  
  // South Korea
  {
    cityName: 'Seoul',
    countryCode: 'KR',
    tags: ['Gyeongbokgung Palace', 'N Seoul Tower', 'Myeongdong Shopping', 'Bukchon Village', 'K-Pop Experience', 'Street Food', 'DMZ Tour']
  },
  
  // Germany
  {
    cityName: 'Berlin',
    countryCode: 'DE',
    tags: ['Brandenburg Gate', 'Berlin Wall', 'Museum Island', 'Checkpoint Charlie', 'Street Art', 'Beer Gardens', 'Nightlife']
  },
  {
    cityName: 'Munich',
    countryCode: 'DE',
    tags: ['Neuschwanstein Castle', 'Oktoberfest', 'Marienplatz', 'Beer Halls', 'English Garden', 'BMW Museum', 'Day Trips']
  },
  
  // Netherlands
  {
    cityName: 'Amsterdam',
    countryCode: 'NL',
    tags: ['Canal Cruise', 'Anne Frank House', 'Van Gogh Museum', 'Bike Tours', 'Red Light District', 'Cheese Markets', 'Tulip Fields']
  },
  
  // Canada
  {
    cityName: 'Toronto',
    countryCode: 'CA',
    tags: ['CN Tower', 'Niagara Falls', 'Toronto Islands', 'Casa Loma', 'St. Lawrence Market', 'Distillery District', 'Sports Events']
  },
  {
    cityName: 'Vancouver',
    countryCode: 'CA',
    tags: ['Stanley Park', 'Granville Island', 'Capilano Bridge', 'Whistler Day Trip', 'Gastown', 'Sea to Sky', 'Craft Beer']
  },
  
  // Mexico
  {
    cityName: 'Mexico City',
    countryCode: 'MX',
    tags: ['Teotihuacan Pyramids', 'Frida Kahlo Museum', 'Xochimilco', 'Historic Center', 'Street Tacos', 'Chapultepec', 'Lucha Libre']
  },
  {
    cityName: 'Cancun',
    countryCode: 'MX',
    tags: ['Beach Resorts', 'Mayan Ruins', 'Cenotes', 'Isla Mujeres', 'Nightlife', 'Snorkeling/Diving', 'All-Inclusive']
  },
  
  // India
  {
    cityName: 'Delhi',
    countryCode: 'IN',
    tags: ['Red Fort', 'India Gate', 'Qutub Minar', 'Chandni Chowk', 'Lotus Temple', 'Street Food Tour', 'Taj Mahal Day Trip']
  },
  {
    cityName: 'Mumbai',
    countryCode: 'IN',
    tags: ['Gateway of India', 'Marine Drive', 'Elephanta Caves', 'Bollywood Tour', 'Street Food', 'Colonial Architecture', 'Markets']
  },
  
  // Turkey
  {
    cityName: 'Istanbul',
    countryCode: 'TR',
    tags: ['Hagia Sophia', 'Blue Mosque', 'Grand Bazaar', 'Bosphorus Cruise', 'Topkapi Palace', 'Turkish Bath', 'Street Food']
  },
  
  // Egypt
  {
    cityName: 'Cairo',
    countryCode: 'EG',
    tags: ['Pyramids of Giza', 'Egyptian Museum', 'Khan el-Khalili', 'Nile Cruise', 'Coptic Cairo', 'Sound & Light Show', 'Local Markets']
  },
  
  // Greece
  {
    cityName: 'Athens',
    countryCode: 'GR',
    tags: ['Acropolis', 'Parthenon', 'Ancient Agora', 'Plaka District', 'National Gardens', 'Greek Cuisine', 'Day Trips to Islands']
  },
  
  // Brazil
  {
    cityName: 'Rio de Janeiro',
    countryCode: 'BR',
    tags: ['Christ the Redeemer', 'Copacabana Beach', 'Sugarloaf Mountain', 'Carnival', 'Favela Tour', 'Samba Experience', 'Ipanema']
  },
  
  // Argentina
  {
    cityName: 'Buenos Aires',
    countryCode: 'AR',
    tags: ['Tango Show', 'La Boca', 'Recoleta Cemetery', 'Palermo District', 'Steak Houses', 'Wine Tasting', 'San Telmo Market']
  }
];

// Get tags for a specific city
export function getCityTags(cityName: string, countryCode: string): string[] {
  const city = cityTagsData.find(
    c => c.cityName.toLowerCase() === cityName.toLowerCase() && 
         c.countryCode === countryCode
  );
  return city?.tags || [];
}

// Get default generic tags if city not found
export function getDefaultTags(): string[] {
  return ['Must-see Highlights', 'Local Food & Culture', 'Shopping Districts', 'Nature & Parks', 'Museums & Art', 'Nightlife', 'Family Activities'];
}