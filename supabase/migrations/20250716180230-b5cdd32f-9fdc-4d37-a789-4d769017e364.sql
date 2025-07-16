-- Add columns to rides table for better ride management
ALTER TABLE rides ADD COLUMN IF NOT EXISTS ride_type TEXT DEFAULT 'standard';
ALTER TABLE rides ADD COLUMN IF NOT EXISTS fare_breakdown JSONB;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS rider_notes TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS driver_notes TEXT;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS requested_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE rides ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS started_at TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE rides ADD COLUMN IF NOT EXISTS distance_miles DECIMAL(5,2);
ALTER TABLE rides ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;

-- Create ride requests table for the booking flow
CREATE TABLE IF NOT EXISTS public.ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  dropoff_lat DECIMAL(10,8),
  dropoff_lng DECIMAL(11,8),
  estimated_distance_miles DECIMAL(5,2),
  estimated_duration_minutes INTEGER,
  estimated_fare_min DECIMAL(8,2),
  estimated_fare_max DECIMAL(8,2),
  payment_method TEXT DEFAULT 'card',
  rider_notes TEXT,
  ride_type TEXT DEFAULT 'standard',
  status TEXT DEFAULT 'searching',
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '15 minutes'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on ride_requests
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for ride_requests
CREATE POLICY "Riders can create their own requests" ON ride_requests
FOR INSERT
WITH CHECK (rider_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Riders can view their own requests" ON ride_requests
FOR SELECT
USING (rider_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Riders can update their own requests" ON ride_requests
FOR UPDATE
USING (rider_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Drivers can view active requests" ON ride_requests
FOR SELECT
USING (
  status = 'searching' AND 
  expires_at > now() AND
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'driver')
);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ride_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ride_requests
DROP TRIGGER IF EXISTS update_ride_requests_updated_at_trigger ON ride_requests;
CREATE TRIGGER update_ride_requests_updated_at_trigger
  BEFORE UPDATE ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_ride_requests_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ride_requests_status_expires ON ride_requests(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_ride_requests_rider_id ON ride_requests(rider_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_location ON ride_requests(pickup_lat, pickup_lng, dropoff_lat, dropoff_lng);

-- Create function to estimate ride fare based on distance
CREATE OR REPLACE FUNCTION calculate_estimated_fare(distance_miles DECIMAL)
RETURNS TABLE(min_fare DECIMAL, max_fare DECIMAL) AS $$
DECLARE
  base_fare DECIMAL := 3.50;
  per_mile_rate DECIMAL := 2.20;
  surge_multiplier DECIMAL := 1.0; -- Could be dynamic based on demand
  min_total DECIMAL;
  max_total DECIMAL;
BEGIN
  -- Calculate base estimate
  min_total := base_fare + (distance_miles * per_mile_rate * surge_multiplier);
  max_total := min_total * 1.25; -- 25% variance for market pricing
  
  -- Ensure minimum fare
  min_total := GREATEST(min_total, 8.00);
  max_total := GREATEST(max_total, 10.00);
  
  RETURN QUERY SELECT min_total, max_total;
END;
$$ LANGUAGE plpgsql;