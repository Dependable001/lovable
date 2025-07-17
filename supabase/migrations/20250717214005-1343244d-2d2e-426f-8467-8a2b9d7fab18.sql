-- Create ride_messages table for driver-rider communication
CREATE TABLE public.ride_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES public.rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('rider', 'driver')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create driver_locations table for live tracking
CREATE TABLE public.driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  heading DECIMAL(5, 2), -- Compass heading in degrees
  speed DECIMAL(5, 2),   -- Speed in m/s
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Ensure only one location per driver per ride
  UNIQUE(driver_id, ride_id)
);

-- Enable Row Level Security
ALTER TABLE public.ride_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ride_messages
CREATE POLICY "Users can view messages for their rides" ON public.ride_messages
FOR SELECT
USING (
  ride_id IN (
    SELECT id FROM public.rides 
    WHERE rider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages for their rides" ON public.ride_messages
FOR INSERT
WITH CHECK (
  sender_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  AND ride_id IN (
    SELECT id FROM public.rides 
    WHERE rider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
);

-- RLS Policies for driver_locations
CREATE POLICY "Drivers can update their own location" ON public.driver_locations
FOR ALL
USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can view driver locations for their rides" ON public.driver_locations
FOR SELECT
USING (
  ride_id IN (
    SELECT id FROM public.rides 
    WHERE rider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  )
  OR driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- Create indexes for better performance
CREATE INDEX idx_ride_messages_ride_id ON public.ride_messages(ride_id);
CREATE INDEX idx_ride_messages_created_at ON public.ride_messages(created_at);
CREATE INDEX idx_driver_locations_driver_id ON public.driver_locations(driver_id);
CREATE INDEX idx_driver_locations_ride_id ON public.driver_locations(ride_id);
CREATE INDEX idx_driver_locations_updated_at ON public.driver_locations(updated_at);

-- Add triggers for updated_at
CREATE TRIGGER update_ride_messages_updated_at
  BEFORE UPDATE ON public.ride_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_locations_updated_at
  BEFORE UPDATE ON public.driver_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for both tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.ride_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.driver_locations;