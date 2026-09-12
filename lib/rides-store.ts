export interface PublishedRide {
  id: string;
  driver_name: string;
  driver_rating: number;
  vehicle: string;
  origin: string;
  destination: string;
  departure_time: string;
  available_seats: number;
  price_per_seat: number;
  is_verified: boolean;
  created_at: string;
  postedAt?: string;
}

export const publishedRidesStore: PublishedRide[] = [];
