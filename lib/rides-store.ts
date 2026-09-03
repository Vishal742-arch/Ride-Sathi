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
}

export const publishedRidesStore: PublishedRide[] = [
  {
    id: 'ride-1',
    driver_name: 'Rahul Sharma',
    driver_rating: 4.9,
    vehicle: 'Hyundai i20 (Car)',
    origin: 'Vijay Nagar Square, Indore',
    destination: 'Mata Tekri, Dewas',
    departure_time: 'Today, 08:00 AM',
    available_seats: 3,
    price_per_seat: 80,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'ride-2',
    driver_name: 'Amit Patel',
    driver_rating: 4.8,
    vehicle: 'Royal Enfield (Bike)',
    origin: 'Regal Circle, Indore',
    destination: 'Mahakaleshwar Temple, Ujjain',
    departure_time: 'Today, 09:30 AM',
    available_seats: 1,
    price_per_seat: 120,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'ride-3',
    driver_name: 'Priya Verma',
    driver_rating: 4.95,
    vehicle: 'Honda City (Car)',
    origin: 'Palasia Square, Indore',
    destination: 'Dewas Bus Stand, Dewas',
    departure_time: 'Today, 05:30 PM',
    available_seats: 2,
    price_per_seat: 90,
    is_verified: true,
    created_at: new Date().toISOString(),
  },
];
