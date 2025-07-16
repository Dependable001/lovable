-- Create driver verification documents table
CREATE TABLE public.driver_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('drivers_license', 'vehicle_registration', 'insurance', 'background_check', 'vehicle_inspection')),
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create vehicle information table
CREATE TABLE public.vehicles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  vin TEXT,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'motorcycle')),
  seats INTEGER NOT NULL DEFAULT 4,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create driver application table
CREATE TABLE public.driver_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'documents_submitted', 'background_check_initiated', 'background_check_complete', 'approved', 'rejected')),
  date_of_birth DATE NOT NULL,
  phone_number TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  emergency_contact_name TEXT NOT NULL,
  emergency_contact_phone TEXT NOT NULL,
  has_criminal_record BOOLEAN NOT NULL DEFAULT false,
  criminal_record_details TEXT,
  driving_experience_years INTEGER NOT NULL,
  previous_violations TEXT,
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_accepted_at TIMESTAMP WITH TIME ZONE,
  background_check_consent BOOLEAN NOT NULL DEFAULT false,
  background_check_consent_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.driver_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for driver_documents
CREATE POLICY "Drivers can view their own documents" 
ON public.driver_documents 
FOR SELECT 
USING (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own documents" 
ON public.driver_documents 
FOR INSERT 
WITH CHECK (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own pending documents" 
ON public.driver_documents 
FOR UPDATE 
USING (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND status = 'pending');

CREATE POLICY "Admins can view all documents" 
ON public.driver_documents 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all documents" 
ON public.driver_documents 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create RLS policies for vehicles
CREATE POLICY "Drivers can view their own vehicles" 
ON public.vehicles 
FOR SELECT 
USING (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own vehicles" 
ON public.vehicles 
FOR INSERT 
WITH CHECK (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Admins can view all vehicles" 
ON public.vehicles 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all vehicles" 
ON public.vehicles 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create RLS policies for driver_applications
CREATE POLICY "Drivers can view their own application" 
ON public.driver_applications 
FOR SELECT 
USING (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can insert their own application" 
ON public.driver_applications 
FOR INSERT 
WITH CHECK (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Drivers can update their own pending application" 
ON public.driver_applications 
FOR UPDATE 
USING (driver_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()) AND status IN ('pending', 'documents_submitted'));

CREATE POLICY "Admins can view all applications" 
ON public.driver_applications 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update all applications" 
ON public.driver_applications 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at columns
CREATE TRIGGER update_driver_documents_updated_at
BEFORE UPDATE ON public.driver_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_driver_applications_updated_at
BEFORE UPDATE ON public.driver_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add unique constraints
ALTER TABLE public.driver_applications ADD CONSTRAINT unique_driver_application UNIQUE (driver_id);
ALTER TABLE public.vehicles ADD CONSTRAINT unique_license_plate UNIQUE (license_plate);