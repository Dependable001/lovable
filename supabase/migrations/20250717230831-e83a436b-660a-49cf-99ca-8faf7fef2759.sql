-- Create a test ride request from Johnson to verify the driver dashboard stays stable
INSERT INTO ride_requests (
  rider_id,
  pickup_location,
  dropoff_location,
  pickup_lat,
  pickup_lng,
  dropoff_lat,
  dropoff_lng,
  estimated_distance_miles,
  estimated_duration_minutes,
  estimated_fare_min,
  estimated_fare_max,
  payment_method,
  ride_type,
  rider_notes,
  status,
  expires_at
) VALUES (
  '72001a93-b09e-4f64-bb5c-a0cc5aa7b3f8', -- Johnson's profile ID
  'Downtown Plaza, 123 Main St',
  'Airport Terminal 1, 456 Airport Rd',
  40.7128,
  -74.0060,
  40.6413,
  -73.7781,
  15.2,
  25,
  22.50,
  28.00,
  'card',
  'standard',
  'Please arrive at the main entrance',
  'searching',
  NOW() + INTERVAL '15 minutes'
);