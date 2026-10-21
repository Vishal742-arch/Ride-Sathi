import { publishedRidesStore, bookingsStore, emailOtpStore, createBooking, verifyBookingOtp, cancelBooking } from './rides-store';
import { calculateFare, VEHICLE_RATES } from './location-service';

export async function runBookingLifecycleTestSuite() {
  console.log('=== RUNNING RIDE WITH ME COMPLETE BOOKING FLOW AUDIT SUITE ===\n');

  // Test 1: Vehicle Rates & Fare Verification
  console.log('1. Testing Vehicle Rates (Bike ₹2.5/km, Car ₹4.5/km)');
  if (VEHICLE_RATES.BIKE !== 2.5 || VEHICLE_RATES.CAR !== 4.5) {
    throw new Error('Vehicle rates do not match required pricing model.');
  }
  const fare1Seat = calculateFare(40, 'CAR', 1);
  if (fare1Seat.fareAmount !== 180) { // 40 * 4.5
    throw new Error(`Expected 1 seat car fare 180, got ${fare1Seat.fareAmount}`);
  }
  const fare3Seats = calculateFare(40, 'CAR', 3);
  if (fare3Seats.fareAmount !== 540) { // 180 * 3
    throw new Error(`Expected 3 seats car fare 540, got ${fare3Seats.fareAmount}`);
  }
  console.log('   ✓ Single and multi-seat fares calculate reliably.\n');

  // Test 2: In-Memory Ride Seeding
  const testRideId = `ride_test_${Date.now()}`;
  publishedRidesStore.unshift({
    id: testRideId,
    driver_name: 'Vikram Joshi',
    driver_rating: 4.9,
    vehicle: 'Car (Honda City)',
    vehicle_number: 'MP-09-AB-1234',
    origin: 'Indore Vijay Nagar',
    destination: 'Ujjain Mahakal Temple',
    departure_time: 'Today 5:00 PM',
    available_seats: 3,
    price_per_seat: 120,
    is_verified: true,
    status: 'PUBLISHED',
    created_at: new Date().toISOString(),
  });
  console.log('2. Published Test Ride with 3 available seats.');

  // Test 3: Seat Overbooking Prevention
  console.log('3. Testing Overbooking Prevention: Attempting to book 5 seats on a 3-seat ride');
  const overbookRes = createBooking({
    rideId: testRideId,
    seats: 5,
    passengerName: 'Ananya Roy',
    fareAmount: 600,
  });
  if (overbookRes.success) {
    throw new Error('Overbooking should have failed but succeeded.');
  }
  console.log(`   ✓ Overbooking safely blocked: "${overbookRes.error}"\n`);

  // Test 4: Valid 2-seat Booking & 6-Digit Boarding PIN Generation
  console.log('4. Testing Valid 2-Seat Booking & PIN Generation');
  const validBooking = createBooking({
    rideId: testRideId,
    seats: 2,
    passengerName: 'Ananya Roy',
    passengerPhone: '9876543210',
    fareAmount: 240,
  });
  if (!validBooking.success || !validBooking.booking) {
    throw new Error('Valid booking failed.');
  }
  const booking = validBooking.booking;
  if (!booking.booking_otp || booking.booking_otp.length !== 6 || isNaN(Number(booking.booking_otp))) {
    throw new Error('Boarding PIN is not a valid 6-digit numeric code.');
  }
  console.log(`   ✓ Booking created: ${booking.id}`);
  console.log(`   ✓ Boarding PIN generated securely: ${booking.booking_otp}`);
  console.log(`   ✓ Remaining ride seats: ${publishedRidesStore.find(r => r.id === testRideId)?.available_seats}\n`);

  // Test 5: Invalid Boarding PIN Attempt
  console.log('5. Testing Invalid Boarding PIN Rejection');
  const invalidPinRes = verifyBookingOtp(booking.id, '000000');
  if (invalidPinRes.success) {
    throw new Error('Invalid PIN was incorrectly accepted.');
  }
  console.log(`   ✓ Invalid PIN safely rejected: "${invalidPinRes.message}"\n`);

  // Test 6: Valid Boarding PIN Verification
  console.log('6. Testing Valid Boarding PIN Verification at Pickup');
  const validPinRes = verifyBookingOtp(booking.id, booking.booking_otp);
  if (!validPinRes.success) {
    throw new Error(`Valid PIN rejected: ${validPinRes.message}`);
  }
  if (booking.status !== 'VERIFIED') {
    throw new Error(`Booking status should be VERIFIED, got ${booking.status}`);
  }
  console.log(`   ✓ Boarding PIN successfully verified! Status: ${booking.status}\n`);

  // Test 7: Prevent PIN Reuse
  console.log('7. Testing Boarding PIN Reuse Prevention');
  const reuseRes = verifyBookingOtp(booking.id, booking.booking_otp);
  if (reuseRes.success) {
    throw new Error('Already-verified PIN was allowed to be verified again.');
  }
  console.log(`   ✓ PIN reuse safely prevented: "${reuseRes.message}"\n`);

  // Test 8: Booking Cancellation & Seat Restoration
  console.log('8. Testing Booking Cancellation & Seat Inventory Restoration');
  // Create another single seat booking to cancel
  const tempBooking = createBooking({
    rideId: testRideId,
    seats: 1,
    passengerName: 'Kunal Sharma',
    fareAmount: 120,
  });
  if (!tempBooking.success || !tempBooking.booking) throw new Error('Temp booking failed');

  const beforeCancelSeats = publishedRidesStore.find(r => r.id === testRideId)!.available_seats;
  const cancelRes = cancelBooking(tempBooking.booking.id);
  if (!cancelRes.success) throw new Error('Cancel booking failed');
  const afterCancelSeats = publishedRidesStore.find(r => r.id === testRideId)!.available_seats;

  if (afterCancelSeats !== beforeCancelSeats + 1) {
    throw new Error(`Seat count was not restored correctly: was ${beforeCancelSeats}, now ${afterCancelSeats}`);
  }
  console.log(`   ✓ Cancellation verified: Seats restored from ${beforeCancelSeats} to ${afterCancelSeats}\n`);

  // Test 9: Cancelled Booking Cannot Be Boarded
  console.log('9. Testing that Cancelled Booking cannot be verified');
  const cancelledVerifyRes = verifyBookingOtp(tempBooking.booking.id, tempBooking.booking.booking_otp);
  if (cancelledVerifyRes.success) {
    throw new Error('Cancelled booking was allowed to board.');
  }
  console.log(`   ✓ Cancelled booking board attempt blocked: "${cancelledVerifyRes.message}"\n`);

  console.log('=== ALL BOOKING LIFECYCLE TESTS PASSED PERFECTLY ===');
}

runBookingLifecycleTestSuite().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
