export type Listing = {
  id: string;
  title: string;
  location: string;
  distance: string;
  dates: string;
  pricePerNight: number;
  rating: number;
  isFavorite?: boolean;
  image: string;
  category: string;
  stayType: "Hotel Room" | "B&B Room" | "Rental Room";
};

export const categories = [
  "Beachfront",
  "Cabins",
  "Amazing Views",
  "Tiny homes",
  "Countryside",
  "Lake",
  "Design",
  "Trending",
];

export const stayTypes = ["Hotel Rooms", "B&B rooms", "Rental Rooms"];

export {
  GUEST_FAVORITES as guestFavorites,
  STANDOUT_AMENITIES as standoutAmenities,
  SAFETY_AMENITIES as safetyAmenities,
} from "./listing-amenities";

/** @deprecated Use guestFavorites — kept for any old imports */
export { GUEST_FAVORITES as essentials } from "./listing-amenities";
/** @deprecated Use standoutAmenities */
export { STANDOUT_AMENITIES as features } from "./listing-amenities";
/** @deprecated Use safetyAmenities */
export { SAFETY_AMENITIES as safetyItems } from "./listing-amenities";

export const hostLanguages = ["English", "Spanish", "Japanese", "French"];

export const listings: Listing[] = [
  {
    id: "lst_1",
    title: "Modern loft by the sea",
    location: "Bali, Indonesia",
    distance: "6,800 km away",
    dates: "12-17 Apr",
    pricePerNight: 124,
    rating: 4.92,
    image:
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1200&q=80",
    category: "Beachfront",
    stayType: "Rental Room",
    isFavorite: true,
  },
  {
    id: "lst_2",
    title: "A-frame in pine forest",
    location: "Banff, Canada",
    distance: "7,520 km away",
    dates: "2-9 May",
    pricePerNight: 149,
    rating: 4.88,
    image:
      "https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=1200&q=80",
    category: "Cabins",
    stayType: "B&B Room",
  },
  {
    id: "lst_3",
    title: "Minimal sky penthouse",
    location: "Tokyo, Japan",
    distance: "5,700 km away",
    dates: "18-22 Apr",
    pricePerNight: 212,
    rating: 4.95,
    image:
      "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80",
    category: "Design",
    stayType: "Hotel Room",
  },
  {
    id: "lst_4",
    title: "Peaceful house on lake",
    location: "Hallstatt, Austria",
    distance: "880 km away",
    dates: "27 Apr-3 May",
    pricePerNight: 174,
    rating: 4.79,
    image:
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
    category: "Lake",
    stayType: "Rental Room",
  },
  {
    id: "lst_5",
    title: "Luxury suite with skyline view",
    location: "Dubai, UAE",
    distance: "4,150 km away",
    dates: "9-14 May",
    pricePerNight: 239,
    rating: 4.9,
    image:
      "https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=1200&q=80",
    category: "Trending",
    stayType: "Hotel Room",
  },
  {
    id: "lst_6",
    title: "Cozy breakfast room downtown",
    location: "Lisbon, Portugal",
    distance: "2,020 km away",
    dates: "20-25 Apr",
    pricePerNight: 98,
    rating: 4.75,
    image:
      "https://images.unsplash.com/photo-1631049552240-59c37f38802b?auto=format&fit=crop&w=1200&q=80",
    category: "Countryside",
    stayType: "B&B Room",
  },
];
