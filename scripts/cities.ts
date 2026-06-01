// City registry for the OSM scraper. Each city has a bounding box
// (minLng, minLat, maxLng, maxLat). To add a city, copy a bbox from
//   https://boundingbox.klokantech.com  (pick "CSV raw")
// and append a row below.

export interface City {
  slug: string;
  name: string;
  country: string;
  region: string;
  bbox: [number, number, number, number]; // minLng, minLat, maxLng, maxLat
}

export const CITIES: City[] = [
  { slug: 'athens',         name: 'Athens',         country: 'Greece',        region: 'Europe',   bbox: [23.6,  37.9,  23.85, 38.05] },
  { slug: 'thessaloniki',   name: 'Thessaloniki',   country: 'Greece',        region: 'Europe',   bbox: [22.85, 40.55, 23.05, 40.7] },
  { slug: 'london',         name: 'London',         country: 'United Kingdom',region: 'Europe',   bbox: [-0.51, 51.28, 0.33,  51.69] },
  { slug: 'paris',          name: 'Paris',          country: 'France',        region: 'Europe',   bbox: [2.22,  48.81, 2.47,  48.91] },
  { slug: 'berlin',         name: 'Berlin',         country: 'Germany',       region: 'Europe',   bbox: [13.1,  52.34, 13.76, 52.68] },
  { slug: 'amsterdam',      name: 'Amsterdam',      country: 'Netherlands',   region: 'Europe',   bbox: [4.73,  52.28, 5.07,  52.43] },
  { slug: 'barcelona',      name: 'Barcelona',      country: 'Spain',         region: 'Europe',   bbox: [2.05,  41.32, 2.23,  41.47] },
  { slug: 'madrid',         name: 'Madrid',         country: 'Spain',         region: 'Europe',   bbox: [-3.83, 40.31, -3.52, 40.56] },
  { slug: 'lisbon',         name: 'Lisbon',         country: 'Portugal',      region: 'Europe',   bbox: [-9.23, 38.69, -9.09, 38.80] },
  { slug: 'rome',           name: 'Rome',           country: 'Italy',         region: 'Europe',   bbox: [12.34, 41.79, 12.62, 41.99] },
  { slug: 'milan',          name: 'Milan',          country: 'Italy',         region: 'Europe',   bbox: [9.04,  45.39, 9.28,  45.54] },
  { slug: 'vienna',         name: 'Vienna',         country: 'Austria',       region: 'Europe',   bbox: [16.18, 48.12, 16.58, 48.32] },
  { slug: 'prague',         name: 'Prague',         country: 'Czech Republic',region: 'Europe',   bbox: [14.22, 49.94, 14.71, 50.18] },
  { slug: 'budapest',       name: 'Budapest',       country: 'Hungary',       region: 'Europe',   bbox: [18.93, 47.39, 19.33, 47.61] },
  { slug: 'warsaw',         name: 'Warsaw',         country: 'Poland',        region: 'Europe',   bbox: [20.85, 52.10, 21.27, 52.37] },
  { slug: 'stockholm',      name: 'Stockholm',      country: 'Sweden',        region: 'Europe',   bbox: [17.84, 59.24, 18.20, 59.43] },
  { slug: 'copenhagen',     name: 'Copenhagen',     country: 'Denmark',       region: 'Europe',   bbox: [12.45, 55.61, 12.70, 55.73] },
  { slug: 'dublin',         name: 'Dublin',         country: 'Ireland',       region: 'Europe',   bbox: [-6.39, 53.30, -6.10, 53.42] },
  { slug: 'istanbul',       name: 'Istanbul',       country: 'Turkey',        region: 'Europe',   bbox: [28.74, 40.81, 29.42, 41.20] },
  { slug: 'new-york',       name: 'New York',       country: 'United States', region: 'Americas', bbox: [-74.26,40.49,-73.70,40.92] },
  { slug: 'san-francisco',  name: 'San Francisco',  country: 'United States', region: 'Americas', bbox: [-122.52,37.70,-122.35,37.83] },
  { slug: 'los-angeles',    name: 'Los Angeles',    country: 'United States', region: 'Americas', bbox: [-118.67,33.70,-118.16,34.34] },
  { slug: 'chicago',        name: 'Chicago',        country: 'United States', region: 'Americas', bbox: [-87.94,41.64,-87.52,42.02] },
  { slug: 'toronto',        name: 'Toronto',        country: 'Canada',        region: 'Americas', bbox: [-79.64,43.58,-79.12,43.86] },
  { slug: 'mexico-city',    name: 'Mexico City',    country: 'Mexico',        region: 'Americas', bbox: [-99.36,19.18,-98.94,19.59] },
  { slug: 'buenos-aires',   name: 'Buenos Aires',   country: 'Argentina',     region: 'Americas', bbox: [-58.53,-34.71,-58.34,-34.53] },
  { slug: 'sao-paulo',      name: 'São Paulo',      country: 'Brazil',        region: 'Americas', bbox: [-46.83,-23.78,-46.36,-23.40] },
  { slug: 'rio',            name: 'Rio de Janeiro', country: 'Brazil',        region: 'Americas', bbox: [-43.80,-23.08,-43.10,-22.75] },
  { slug: 'tokyo',          name: 'Tokyo',          country: 'Japan',         region: 'Asia',     bbox: [139.56,35.52,139.92,35.82] },
  { slug: 'osaka',          name: 'Osaka',          country: 'Japan',         region: 'Asia',     bbox: [135.40,34.55,135.65,34.78] },
  { slug: 'seoul',          name: 'Seoul',          country: 'South Korea',   region: 'Asia',     bbox: [126.76,37.43,127.18,37.70] },
  { slug: 'bangkok',        name: 'Bangkok',        country: 'Thailand',      region: 'Asia',     bbox: [100.32,13.55,100.93,13.96] },
  { slug: 'singapore',      name: 'Singapore',      country: 'Singapore',     region: 'Asia',     bbox: [103.60,1.20, 104.04,1.47] },
  { slug: 'hong-kong',      name: 'Hong Kong',      country: 'Hong Kong',     region: 'Asia',     bbox: [113.83,22.15,114.41,22.57] },
  { slug: 'taipei',         name: 'Taipei',         country: 'Taiwan',        region: 'Asia',     bbox: [121.46,25.00,121.66,25.21] },
  { slug: 'shanghai',       name: 'Shanghai',       country: 'China',         region: 'Asia',     bbox: [121.20,31.00,121.80,31.40] },
  { slug: 'beijing',        name: 'Beijing',        country: 'China',         region: 'Asia',     bbox: [116.10,39.75,116.65,40.10] },
  { slug: 'mumbai',         name: 'Mumbai',         country: 'India',         region: 'Asia',     bbox: [72.78, 18.89, 72.99, 19.27] },
  { slug: 'delhi',          name: 'Delhi',          country: 'India',         region: 'Asia',     bbox: [76.84, 28.40, 77.35, 28.88] },
  { slug: 'dubai',          name: 'Dubai',          country: 'UAE',           region: 'Asia',     bbox: [55.10, 25.05, 55.40, 25.34] },
  { slug: 'cairo',          name: 'Cairo',          country: 'Egypt',         region: 'Africa',   bbox: [31.18, 29.96, 31.46, 30.15] },
  { slug: 'cape-town',      name: 'Cape Town',      country: 'South Africa',  region: 'Africa',   bbox: [18.32, -34.20,18.65, -33.85] },
  { slug: 'sydney',         name: 'Sydney',         country: 'Australia',     region: 'Oceania',  bbox: [150.83,-34.06,151.34,-33.71] },
  { slug: 'melbourne',      name: 'Melbourne',      country: 'Australia',     region: 'Oceania',  bbox: [144.75,-37.95,145.20,-37.65] },
  { slug: 'auckland',       name: 'Auckland',       country: 'New Zealand',   region: 'Oceania',  bbox: [174.65,-37.00,174.92,-36.78] },
];
