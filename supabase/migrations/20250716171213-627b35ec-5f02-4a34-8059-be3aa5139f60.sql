-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('rider', 'driver', 'admin');

-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'rider',
  rating DECIMAL(2,1) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create rides table
CREATE TABLE public.rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_location TEXT NOT NULL,
  dropoff_location TEXT NOT NULL,
  pickup_lat DECIMAL(10,8),
  pickup_lng DECIMAL(11,8),
  dropoff_lat DECIMAL(10,8),
  dropoff_lng DECIMAL(11,8),
  estimated_fare_min DECIMAL(8,2),
  estimated_fare_max DECIMAL(8,2),
  final_fare DECIMAL(8,2),
  payment_method TEXT CHECK (payment_method IN ('card', 'cash')),
  status TEXT CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'cancelled')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ride offers table
CREATE TABLE public.ride_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID REFERENCES public.rides(id) ON DELETE CASCADE NOT NULL,
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  offered_fare DECIMAL(8,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'countered')) DEFAULT 'pending',
  counter_offer DECIMAL(8,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create driver subscriptions table
CREATE TABLE public.driver_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT CHECK (subscription_type IN ('weekly', 'monthly')) NOT NULL,
  amount DECIMAL(8,2) NOT NULL,
  status TEXT CHECK (status IN ('active', 'cancelled', 'expired')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(driver_id, subscription_type)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ride_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for rides
CREATE POLICY "Riders can view their own rides" ON public.rides
  FOR SELECT USING (rider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can view rides they're involved in" ON public.rides
  FOR SELECT USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Riders can create rides" ON public.rides
  FOR INSERT WITH CHECK (rider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update rides they're assigned to" ON public.rides
  FOR UPDATE USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create policies for ride offers
CREATE POLICY "Drivers can view offers they made" ON public.ride_offers
  FOR SELECT USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Riders can view offers on their rides" ON public.ride_offers
  FOR SELECT USING (ride_id IN (SELECT id FROM public.rides WHERE rider_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Drivers can create offers" ON public.ride_offers
  FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own offers" ON public.ride_offers
  FOR UPDATE USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create policies for driver subscriptions
CREATE POLICY "Drivers can view their own subscriptions" ON public.driver_subscriptions
  FOR SELECT USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can create their own subscriptions" ON public.driver_subscriptions
  FOR INSERT WITH CHECK (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'rider')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_ride_offers_updated_at BEFORE UPDATE ON public.ride_offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();