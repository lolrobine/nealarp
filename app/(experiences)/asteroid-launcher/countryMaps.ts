export type CountryMapDef = {
  id: string;
  name: string;
  flag: string;
  capital: string;
  bounds: { north: number; south: number; west: number; east: number };
  center: { lat: number; lng: number };
  image: string;
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
  // New maps - more popular countries
  {
    id: "italy",
    name: "Italy",
    flag: "🇮🇹",
    capital: "Rome",
    bounds: { north: 47, south: 35, west: 6.6, east: 18.5 },
    center: { lat: 41.9, lng: 12.5 },
    image: "/experiences/asteroid-launcher/country-italy.jpg",
    population: "59M",
  },
  {
    id: "spain",
    name: "Spain",
    flag: "🇪🇸",
    capital: "Madrid",
    bounds: { north: 43.8, south: 35.9, west: -9.3, east: 3.3 },
    center: { lat: 40.4, lng: -3.7 },
    image: "/experiences/asteroid-launcher/country-spain.jpg",
    population: "47M",
  },
  {
    id: "indonesia",
    name: "Indonesia",
    flag: "🇮🇩",
    capital: "Jakarta",
    bounds: { north: 6, south: -11, west: 95, east: 141 },
    center: { lat: -0.7, lng: 113.9 },
    image: "/experiences/asteroid-launcher/country-indonesia.jpg",
    population: "275M",
  },
  {
    id: "pakistan",
    name: "Pakistan",
    flag: "🇵🇰",
    capital: "Islamabad",
    bounds: { north: 37, south: 23.5, west: 60.8, east: 77.8 },
    center: { lat: 30.3, lng: 69.3 },
    image: "/experiences/asteroid-launcher/country-pakistan.jpg",
    population: "231M",
  },
  {
    id: "nigeria",
    name: "Nigeria",
    flag: "🇳🇬",
    capital: "Abuja",
    bounds: { north: 13.9, south: 4.2, west: 2.7, east: 14.6 },
    center: { lat: 9, lng: 8 },
    image: "/experiences/asteroid-launcher/country-nigeria.jpg",
    population: "218M",
  },
  {
    id: "egypt",
    name: "Egypt",
    flag: "🇪🇬",
    capital: "Cairo",
    bounds: { north: 31.7, south: 22, west: 24.7, east: 36.9 },
    center: { lat: 26.8, lng: 30.8 },
    image: "/experiences/asteroid-launcher/country-egypt.jpg",
    population: "104M",
  },
  {
    id: "turkey",
    name: "Turkey",
    flag: "🇹🇷",
    capital: "Ankara",
    bounds: { north: 42, south: 35.8, west: 26, east: 45 },
    center: { lat: 38.9, lng: 35.2 },
    image: "/experiences/asteroid-launcher/country-turkey.jpg",
    population: "85M",
  },
  {
    id: "argentina",
    name: "Argentina",
    flag: "🇦🇷",
    capital: "Buenos Aires",
    bounds: { north: -21.7, south: -55, west: -73.5, east: -53.6 },
    center: { lat: -38.4, lng: -63.6 },
    image: "/experiences/asteroid-launcher/country-argentina.jpg",
    population: "46M",
  },
  {
    id: "southkorea",
    name: "South Korea",
    flag: "🇰🇷",
    capital: "Seoul",
    bounds: { north: 38.6, south: 33, west: 124.5, east: 131 },
    center: { lat: 35.9, lng: 127.7 },
    image: "/experiences/asteroid-launcher/country-southkorea.jpg",
    population: "52M",
  },
  {
    id: "thailand",
    name: "Thailand",
    flag: "🇹🇭",
    capital: "Bangkok",
    bounds: { north: 20.4, south: 5.6, west: 97.3, east: 105.6 },
    center: { lat: 15.8, lng: 100.9 },
    image: "/experiences/asteroid-launcher/country-thailand.jpg",
    population: "70M",
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
