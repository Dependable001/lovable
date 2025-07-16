import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, FileText, Shield, Car, CheckCircle, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface DriverRegistrationFlowProps {
  profileId: string;
  onComplete: () => void;
}

interface DriverApplication {
  date_of_birth: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_criminal_record: boolean;
  criminal_record_details: string;
  driving_experience_years: number;
  previous_violations: string;
  terms_accepted: boolean;
  background_check_consent: boolean;
}

interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  license_plate: string;
  vin: string;
  vehicle_type: string;
  seats: number;
}

const STEPS = [
  { id: 1, title: "Personal Information", icon: FileText },
  { id: 2, title: "Vehicle Information", icon: Car },
  { id: 3, title: "Document Upload", icon: Upload },
  { id: 4, title: "Background Check Consent", icon: Shield },
  { id: 5, title: "Terms & Conditions", icon: CheckCircle },
];

export default function DriverRegistrationFlow({ profileId, onComplete }: DriverRegistrationFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [application, setApplication] = useState<DriverApplication>({
    date_of_birth: "",
    phone_number: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    has_criminal_record: false,
    criminal_record_details: "",
    driving_experience_years: 0,
    previous_violations: "",
    terms_accepted: false,
    background_check_consent: false,
  });
  
  const [vehicle, setVehicle] = useState<Vehicle>({
    make: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    license_plate: "",
    vin: "",
    vehicle_type: "sedan",
    seats: 4,
  });

  const [uploadedDocuments, setUploadedDocuments] = useState<{[key: string]: File}>({});
  const { toast } = useToast();

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await submitApplication();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const submitApplication = async () => {
    setLoading(true);
    
    try {
      // Submit driver application
      const { error: appError } = await supabase
        .from('driver_applications')
        .insert({
          driver_id: profileId,
          ...application,
          terms_accepted_at: new Date().toISOString(),
          background_check_consent_at: new Date().toISOString(),
        });

      if (appError) throw appError;

      // Submit vehicle information
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .insert({
          driver_id: profileId,
          ...vehicle,
        });

      if (vehicleError) throw vehicleError;

      // TODO: Upload documents to storage
      // This would require implementing file storage
      
      toast({
        title: "Application Submitted!",
        description: "Your driver application has been submitted for review. We'll contact you within 2-3 business days.",
      });

      onComplete();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return (
          application.date_of_birth &&
          application.phone_number &&
          application.address &&
          application.city &&
          application.state &&
          application.zip_code &&
          application.emergency_contact_name &&
          application.emergency_contact_phone &&
          application.driving_experience_years > 0
        );
      case 2:
        return (
          vehicle.make &&
          vehicle.model &&
          vehicle.year &&
          vehicle.color &&
          vehicle.license_plate &&
          vehicle.vin
        );
      case 3:
        return (
          uploadedDocuments.drivers_license &&
          uploadedDocuments.vehicle_registration &&
          uploadedDocuments.insurance
        );
      case 4:
        return application.background_check_consent;
      case 5:
        return application.terms_accepted;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <PersonalInformationStep application={application} setApplication={setApplication} />;
      case 2:
        return <VehicleInformationStep vehicle={vehicle} setVehicle={setVehicle} />;
      case 3:
        return <DocumentUploadStep uploadedDocuments={uploadedDocuments} setUploadedDocuments={setUploadedDocuments} />;
      case 4:
        return <BackgroundCheckStep application={application} setApplication={setApplication} />;
      case 5:
        return <TermsAndConditionsStep application={application} setApplication={setApplication} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Driver Registration</CardTitle>
            <CardDescription className="text-center">
              Complete all steps to become a verified Ubify driver
            </CardDescription>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
          
          <CardContent>
            {/* Step Navigation */}
            <div className="flex justify-between mb-8">
              {STEPS.map((step) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center space-y-2">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${isActive ? 'bg-primary text-primary-foreground' : 
                        isCompleted ? 'bg-green-500 text-white' : 'bg-muted'}
                    `}>
                      {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs text-center ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                Previous
              </Button>
              
              <Button
                onClick={handleNext}
                disabled={!isStepValid() || loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {currentStep === STEPS.length ? "Submit Application" : "Next"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Step Components
function PersonalInformationStep({ 
  application, 
  setApplication 
}: { 
  application: DriverApplication; 
  setApplication: (app: DriverApplication) => void; 
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Personal Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="dob">Date of Birth</Label>
          <Input
            id="dob"
            type="date"
            value={application.date_of_birth}
            onChange={(e) => setApplication({ ...application, date_of_birth: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            value={application.phone_number}
            onChange={(e) => setApplication({ ...application, phone_number: e.target.value })}
            placeholder="+1 (555) 123-4567"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={application.address}
          onChange={(e) => setApplication({ ...application, address: e.target.value })}
          placeholder="123 Main Street"
          required
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={application.city}
            onChange={(e) => setApplication({ ...application, city: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={application.state}
            onChange={(e) => setApplication({ ...application, state: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="zip">ZIP Code</Label>
          <Input
            id="zip"
            value={application.zip_code}
            onChange={(e) => setApplication({ ...application, zip_code: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="emergency-name">Emergency Contact Name</Label>
          <Input
            id="emergency-name"
            value={application.emergency_contact_name}
            onChange={(e) => setApplication({ ...application, emergency_contact_name: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="emergency-phone">Emergency Contact Phone</Label>
          <Input
            id="emergency-phone"
            type="tel"
            value={application.emergency_contact_phone}
            onChange={(e) => setApplication({ ...application, emergency_contact_phone: e.target.value })}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="experience">Driving Experience (Years)</Label>
        <Input
          id="experience"
          type="number"
          min="1"
          value={application.driving_experience_years}
          onChange={(e) => setApplication({ ...application, driving_experience_years: parseInt(e.target.value) || 0 })}
          required
        />
      </div>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="criminal-record"
            checked={application.has_criminal_record}
            onCheckedChange={(checked) => setApplication({ ...application, has_criminal_record: checked as boolean })}
          />
          <Label htmlFor="criminal-record">I have a criminal record</Label>
        </div>
        
        {application.has_criminal_record && (
          <div className="space-y-2">
            <Label htmlFor="criminal-details">Please explain any criminal history</Label>
            <Textarea
              id="criminal-details"
              value={application.criminal_record_details}
              onChange={(e) => setApplication({ ...application, criminal_record_details: e.target.value })}
              placeholder="Provide details about your criminal history..."
            />
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="violations">Previous Traffic Violations (Optional)</Label>
        <Textarea
          id="violations"
          value={application.previous_violations}
          onChange={(e) => setApplication({ ...application, previous_violations: e.target.value })}
          placeholder="List any traffic violations in the past 5 years..."
        />
      </div>
    </div>
  );
}

function VehicleInformationStep({ 
  vehicle, 
  setVehicle 
}: { 
  vehicle: Vehicle; 
  setVehicle: (vehicle: Vehicle) => void; 
}) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Vehicle Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="make">Make</Label>
          <Input
            id="make"
            value={vehicle.make}
            onChange={(e) => setVehicle({ ...vehicle, make: e.target.value })}
            placeholder="Toyota"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="model">Model</Label>
          <Input
            id="model"
            value={vehicle.model}
            onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })}
            placeholder="Camry"
            required
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="year">Year</Label>
          <Input
            id="year"
            type="number"
            min="2010"
            max={new Date().getFullYear() + 1}
            value={vehicle.year}
            onChange={(e) => setVehicle({ ...vehicle, year: parseInt(e.target.value) || new Date().getFullYear() })}
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="color">Color</Label>
          <Input
            id="color"
            value={vehicle.color}
            onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })}
            placeholder="Black"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="seats">Number of Seats</Label>
          <Input
            id="seats"
            type="number"
            min="2"
            max="8"
            value={vehicle.seats}
            onChange={(e) => setVehicle({ ...vehicle, seats: parseInt(e.target.value) || 4 })}
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="vehicle-type">Vehicle Type</Label>
        <Select value={vehicle.vehicle_type} onValueChange={(value) => setVehicle({ ...vehicle, vehicle_type: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sedan">Sedan</SelectItem>
            <SelectItem value="suv">SUV</SelectItem>
            <SelectItem value="hatchback">Hatchback</SelectItem>
            <SelectItem value="coupe">Coupe</SelectItem>
            <SelectItem value="truck">Truck</SelectItem>
            <SelectItem value="van">Van</SelectItem>
            <SelectItem value="motorcycle">Motorcycle</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="license-plate">License Plate</Label>
          <Input
            id="license-plate"
            value={vehicle.license_plate}
            onChange={(e) => setVehicle({ ...vehicle, license_plate: e.target.value.toUpperCase() })}
            placeholder="ABC123"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="vin">VIN Number</Label>
          <Input
            id="vin"
            value={vehicle.vin}
            onChange={(e) => setVehicle({ ...vehicle, vin: e.target.value.toUpperCase() })}
            placeholder="1HGBH41JXMN109186"
            maxLength={17}
            required
          />
        </div>
      </div>
    </div>
  );
}

function DocumentUploadStep({ 
  uploadedDocuments, 
  setUploadedDocuments 
}: { 
  uploadedDocuments: {[key: string]: File}; 
  setUploadedDocuments: (docs: {[key: string]: File}) => void; 
}) {
  const requiredDocuments = [
    { key: 'drivers_license', label: "Driver's License", description: "Front and back of your current driver's license" },
    { key: 'vehicle_registration', label: "Vehicle Registration", description: "Current vehicle registration document" },
    { key: 'insurance', label: "Insurance Certificate", description: "Proof of current auto insurance" },
    { key: 'vehicle_inspection', label: "Vehicle Inspection (Optional)", description: "Recent vehicle inspection certificate" },
  ];

  const handleFileUpload = (documentType: string, file: File | null) => {
    if (file) {
      setUploadedDocuments({ ...uploadedDocuments, [documentType]: file });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Document Upload</h3>
        <p className="text-sm text-muted-foreground">
          Please upload clear, readable photos or scans of the following documents:
        </p>
      </div>
      
      {requiredDocuments.map((doc) => (
        <div key={doc.key} className="border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h4 className="font-medium">{doc.label}</h4>
              <p className="text-sm text-muted-foreground">{doc.description}</p>
            </div>
            <div className="flex items-center space-x-2">
              {uploadedDocuments[doc.key] && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => handleFileUpload(doc.key, e.target.files?.[0] || null)}
                className="w-auto"
              />
            </div>
          </div>
          {uploadedDocuments[doc.key] && (
            <p className="text-sm text-green-600 mt-2">
              ✓ {uploadedDocuments[doc.key].name} uploaded
            </p>
          )}
        </div>
      ))}
      
      <div className="bg-muted p-4 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-medium text-sm">Important Notes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• All documents must be current and valid</li>
              <li>• Photos must be clear and all text must be readable</li>
              <li>• Accepted formats: JPG, PNG, PDF (max 10MB each)</li>
              <li>• Personal information must match across all documents</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

function BackgroundCheckStep({ 
  application, 
  setApplication 
}: { 
  application: DriverApplication; 
  setApplication: (app: DriverApplication) => void; 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Background Check Consent</h3>
        <p className="text-muted-foreground">
          We require all drivers to undergo a comprehensive background check for the safety of our platform.
        </p>
      </div>
      
      <div className="bg-muted p-6 rounded-lg space-y-4">
        <h4 className="font-medium">Our background check includes:</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Criminal history check (7 years)</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Driving record verification (3 years)</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Identity verification</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Sex offender registry check</span>
          </li>
          <li className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Social Security number verification</span>
          </li>
        </ul>
      </div>
      
      <div className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Processing Time & Fees</p>
              <p className="text-yellow-700 mt-1">
                Background checks typically take 2-3 business days to complete. 
                The background check fee ($25) will be deducted from your first week's earnings.
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-start space-x-3">
          <Checkbox
            id="background-consent"
            checked={application.background_check_consent}
            onCheckedChange={(checked) => 
              setApplication({ ...application, background_check_consent: checked as boolean })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="background-consent" className="text-sm font-medium">
              I consent to background check
            </Label>
            <p className="text-xs text-muted-foreground">
              I authorize Ubify and its third-party vendors to conduct a comprehensive background check, 
              including but not limited to criminal history, driving record, and identity verification. 
              I understand that providing false information may result in immediate disqualification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsAndConditionsStep({ 
  application, 
  setApplication 
}: { 
  application: DriverApplication; 
  setApplication: (app: DriverApplication) => void; 
}) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Terms & Conditions</h3>
        <p className="text-muted-foreground">
          Please review and accept our driver agreement to complete your registration.
        </p>
      </div>
      
      <div className="border rounded-lg p-4 max-h-96 overflow-y-auto bg-muted/50">
        <div className="space-y-4 text-sm">
          <section>
            <h4 className="font-medium">1. Driver Requirements</h4>
            <p>You must be at least 21 years old, have a valid driver's license, maintain current auto insurance, and pass our background check.</p>
          </section>
          
          <section>
            <h4 className="font-medium">2. Vehicle Standards</h4>
            <p>Your vehicle must be model year 2010 or newer, pass safety inspection, maintain clean interior and exterior, and have working air conditioning and heating.</p>
          </section>
          
          <section>
            <h4 className="font-medium">3. Service Standards</h4>
            <p>You agree to provide professional, courteous service, maintain a minimum 4.7 star rating, follow all traffic laws, and complete rides in a timely manner.</p>
          </section>
          
          <section>
            <h4 className="font-medium">4. Earnings & Payments</h4>
            <p>Earnings are calculated based on time and distance. Platform fee applies to each ride. Payments are made weekly via direct deposit.</p>
          </section>
          
          <section>
            <h4 className="font-medium">5. Insurance & Liability</h4>
            <p>You must maintain personal auto insurance. Commercial insurance is provided during active rides. You are responsible for vehicle maintenance and repairs.</p>
          </section>
          
          <section>
            <h4 className="font-medium">6. Termination</h4>
            <p>Either party may terminate this agreement at any time. Ubify reserves the right to deactivate drivers for policy violations or poor performance.</p>
          </section>
        </div>
      </div>
      
      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="terms-accepted"
            checked={application.terms_accepted}
            onCheckedChange={(checked) => 
              setApplication({ ...application, terms_accepted: checked as boolean })
            }
          />
          <div className="space-y-1">
            <Label htmlFor="terms-accepted" className="text-sm font-medium">
              I accept the Driver Agreement and Terms of Service
            </Label>
            <p className="text-xs text-muted-foreground">
              By checking this box, I acknowledge that I have read, understood, and agree to be bound by 
              Ubify's Driver Agreement, Terms of Service, Privacy Policy, and Community Guidelines.
            </p>
          </div>
        </div>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-green-800">Ready to Submit!</p>
              <p className="text-green-700 mt-1">
                Once you submit your application, we'll begin processing your documents and background check. 
                You'll receive email updates on your application status.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}