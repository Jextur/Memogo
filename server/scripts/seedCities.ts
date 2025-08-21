import { db } from '../db';
import { cities } from '@shared/schema';
import { CityService } from '../services/cityService';

const cityService = new CityService();

// Curated cities database - 5-8 major cities per country
const CURATED_CITIES = {
  // Asia Pacific
  'JP': [
    { name: 'Tokyo', placeId: 'ChIJXSModoWLGGARILWiCfeu2M0' },
    { name: 'Osaka', placeId: 'ChIJ4eIGNFXmAGAR5y9q5G7BW8U' },
    { name: 'Kyoto', placeId: 'ChIJ8cM8zdaoAWARPR27azYdlsA' },
    { name: 'Okinawa', placeId: 'ChIJ51ur7mJw9TQRBYPQqUlkxCk' },
    { name: 'Sapporo', placeId: 'ChIJybDUYxLpC18RPLUIIDM1VDI' },
    { name: 'Hakodate', placeId: 'ChIJXcmNtYvyl18RlO6L1JEJpSM' },
    { name: 'Fukuoka', placeId: 'ChIJGZv0BW6QQTURh-C95XOPiD0' },
    { name: 'Nagoya', placeId: 'ChIJKwtT0WNwA2ARJKBi_Pw0vqg' },
    { name: 'Yokohama', placeId: 'ChIJm6cXLsoGGGARk-ngTygtEtY' },
  ],
  'KR': [
    { name: 'Seoul', placeId: 'ChIJzWXFYYuifDUR64Pq5LTtioU' },
    { name: 'Busan', placeId: 'ChIJNc0j6G3raDURpwhxJHTL2DU' },
    { name: 'Jeju', placeId: 'ChIJRUDITFTjDDURMb8emNI2vGY' },
    { name: 'Incheon', placeId: 'ChIJQ-XjI24RezURDZsv2p0rsQI' },
    { name: 'Daegu', placeId: 'ChIJAzRoxG_hZjURpBnvzy0FqKk' },
    { name: 'Gyeongju', placeId: 'ChIJyfAMZbUZZjURcv8aNtLodGo' },
  ],
  'CN': [
    { name: 'Beijing', placeId: 'ChIJuSwU55ZS8DURiqkPryBWYrk' },
    { name: 'Shanghai', placeId: 'ChIJMzz1sUBwsjURoWTDI5QSlQI' },
    { name: 'Hong Kong', placeId: 'ChIJD5gyo-3iAzQRfMnq27qzivA' },
    { name: 'Shenzhen', placeId: 'ChIJkVLh0Aj0AzQRyYCStw1V7v0' },
    { name: 'Guangzhou', placeId: 'ChIJxytco5X4AjQRFeTqrXXgWQ4' },
    { name: 'Chengdu', placeId: 'ChIJIXdaoxE7KTYRh_6fRhhVQcI' },
    { name: 'Xi\'an', placeId: 'ChIJuResIul5YzYRLliUp_1m1IU' },
  ],
  'TH': [
    { name: 'Bangkok', placeId: 'ChIJ82ENKDJgHTERIEjiXbIAAQE' },
    { name: 'Phuket', placeId: 'ChIJKdgsoyXiUjARIAIbLLWjOLE' },
    { name: 'Chiang Mai', placeId: 'ChIJzzE3FVIh2jAR04p6qmGBk6Q' },
    { name: 'Pattaya', placeId: 'ChIJZeH3cNh44jAR3g-WJZfpkVE' },
    { name: 'Krabi', placeId: 'ChIJYZpqpH4lUTARQKBOhNR3m0c' },
    { name: 'Koh Samui', placeId: 'ChIJf1YQd0oQ4TARMPq0vRslXR0' },
  ],
  'SG': [
    { name: 'Singapore', placeId: 'ChIJyY4rtGcX2jERIKTarqz3AAQ' },
  ],
  'MY': [
    { name: 'Kuala Lumpur', placeId: 'ChIJ5-rvAcdJzDERfBCK0Jkz8fE' },
    { name: 'Penang', placeId: 'ChIJw-3c7rl0SjARDA0SpITjqSE' },
    { name: 'Langkawi', placeId: 'ChIJO1KH2kJUSgYRWAz7CpB5Pu8' },
    { name: 'Malacca', placeId: 'ChIJPVBfyKjs0TERb5tIK9pEY3I' },
    { name: 'Kota Kinabalu', placeId: 'ChIJYQEEE2YxOzIRR5Xct3V9p7c' },
  ],
  'VN': [
    { name: 'Ho Chi Minh City', placeId: 'ChIJ0T2NLikpdTERKxE8d61aX_E' },
    { name: 'Hanoi', placeId: 'ChIJoRyG2ZurNTERqRfKcnt_iOc' },
    { name: 'Da Nang', placeId: 'ChIJEyolAaQZQjERJYvnfEoOeJc' },
    { name: 'Hoi An', placeId: 'ChIJSZJ1aqQOQjERNrNZxnOWE18' },
    { name: 'Nha Trang', placeId: 'ChIJP7yveDhncDERxhJEbzWkGEo' },
    { name: 'Phu Quoc', placeId: 'ChIJJ7cNgvzRoTERaEH5c3ZJBwc' },
  ],
  'ID': [
    { name: 'Jakarta', placeId: 'ChIJnUvjREdaai4RoobX2g0_V_0' },
    { name: 'Bali', placeId: 'ChIJoQ8Q6NNB0S0RkOYkS7EPkSQ' },
    { name: 'Yogyakarta', placeId: 'ChIJxWtbvYdXei4R0Nh0M85QdFE' },
    { name: 'Surabaya', placeId: 'ChIJH7Yf_oD51y0RQ1vMYwOrgog' },
    { name: 'Bandung', placeId: 'ChIJX4Gx8eTC1i0R0q5NswFIQlo' },
  ],
  'PH': [
    { name: 'Manila', placeId: 'ChIJi8MeVwPKlzMRH8FpEHXV0Wk' },
    { name: 'Cebu', placeId: 'ChIJY96HXyWZqTMRKG4K8jq8wHs' },
    { name: 'Boracay', placeId: 'ChIJK8H0cOpzvDMRm0GbUQHy5pw' },
    { name: 'Palawan', placeId: 'ChIJO25BW_NHuDMRCGuxJOIfK7M' },
    { name: 'Davao', placeId: 'ChIJy4cQ5K5v-jIRdEE6AOJSRWI' },
  ],
  'IN': [
    { name: 'New Delhi', placeId: 'ChIJLbZ-NFv9DDkRzk0gTkm3wlI' },
    { name: 'Mumbai', placeId: 'ChIJwe1EZjDG5zsRaYxkjY_tpF0' },
    { name: 'Goa', placeId: 'ChIJQbc2YxC6vzsRkkDzLC0-AHU' },
    { name: 'Jaipur', placeId: 'ChIJgeJXTN9KbDkRCS7yDDrG4Qw' },
    { name: 'Kerala', placeId: 'ChIJW_Wc1P8SCDsRSGlJ6L5fBGI' },
    { name: 'Agra', placeId: 'ChIJZ_Q5TwWCDTkRRiNO5xOojws' },
    { name: 'Bangalore', placeId: 'ChIJbU60yXAWrjsR4E9-UejD3_g' },
  ],
  
  // Europe
  'GB': [
    { name: 'London', placeId: 'ChIJdd4hrwug2EcRmSrV3Vo6llI' },
    { name: 'Edinburgh', placeId: 'ChIJIyaYpQC4h0gRJxfnfHsU8mQ' },
    { name: 'Manchester', placeId: 'ChIJ2_UmUkxNekgRqmv-BDgUvtk' },
    { name: 'Liverpool', placeId: 'ChIJt2BwZIrfekgRAW4XP28E3EI' },
    { name: 'Oxford', placeId: 'ChIJrx_ErYAzcUgRAnRUy6jbIMg' },
    { name: 'Cambridge', placeId: 'ChIJLQEq84ld2EcRIT1eo-Ego2M' },
  ],
  'FR': [
    { name: 'Paris', placeId: 'ChIJD7fiBh9u5kcRYJSMaMOCCwQ' },
    { name: 'Nice', placeId: 'ChIJMS2FahDQzRIRcJaX5CqrKAE' },
    { name: 'Lyon', placeId: 'ChIJl4foalHq9EcR8CG75CqrCAQ' },
    { name: 'Marseille', placeId: 'ChIJM1PaREO_yRIRIAKX_aUZCAQ' },
    { name: 'Bordeaux', placeId: 'ChIJWcbCyuyxVQ0R0IpqBl6kstE' },
  ],
  'DE': [
    { name: 'Berlin', placeId: 'ChIJAVkDPzdOqEcRcDteW0YgIQQ' },
    { name: 'Munich', placeId: 'ChIJ2V-Mo_l1nkcRfZixfUq4DAE' },
    { name: 'Frankfurt', placeId: 'ChIJxZZwR28JvUcRAMawKVBDIgQ' },
    { name: 'Hamburg', placeId: 'ChIJuRMYfoNhsUcRoDrWe_I9JgQ' },
    { name: 'Cologne', placeId: 'ChIJ5S-raZElv0cR8HcqSvxgJwQ' },
  ],
  'IT': [
    { name: 'Rome', placeId: 'ChIJu46S-ZZhLxMROG5lkwZ3D7k' },
    { name: 'Venice', placeId: 'ChIJiT3W8dqxfkcRLxCSvfDGo3s' },
    { name: 'Florence', placeId: 'ChIJrdbSgKZWKhMRAyrH7xd51ZM' },
    { name: 'Milan', placeId: 'ChIJ53USP0nBhkcRjQ50xhPN_zw' },
    { name: 'Naples', placeId: 'ChIJZ2Xh5U4IOxMRYLkHAQoTr0w' },
    { name: 'Sicily', placeId: 'ChIJBc4YvhFWGRMRFt3rGxQ7Vyg' },
  ],
  'ES': [
    { name: 'Madrid', placeId: 'ChIJgTwKgJcpQg0RaSKMYcHeNsQ' },
    { name: 'Barcelona', placeId: 'ChIJ5TCOcRaYpBIRCmZHTz37sEQ' },
    { name: 'Seville', placeId: 'ChIJkWK-FBFsEg0RSFb-HGIY8DQ' },
    { name: 'Valencia', placeId: 'ChIJb7Dv8ExPYA0ROR1_HwFRo7Q' },
    { name: 'Malaga', placeId: 'ChIJUdEwjWn2cg0RgOZ2pXjSAwQ' },
    { name: 'Ibiza', placeId: 'ChIJm2Y9hdcZkRIRYMN3swVZQmg' },
  ],
  'PT': [
    { name: 'Lisbon', placeId: 'ChIJO_PkYRozGQ0R0DaQ5L3rAAQ' },
    { name: 'Porto', placeId: 'ChIJwVPhxKtlJA0RvCxypRkLAh8' },
    { name: 'Faro', placeId: 'ChIJl_BVJzKBGw0RhNhRRjNAVmo' },
    { name: 'Madeira', placeId: 'ChIJMwynL7jUWgsRGoGyIhXD2eE' },
  ],
  'NL': [
    { name: 'Amsterdam', placeId: 'ChIJVXealLU_xkcRja_At0z9AGY' },
    { name: 'Rotterdam', placeId: 'ChIJfcRmD9i9xUcRN2X86zYgVqE' },
    { name: 'The Hague', placeId: 'ChIJN-A4bQy4xUcRqQFPJVSMrRI' },
    { name: 'Utrecht', placeId: 'ChIJNy3TOUNvxkcRHTiOySeoJCA' },
  ],
  'BE': [
    { name: 'Brussels', placeId: 'ChIJ_58qNMXEw0cRTLJJ4hOg7Tc' },
    { name: 'Bruges', placeId: 'ChIJ7fjtOOcvw0cR7UfUaGItnWQ' },
    { name: 'Antwerp', placeId: 'ChIJwxmQQeP3w0cR9SIDQOLesDM' },
    { name: 'Ghent', placeId: 'ChIJrUOqZ-luw0cRr-PZPClWABY' },
  ],
  'CH': [
    { name: 'Zurich', placeId: 'ChIJGaK-SZcLkEcRA9wf5_GNbuY' },
    { name: 'Geneva', placeId: 'ChIJ6-LQkwZljEcRObwLezWVtqA' },
    { name: 'Interlaken', placeId: 'ChIJhZnA0yntj0cR0IpqBl6kstE' },
    { name: 'Lucerne', placeId: 'ChIJAYvjEZJNkEcRYFq0TaJjlkQ' },
    { name: 'Zermatt', placeId: 'ChIJT3HCe0v9ikcRGD3wCaKDfWo' },
  ],
  'AT': [
    { name: 'Vienna', placeId: 'ChIJn8o2UZ4HbUcRLIiOa8HQgKI' },
    { name: 'Salzburg', placeId: 'ChIJfyD0NlsYdkcRI5WOn8hC66s' },
    { name: 'Innsbruck', placeId: 'ChIJc8r44c9unkcRDZsdKH0cIJ0' },
  ],
  
  // Americas
  'US': [
    { name: 'New York', placeId: 'ChIJOwg_06VPwokRYv534QaPC8g' },
    { name: 'Los Angeles', placeId: 'ChIJE9on3F3HwoAR9AhGJW_fL-I' },
    { name: 'San Francisco', placeId: 'ChIJIQBpAG2ahYAR_6128GcTUEo' },
    { name: 'Las Vegas', placeId: 'ChIJ0X31pIK3voARo3mz1ebVzDo' },
    { name: 'Miami', placeId: 'ChIJEcHIDqKw2YgRZU-t3XHylv8' },
    { name: 'Chicago', placeId: 'ChIJ7cv00DwsDogRAMDACa2m4K8' },
    { name: 'Seattle', placeId: 'ChIJVTPokywQkFQRmtVEaUZlJRA' },
    { name: 'Dallas', placeId: 'ChIJS5dFe_cZTIYRj2dH9qSb7Lk' },
  ],
  'CA': [
    { name: 'Toronto', placeId: 'ChIJpTvG15DL1IkRd8S0KlBVNTI' },
    { name: 'Vancouver', placeId: 'ChIJs0-pQ_FzhlQRi_OBm-qWkbs' },
    { name: 'Montreal', placeId: 'ChIJDbdkHFQayUwR7-8fITgxTmU' },
    { name: 'Calgary', placeId: 'ChIJ1T-EnwNwcVMROrZStrE7bSY' },
    { name: 'Quebec City', placeId: 'ChIJk4jbBYmWuEwRAzro8GMtxY8' },
  ],
  'MX': [
    { name: 'Mexico City', placeId: 'ChIJB3UJ2yYAzoURQeheJnhNKgQ' },
    { name: 'Cancun', placeId: 'ChIJU2N_06wvTI8R7XLI8GZDFDc' },
    { name: 'Guadalajara', placeId: 'ChIJ46PJ4yjDKIQRK0trCmZ3FoE' },
    { name: 'Oaxaca', placeId: 'ChIJMzz6sVr9xYUR1Y_qyvy0BDg' },
    { name: 'Tulum', placeId: 'ChIJv7uupvN0To8RUjNfvU-g9YE' },
  ],
  'BR': [
    { name: 'Rio de Janeiro', placeId: 'ChIJW6AIkVXemwARTtIvZ2xC3FA' },
    { name: 'São Paulo', placeId: 'ChIJ0WGkg4FEzpQRrlsz_whLqZs' },
    { name: 'Salvador', placeId: 'ChIJJZZ3keyNFgcRS1s9mTg5_UE' },
    { name: 'Brasilia', placeId: 'ChIJyUj0k9SgXpMRBT3XN9qTzWw' },
    { name: 'Florianopolis', placeId: 'ChIJNwpgjJk5J5URqx-XLjwXsno' },
  ],
  
  // Oceania
  'AU': [
    { name: 'Sydney', placeId: 'ChIJP3Sa8ziYEmsRUKgyFmh9AQM' },
    { name: 'Melbourne', placeId: 'ChIJ90260rVG1moRkM2MIXVWBAQ' },
    { name: 'Brisbane', placeId: 'ChIJM9KTrJpXkWsRQK_e81qjAgQ' },
    { name: 'Gold Coast', placeId: 'ChIJt2BdK0PRkWsRcK_e81qjAgM' },
    { name: 'Perth', placeId: 'ChIJP1t_Q0RGMioRLtMkMnJ4AQU' },
    { name: 'Cairns', placeId: 'ChIJqTnRzcKvlmkRhNFQkLJJBQU' },
  ],
  'NZ': [
    { name: 'Auckland', placeId: 'ChIJ--acWvtHDW0RF5miQ2HvAAU' },
    { name: 'Wellington', placeId: 'ChIJy3TpSfyxOG0RcLQTomPvAAo' },
    { name: 'Queenstown', placeId: 'ChIJX96o1_Gd1akRAKB_WNZMaH0' },
    { name: 'Christchurch', placeId: 'ChIJAe3FY0gvMm0RRZl5hIbvAAU' },
    { name: 'Rotorua', placeId: 'ChIJTx5zyEqjbm0RGMQfN2xo6BQ' },
  ],
};

async function seedCities() {
  console.log('🌍 Starting city seeding process...');
  
  let totalCities = 0;
  let successfulSeeds = 0;
  let failedSeeds = 0;
  
  for (const [countryCode, citiesList] of Object.entries(CURATED_CITIES)) {
    console.log(`\n📍 Processing ${countryCode}...`);
    
    for (const city of citiesList) {
      totalCities++;
      
      try {
        // Find country name (simplified mapping)
        const countryNames: Record<string, string> = {
          'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China', 'TH': 'Thailand',
          'SG': 'Singapore', 'MY': 'Malaysia', 'VN': 'Vietnam', 'ID': 'Indonesia',
          'PH': 'Philippines', 'IN': 'India', 'GB': 'United Kingdom', 'FR': 'France',
          'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain', 'PT': 'Portugal',
          'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland', 'AT': 'Austria',
          'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico', 'BR': 'Brazil',
          'AU': 'Australia', 'NZ': 'New Zealand'
        };
        
        // Create city data directly
        const cityData = {
          googlePlaceId: city.placeId,
          cityName: city.name,
          countryCode: countryCode,
          countryName: countryNames[countryCode] || countryCode,
          adminLevel1: city.name === 'Sapporo' || city.name === 'Hakodate' ? 'Hokkaido' : null,
          latitude: '0', // Will be enriched later via Google Places
          longitude: '0',
          isCurated: true,
          popularity: 100, // Curated cities get high popularity
          metadata: null,
          lastValidated: new Date()
        };
        
        // Upsert city to database
        const saved = await cityService.upsertCity(cityData);
        
        if (saved) {
          console.log(`✅ Seeded: ${city.name}, ${countryCode}`);
          successfulSeeds++;
        } else {
          console.log(`⚠️ Failed to save: ${city.name}, ${countryCode}`);
          failedSeeds++;
        }
      } catch (error) {
        console.error(`❌ Error seeding ${city.name}: ${error}`);
        failedSeeds++;
      }
      
      // Rate limiting - pause between API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 City Seeding Complete!');
  console.log(`Total Cities: ${totalCities}`);
  console.log(`✅ Successfully Seeded: ${successfulSeeds}`);
  console.log(`❌ Failed: ${failedSeeds}`);
  console.log('='.repeat(50));
}

// Run the seeding
seedCities()
  .then(() => {
    console.log('✨ Seeding process finished');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Fatal error during seeding:', err);
    process.exit(1);
  });