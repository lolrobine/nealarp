export type CountryMapDef = {
  id: string;
  name: string;
  flag: string;
  capital: string;
  bounds: {
    north: number; // max lat
    south: number; // min lat
    west: number; // min lng
    east: number; // max lng
  };
  center: { lat: number; lng: number };
  image: string; // path under /experiences/asteroid-launcher/
  population: string;
};

export const popularCountries: CountryMapDef[] = [
  {
    id: "usa",
    name: "USA",
    flag: "🇺🇸",
    capital: "Washington DC",
    bounds: { north: 49.38, south: 24.39, west: -125, east: -66.9 },
    center: { lat: 39.8, lng: -98.5 },
    image: "/experiences/asteroid-launcher/country-usa.jpg",
    population: "340M",
  },
  {
    id: "china",
    name: "China",
    flag: "🇨🇳",
    capital: "Beijing",
    bounds: { north: 53.55, south: 18.15, west: 73.5, east: 135 },
    center: { lat: 35, lng: 104 },
    image: "/experiences/asteroid-launcher/country-china.jpg",
    population: "1.4B",
  },
  {
    id: "india",
    name: "India",
    flag: "🇮🇳",
    capital: "New Delhi",
    bounds: { north: 35.5, south: 6.5, west: 68, east: 97.5 },
    center: { lat: 20.5, lng: 78.9 },
    image: "/experiences/asteroid-launcher/country-india.jpg",
    population: "1.4B",
  },
  {
    id: "brazil",
    name: "Brazil",
    flag: "🇧🇷",
    capital: "Brasília",
    bounds: { north: 5.2, south: -33.7, west: -73.9, east: -34.7 },
    center: { lat: -14.2, lng: -51.9 },
    image: "/experiences/asteroid-launcher/country-brazil.jpg",
    population: "215M",
  },
  {
    id: "russia",
    name: "Russia",
    flag: "🇷🇺",
    capital: "Moscow",
    bounds: { north: 81.8, south: 41.1, west: 19, east: 180 },
    center: { lat: 61, lng: 105 },
    image: "/experiences/asteroid-launcher/country-russia.jpg",
    population: "146M",
  },
  {
    id: "canada",
    name: "Canada",
    flag: "🇨🇦",
    capital: "Ottawa",
    bounds: { north: 83, south: 41.6, west: -141, east: -52 },
    center: { lat: 56, lng: -106 },
    image: "/experiences/asteroid-launcher/country-canada.jpg",
    population: "40M",
  },
  {
    id: "australia",
    name: "Australia",
    flag: "🇦🇺",
    capital: "Canberra",
    bounds: { north: -10, south: -43.6, west: 113, east: 154 },
    center: { lat: -25.2, lng: 133.7 },
    image: "/experiences/asteroid-launcher/country-australia.jpg",
    population: "26M",
  },
  {
    id: "uk",
    name: "United Kingdom",
    flag: "🇬🇧",
    capital: "London",
    bounds: { north: 60.8, south: 49.9, west: -8.6, east: 1.8 },
    center: { lat: 55.3, lng: -3.4 },
    image: "/experiences/asteroid-launcher/country-uk.jpg",
    population: "67M",
  },
  {
    id: "germany",
    name: "Germany",
    flag: "🇩🇪",
    capital: "Berlin",
    bounds: { north: 55, south: 47.2, west: 5.8, east: 15 },
    center: { lat: 51.1, lng: 10.4 },
    image: "/experiences/asteroid-launcher/country-germany.jpg",
    population: "84M",
  },
  {
    id: "france",
    name: "France",
    flag: "🇫🇷",
    capital: "Paris",
    bounds: { north: 51, south: 41.3, west: -5, east: 9.5 },
    center: { lat: 46.2, lng: 2.2 },
    image: "/experiences/asteroid-launcher/country-france.jpg",
    population: "68M",
  },
  {
    id: "japan",
    name: "Japan",
    flag: "🇯🇵",
    capital: "Tokyo",
    bounds: { north: 45.5, south: 24, west: 122.9, east: 145.8 },
    center: { lat: 36.2, lng: 138.2 },
    image: "/experiences/asteroid-launcher/country-japan.jpg",
    population: "125M",
  },
  {
    id: "mexico",
    name: "Mexico",
    flag: "🇲🇽",
    capital: "Mexico City",
    bounds: { north: 32.7, south: 14.5, west: -117, east: -86.7 },
    center: { lat: 23.6, lng: -102.5 },
    image: "/experiences/asteroid-launcher/country-mexico.jpg",
    population: "128M",
  },
];

export function latLngToPct(lat: number, lng: number, bounds: CountryMapDef["bounds"]) {
  const x = ((lng - bounds.west) / (bounds.east - bounds.west)) * 100;
  const y = ((bounds.north - lat) / (bounds.north - bounds.south)) * 100;
  return { x, y };
}

export function pctToLatLngCountry(xPct: number, yPct: number, bounds: CountryMapDef["bounds"]) {
  const lng = bounds.west + (xPct / 100) * (bounds.east - bounds.west);
  const lat = bounds.north - (yPct / 100) * (bounds.north - bounds.south);
  return { lat, lng };
}

export function isInBounds(lat: number, lng: number, bounds: CountryMapDef["bounds"]) {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east;
}
