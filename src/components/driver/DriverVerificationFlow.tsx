import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Camera, 
  FileText, 
  CheckCircle, 
  Clock, 
  X,
  User,
  Car,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface DocumentUpload {
  type: string;
  file: File | null;
  url: string | null;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  notes?: string;
}

const REQUIRED_DOCUMENTS = [
  { type: 'drivers_license', label: 'Driver\'s License', icon: User },
  { type: 'vehicle_registration', label: 'Vehicle Registration', icon: Car },
  { type: 'insurance_card', label: 'Insurance Card', icon: Shield },
  { type: 'profile_picture', label: 'Profile Picture', icon: Camera },
  { type: 'selfie_verification', label: 'Selfie for Verification', icon: Camera }
];

export const DriverVerificationFlow: React.FC = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [documents, setDocuments] = useState<{ [key: string]: DocumentUpload }>({});
  const [uploading, setUploading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string>('pending');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedDocType, setSelectedDocType] = useState<string>('');

  const steps = [
    { title: 'Personal Information', description: 'Basic details and background' },
    { title: 'Document Upload', description: 'Required verification documents' },
    { title: 'Vehicle Information', description: 'Vehicle details and registration' },
    { title: 'Background Check', description: 'Consent and verification' },
    { title: 'Review & Submit', description: 'Final review before submission' }
  ];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedDocType) {
      setDocuments(prev => ({
        ...prev,
        [selectedDocType]: {
          type: selectedDocType,
          file,
          url: URL.createObjectURL(file),
          status: 'uploaded'
        }
      }));
    }
  };

  const uploadDocument = async (docType: string, file: File) => {
    if (!user) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('driver-documents')
        .getPublicUrl(fileName);

      // Save document record to database
      const { error: dbError } = await supabase
        .from('driver_documents')
        .insert({
          driver_id: user.id,
          document_type: docType,
          document_url: urlData.publicUrl,
          status: 'pending'
        });

      if (dbError) throw dbError;

      setDocuments(prev => ({
        ...prev,
        [docType]: {
          ...prev[docType],
          url: urlData.publicUrl,
          status: 'pending'
        }
      }));

      toast.success('Document uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload document');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const triggerFileUpload = (docType: string) => {
    setSelectedDocType(docType);
    fileInputRef.current?.click();
  };

  const renderDocumentUpload = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const docData = documents[doc.type];
          const IconComponent = doc.icon;
          
          return (
            <Card key={doc.type} className="relative">
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <IconComponent className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{doc.label}</span>
                  {docData?.status && (
                    <Badge 
                      variant={docData.status === 'verified' ? 'default' : 
                               docData.status === 'rejected' ? 'destructive' : 'secondary'}
                    >
                      {docData.status}
                    </Badge>
                  )}
                </div>

                {docData?.url ? (
                  <div className="space-y-2">
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
                      <img 
                        src={docData.url} 
                        alt={doc.label}
                        className="max-w-full max-h-full object-contain rounded"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => triggerFileUpload(doc.type)}
                      className="w-full"
                    >
                      Replace
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => triggerFileUpload(doc.type)}
                    className="w-full h-32 border-dashed"
                    disabled={uploading}
                  >
                    <div className="text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <span className="text-sm">Upload {doc.label}</span>
                    </div>
                  </Button>
                )}

                {docData?.notes && (
                  <Alert className="mt-2">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {docData.notes}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );

  const renderPersonalInformation = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input id="fullName" placeholder="Enter your full name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input id="phone" type="tel" placeholder="(555) 123-4567" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" type="date" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="experience">Driving Experience (Years)</Label>
          <Input id="experience" type="number" min="0" placeholder="5" />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea id="address" placeholder="Enter your full address" />
      </div>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All personal information is encrypted and secure. We only use this information for verification purposes.
        </AlertDescription>
      </Alert>
    </div>
  );

  const renderVehicleInformation = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Vehicle Make</Label>
          <Input id="make" placeholder="e.g., Toyota" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Vehicle Model</Label>
          <Input id="model" placeholder="e.g., Camry" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input id="year" type="number" min="2010" max={new Date().getFullYear()} placeholder="2020" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input id="color" placeholder="e.g., Silver" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="licensePlate">License Plate</Label>
          <Input id="licensePlate" placeholder="ABC123" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="seats">Number of Seats</Label>
          <Input id="seats" type="number" min="2" max="8" placeholder="4" />
        </div>
      </div>
    </div>
  );

  const renderBackgroundCheck = () => (
    <div className="space-y-4">
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Background check is required for all drivers to ensure passenger safety.
        </AlertDescription>
      </Alert>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="backgroundConsent" className="rounded" />
            <Label htmlFor="backgroundConsent" className="text-sm">
              I consent to a background check being performed
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="criminalRecord" className="rounded" />
            <Label htmlFor="criminalRecord" className="text-sm">
              I have no criminal record that would affect my ability to drive
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input type="checkbox" id="terms" className="rounded" />
            <Label htmlFor="terms" className="text-sm">
              I agree to the terms and conditions
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderReviewSubmit = () => {
    const uploadedDocs = Object.values(documents).filter(doc => doc.status !== 'pending');
    const progress = (uploadedDocs.length / REQUIRED_DOCUMENTS.length) * 100;
    
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Application Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Documents Uploaded</span>
                <span>{uploadedDocs.length}/{REQUIRED_DOCUMENTS.length}</span>
              </div>
              <Progress value={progress} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge className="ml-2" variant="secondary">
                  {applicationStatus}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Completion:</span>
                <span className="ml-2">{Math.round(progress)}%</span>
              </div>
            </div>

            {progress === 100 ? (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Your application is complete and ready for submission!
                </AlertDescription>
              </Alert>
            ) : (
              <Alert>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  Please complete all required documents before submitting.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: return renderPersonalInformation();
      case 1: return renderDocumentUpload();
      case 2: return renderVehicleInformation();
      case 3: return renderBackgroundCheck();
      case 4: return renderReviewSubmit();
      default: return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Driver Verification Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={(currentStep / (steps.length - 1)) * 100} />
            <div className="flex justify-between text-sm">
              {steps.map((step, index) => (
                <div key={index} className={`text-center ${index <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}>
                  <div className="font-medium">{step.title}</div>
                  <div className="text-xs">{step.description}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep]?.title}</CardTitle>
        </CardHeader>
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
        >
          Previous
        </Button>
        
        {currentStep < steps.length - 1 ? (
          <Button onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}>
            Next
          </Button>
        ) : (
          <Button 
            onClick={() => toast.success('Application submitted for review!')}
            disabled={Object.values(documents).length < REQUIRED_DOCUMENTS.length}
          >
            Submit Application
          </Button>
        )}
      </div>
    </div>
  );
};