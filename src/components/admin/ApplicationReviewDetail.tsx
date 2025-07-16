import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, XCircle, Eye, Download, User, Car, FileText, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DriverApplication {
  id: string;
  status: string;
  created_at: string;
  date_of_birth: string;
  phone_number: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  has_criminal_record: boolean;
  criminal_record_details?: string;
  driving_experience_years: number;
  previous_violations?: string;
  rejection_reason?: string;
  driver: {
    id: string;
    full_name: string;
    email: string;
  };
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
    vin: string;
    vehicle_type: string;
    seats: number;
  } | null;
}

interface DriverDocument {
  id: string;
  document_type: string;
  document_url: string;
  status: string;
  created_at: string;
  verified_at?: string;
  notes?: string;
}

interface ApplicationReviewDetailProps {
  application: DriverApplication;
  documents: DriverDocument[];
  onBack: () => void;
  onApprove: () => void;
  onReject: (reason: string) => void;
}

export default function ApplicationReviewDetail({
  application,
  documents,
  onBack,
  onApprove,
  onReject
}: ApplicationReviewDetailProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [documentUrls, setDocumentUrls] = useState<{[key: string]: string}>({});

  const getDocumentDisplayUrl = async (documentUrl: string) => {
    if (documentUrls[documentUrl]) {
      return documentUrls[documentUrl];
    }

    try {
      const { data } = await supabase.storage
        .from(documentUrl.includes('driver-verification') ? 'driver-verification' : 'driver-documents')
        .createSignedUrl(documentUrl.split('/').slice(1).join('/'), 60 * 5); // 5 minutes

      if (data?.signedUrl) {
        setDocumentUrls(prev => ({ ...prev, [documentUrl]: data.signedUrl }));
        return data.signedUrl;
      }
    } catch (error) {
      console.error('Error creating signed URL:', error);
    }
    return null;
  };

  const handleReject = () => {
    if (rejectionReason.trim()) {
      onReject(rejectionReason);
      setShowRejectForm(false);
      setRejectionReason("");
    }
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case 'profile_picture':
      case 'selfie_verification':
        return User;
      case 'drivers_license':
      case 'vehicle_registration':
      case 'insurance':
        return FileText;
      default:
        return FileText;
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case 'profile_picture':
        return 'Profile Picture';
      case 'selfie_verification':
        return 'Selfie Verification';
      case 'drivers_license':
        return 'Driver\'s License';
      case 'vehicle_registration':
        return 'Vehicle Registration';
      case 'insurance':
        return 'Insurance Certificate';
      default:
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Applications
          </Button>
          <div>
            <h2 className="text-2xl font-bold">{application.driver.full_name}</h2>
            <p className="text-muted-foreground">{application.driver.email}</p>
          </div>
        </div>
        <Badge 
          variant={
            application.status === 'approved' ? 'default' :
            application.status === 'rejected' ? 'destructive' :
            'secondary'
          }
        >
          {application.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Date of Birth</Label>
              <p className="text-sm text-muted-foreground">{new Date(application.date_of_birth).toLocaleDateString()}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Phone</Label>
              <p className="text-sm text-muted-foreground">{application.phone_number}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Address</Label>
              <p className="text-sm text-muted-foreground">
                {application.address}<br />
                {application.city}, {application.state} {application.zip_code}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Emergency Contact</Label>
              <p className="text-sm text-muted-foreground">
                {application.emergency_contact_name}<br />
                {application.emergency_contact_phone}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Driving Experience</Label>
              <p className="text-sm text-muted-foreground">{application.driving_experience_years} years</p>
            </div>
            {application.has_criminal_record && (
              <div>
                <Label className="text-sm font-medium">Criminal Record Details</Label>
                <p className="text-sm text-muted-foreground">{application.criminal_record_details}</p>
              </div>
            )}
            {application.previous_violations && (
              <div>
                <Label className="text-sm font-medium">Previous Violations</Label>
                <p className="text-sm text-muted-foreground">{application.previous_violations}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Car className="w-5 h-5 mr-2" />
              Vehicle Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {application.vehicle ? (
              <>
                <div>
                  <Label className="text-sm font-medium">Vehicle</Label>
                  <p className="text-sm text-muted-foreground">
                    {application.vehicle.year} {application.vehicle.make} {application.vehicle.model}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Color</Label>
                  <p className="text-sm text-muted-foreground">{application.vehicle.color}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">License Plate</Label>
                  <p className="text-sm text-muted-foreground">{application.vehicle.license_plate}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">VIN</Label>
                  <p className="text-sm text-muted-foreground">{application.vehicle.vin}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm text-muted-foreground">{application.vehicle.vehicle_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Seats</Label>
                  <p className="text-sm text-muted-foreground">{application.vehicle.seats}</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No vehicle information provided</p>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {documents.length > 0 ? (
              documents.map((doc) => {
                const Icon = getDocumentTypeIcon(doc.document_type);
                return (
                  <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{getDocumentTypeLabel(doc.document_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          Uploaded {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        const url = await getDocumentDisplayUrl(doc.document_url);
                        if (url) {
                          window.open(url, '_blank');
                        }
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      {application.status === 'pending' || application.status === 'documents_submitted' ? (
        <Card>
          <CardHeader>
            <CardTitle>Review Actions</CardTitle>
            <CardDescription>Approve or reject this driver application</CardDescription>
          </CardHeader>
          <CardContent>
            {showRejectForm ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rejection-reason">Rejection Reason</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a detailed reason for rejection..."
                    className="mt-2"
                  />
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectionReason.trim()}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject Application
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowRejectForm(false);
                      setRejectionReason("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button
                  onClick={onApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Application
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectForm(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Application
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        application.rejection_reason && (
          <Card>
            <CardHeader>
              <CardTitle className="text-red-700">Application Rejected</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{application.rejection_reason}</p>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
}