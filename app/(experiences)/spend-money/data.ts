export type ShopItem = {
  id: string;
  name: string;
  price: number;
  category: string;
  emoji: string;
  description?: string;
};

export type ShopCategory = {
  id: string;
  name: string;
  icon: string;
};

export const categories: ShopCategory[] = [
  { id: "food", name: "Food & Drink", icon: "🍔" },
  { id: "tech", name: "Tech", icon: "💻" },
  { id: "transport", name: "Transportation", icon: "🚗" },
  { id: "luxury", name: "Luxury", icon: "💎" },
  { id: "companies", name: "Companies", icon: "🏢" },
  { id: "mega", name: "Mega Purchases", icon: "🌍" },
];

export const TOTAL_MONEY = 1_000_000_000_000; // 1 trillion

export const items: ShopItem[] = [
  // Food & Drink
  { id: "big-mac", name: "Big Mac", price: 5, category: "food", emoji: "🍔", description: "A classic McDonald's burger" },
  { id: "pizza", name: "Pizza", price: 10, category: "food", emoji: "🍕" },
  { id: "coffee", name: "Fancy Coffee", price: 7, category: "food", emoji: "☕" },
  { id: "avocado-toast", name: "Avocado Toast", price: 15, category: "food", emoji: "🥑" },
  { id: "steak-dinner", name: "Steak Dinner", price: 100, category: "food", emoji: "🥩" },
  { id: "gold-chocolate", name: "Gold Chocolate Bar", price: 150, category: "food", emoji: "🍫" },

  // Tech
  { id: "airpods", name: "AirPods Pro", price: 249, category: "tech", emoji: "🎧" },
  { id: "nintendo-switch", name: "Nintendo Switch", price: 299, category: "tech", emoji: "🎮" },
  { id: "ipad", name: "iPad Pro", price: 1099, category: "tech", emoji: "📱" },
  { id: "macbook", name: "MacBook Pro", price: 2499, category: "tech", emoji: "💻" },
  { id: "gaming-pc", name: "Gaming PC", price: 5000, category: "tech", emoji: "🖥️" },
  { id: "8k-tv", name: "8K TV", price: 15000, category: "tech", emoji: "📺" },
  { id: "tesla-optimus", name: "Tesla Optimus Robot", price: 20000, category: "tech", emoji: "🤖" },

  // Transportation
  { id: "used-car", name: "Used Car", price: 10000, category: "transport", emoji: "🚙" },
  { id: "tesla", name: "Tesla Model S", price: 89990, category: "transport", emoji: "🚗" },
  { id: "porsche", name: "Porsche 911", price: 150000, category: "transport", emoji: "🏎️" },
  { id: "ferrari", name: "Ferrari", price: 300000, category: "transport", emoji: "🏎️" },
  { id: "lamborghini", name: "Lamborghini", price: 500000, category: "transport", emoji: "🏎️" },
  { id: "yacht", name: "Yacht", price: 7500000, category: "transport", emoji: "🛥️" },
  { id: "private-jet", name: "Private Jet", price: 65000000, category: "transport", emoji: "✈️" },
  { id: "cruise-ship", name: "Cruise Ship", price: 1000000000, category: "transport", emoji: "🚢" },

  // Luxury
  { id: "designer-watch", name: "Designer Watch", price: 50000, category: "luxury", emoji: "⌚" },
  { id: "diamond-ring", name: "Diamond Ring", price: 100000, category: "luxury", emoji: "💍" },
  { id: "mansion", name: "Mansion", price: 10000000, category: "luxury", emoji: "🏰" },
  { id: "private-island", name: "Private Island", price: 100000000, category: "luxury", emoji: "🏝️" },
  { id: "penthouse", name: "NYC Penthouse", price: 50000000, category: "luxury", emoji: "🏙️" },
  { id: "art-painting", name: "Famous Painting", price: 80000000, category: "luxury", emoji: "🖼️" },

  // Companies
  { id: "nba-team", name: "NBA Team", price: 4000000000, category: "companies", emoji: "🏀" },
  { id: "nfl-team", name: "NFL Team", price: 5000000000, category: "companies", emoji: "🏈" },
  { id: "airline", name: "Airline Company", price: 10000000000, category: "companies", emoji: "🛫" },
  { id: "social-media", name: "Social Media Platform", price: 44000000000, category: "companies", emoji: "📲" },
  { id: "movie-studio", name: "Movie Studio", price: 50000000000, category: "companies", emoji: "🎬" },

  // Mega Purchases
  { id: "skyscraper", name: "Skyscraper", price: 1500000000, category: "mega", emoji: "🏗️" },
  { id: "aircraft-carrier", name: "Aircraft Carrier", price: 13000000000, category: "mega", emoji: "⚓" },
  { id: "space-program", name: "Space Program", price: 50000000000, category: "mega", emoji: "🚀" },
  { id: "cure-disease", name: "Cure a Disease (Research)", price: 100000000000, category: "mega", emoji: "🧬" },
  { id: "mars-colony", name: "Mars Colony", price: 500000000000, category: "mega", emoji: "🔴" },
];
