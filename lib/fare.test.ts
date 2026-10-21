import { calculateFare, VEHICLE_RATES } from './location-service';

function testFareCalculations() {
  console.log('--- Testing Vehicle Rates ---');
  if (VEHICLE_RATES.BIKE !== 2.5) {
    throw new Error(`Expected BIKE rate 2.5, got ${VEHICLE_RATES.BIKE}`);
  }
  if (VEHICLE_RATES.CAR !== 4.5) {
    throw new Error(`Expected CAR rate 4.5, got ${VEHICLE_RATES.CAR}`);
  }
  console.log('✓ Vehicle rates match specification (Bike: ₹2.5/km, Car: ₹4.5/km)');

  console.log('--- Testing Bike Fare (Indore to Dewas ~ 35km) ---');
  const bikeFare = calculateFare(35, 'BIKE', 1);
  // Bike raw: 35 * 2.5 = 87.5
  if (bikeFare.fareAmount !== 87.5) {
    throw new Error(`Expected bike fare 87.5, got ${bikeFare.fareAmount}`);
  }
  if (bikeFare.passengers !== 1) {
    throw new Error(`Expected bike passengers restricted to 1, got ${bikeFare.passengers}`);
  }
  console.log(`✓ Bike fare for 35km: ₹${bikeFare.fareAmount} (Seats: ${bikeFare.passengers})`);

  console.log('--- Testing Bike Passenger Constraint ---');
  const bikeMultiPassengerFare = calculateFare(35, 'BIKE', 3);
  if (bikeMultiPassengerFare.passengers !== 1 || bikeMultiPassengerFare.fareAmount !== 87.5) {
    throw new Error(`Bike should restrict seats to 1, got ${bikeMultiPassengerFare.passengers}`);
  }
  console.log('✓ Bike passenger safety restriction confirmed: max 1 seat enforced');

  console.log('--- Testing Car Fare (Indore to Ujjain ~ 55km, 1 Seat) ---');
  const carFare1 = calculateFare(55, 'CAR', 1);
  // Car raw: 55 * 4.5 = 247.5
  if (carFare1.perSeatFare !== 247.5 || carFare1.fareAmount !== 247.5) {
    throw new Error(`Expected car fare 247.5, got ${carFare1.fareAmount}`);
  }
  console.log(`✓ Car 1 seat fare for 55km: ₹${carFare1.fareAmount}`);

  console.log('--- Testing Car Multi-Passenger Fare (Indore to Ujjain ~ 55km, 3 Seats) ---');
  const carFare3 = calculateFare(55, 'CAR', 3);
  if (carFare3.perSeatFare !== 247.5) {
    throw new Error(`Expected per-seat fare 247.5, got ${carFare3.perSeatFare}`);
  }
  if (carFare3.fareAmount !== 742.5) { // 247.5 * 3
    throw new Error(`Expected 3 seats total fare 742.5, got ${carFare3.fareAmount}`);
  }
  console.log(`✓ Car 3 seats fare for 55km: Total ₹${carFare3.fareAmount} (₹${carFare3.perSeatFare}/seat × 3)`);

  console.log('--- Testing Base Minimum Fares (Short 1km Trip) ---');
  const shortBike = calculateFare(1, 'BIKE', 1);
  // 1 * 2.5 = 2.5 -> baseFare 10
  if (shortBike.fareAmount !== 10) {
    throw new Error(`Expected minimum bike fare 10, got ${shortBike.fareAmount}`);
  }
  const shortCar = calculateFare(1, 'CAR', 1);
  // 1 * 4.5 = 4.5 -> baseFare 20
  if (shortCar.fareAmount !== 20) {
    throw new Error(`Expected minimum car fare 20, got ${shortCar.fareAmount}`);
  }
  console.log(`✓ Base minimum fares enforced: Bike ₹${shortBike.fareAmount}, Car ₹${shortCar.fareAmount}`);

  console.log('ALL FARE AND PASSENGER REGRESSION TESTS PASSED!');
}

testFareCalculations();
