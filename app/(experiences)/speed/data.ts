export type SpeedItem = {
  name: string;
  speed: number; // km/h
  emoji: string;
  category: string;
  funFact?: string;
};

export const speedItems: SpeedItem[] = [
  // Animals
  { name: "Sloth", speed: 0.27, emoji: "🦥", category: "animals", funFact: "Sloths are so slow, algae grows on them" },
  { name: "Snail", speed: 0.05, emoji: "🐌", category: "animals" },
  { name: "Human (walking)", speed: 5, emoji: "🚶", category: "animals" },
  { name: "Human (running)", speed: 24, emoji: "🏃", category: "animals", funFact: "Usain Bolt's top speed was 44.72 km/h" },
  { name: "Cat", speed: 48, emoji: "🐱", category: "animals" },
  { name: "Horse", speed: 70, emoji: "🐴", category: "animals" },
  { name: "Dolphin", speed: 60, emoji: "🐬", category: "animals" },
  { name: "Cheetah", speed: 120, emoji: "🐆", category: "animals", funFact: "Can accelerate from 0 to 100 km/h in 3 seconds" },
  { name: "Peregrine Falcon (diving)", speed: 390, emoji: "🦅", category: "animals", funFact: "Fastest animal on Earth" },

  // Vehicles
  { name: "Bicycle", speed: 25, emoji: "🚴", category: "vehicles" },
  { name: "Car (highway)", speed: 120, emoji: "🚗", category: "vehicles" },
  { name: "Sports Car", speed: 330, emoji: "🏎️", category: "vehicles", funFact: "Bugatti Chiron tops out at 420 km/h" },
  { name: "High-Speed Train", speed: 320, emoji: "🚄", category: "vehicles" },
  { name: "Commercial Jet", speed: 900, emoji: "✈️", category: "vehicles" },
  { name: "Fighter Jet", speed: 2500, emoji: "🛩️", category: "vehicles" },
  { name: "Formula 1 Car", speed: 370, emoji: "🏁", category: "vehicles" },

  // Technology
  { name: "Internet (fiber optic)", speed: 299792, emoji: "🌐", category: "tech", funFact: "Light travels at 299,792 km/s in fiber" },
  { name: "Sound (in air)", speed: 1235, emoji: "🔊", category: "tech" },
  { name: "Bullet", speed: 3500, emoji: "🎯", category: "tech" },
  { name: "Rocket (escape velocity)", speed: 40270, emoji: "🚀", category: "tech" },
  { name: "ISS", speed: 27600, emoji: "🛰️", category: "tech", funFact: "Orbits Earth every 90 minutes" },

  // Nature
  { name: "Wind (hurricane)", speed: 250, emoji: "🌪️", category: "nature" },
  { name: "Tsunami", speed: 800, emoji: "🌊", category: "nature" },
  { name: "Lightning", speed: 3500, emoji: "⚡", category: "nature" },
  { name: "Earth (orbiting Sun)", speed: 107000, emoji: "🌍", category: "nature", funFact: "We're moving this fast right now!" },
  { name: "Light", speed: 1079252849, emoji: "💡", category: "nature", funFact: "299,792 km/s - the cosmic speed limit!" },
];

export const categories = [
  { id: "animals", name: "Animals", emoji: "🐾" },
  { id: "vehicles", name: "Vehicles", emoji: "🚗" },
  { id: "tech", name: "Technology", emoji: "⚙️" },
  { id: "nature", name: "Nature", emoji: "🌍" },
];

export function formatSpeed(speed: number): string {
  if (speed >= 1000000) {
    return `${(speed / 1000000).toFixed(1)}M km/h`;
  }
  if (speed >= 1000) {
    return `${(speed / 1000).toFixed(1)}K km/h`;
  }
  return `${speed.toLocaleString()} km/h`;
}
