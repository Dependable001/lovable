-- Update driver_documents table to include profile pictures and selfie verification
UPDATE driver_documents SET document_type = 'profile_picture' WHERE document_type = 'profile_picture';

-- Add new document types for verification
-- This will be handled by the application logic, no schema change needed

-- Create storage buckets for driver verification documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('driver-documents', 'driver-documents', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('driver-verification', 'driver-verification', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for driver documents
CREATE POLICY "Drivers can upload their own documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id IN ('driver-documents', 'driver-verification') AND (storage.foldername(name))[1]::uuid IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Drivers can view their own documents" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('driver-documents', 'driver-verification') AND (storage.foldername(name))[1]::uuid IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

CREATE POLICY "Admins can view all documents" 
ON storage.objects FOR SELECT 
USING (bucket_id IN ('driver-documents', 'driver-verification') AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

CREATE POLICY "Admins can update document status" 
ON storage.objects FOR UPDATE 
USING (bucket_id IN ('driver-documents', 'driver-verification') AND EXISTS (
  SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'
));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_driver_applications_status ON driver_applications(status);
CREATE INDEX IF NOT EXISTS idx_driver_applications_created_at ON driver_applications(created_at);
CREATE INDEX IF NOT EXISTS idx_driver_documents_driver_status ON driver_documents(driver_id, status);
CREATE INDEX IF NOT EXISTS idx_driver_documents_type ON driver_documents(document_type);