import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import AuthForm from "@/components/auth/AuthForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, Users, Car, DollarSign, AlertTriangle, LogOut, FileCheck, Eye, CheckCircle, XCircle, Clock } from "lucide-react";
import ApplicationReviewDetail from "@/components/admin/ApplicationReviewDetail";
import AdminRoleGuard from "@/components/admin/AdminRoleGuard";
import OngoingTripsView from "@/components/admin/OngoingTripsView";
import RiderManagement from "@/components/admin/RiderManagement";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  admin_role?: string;
  rating: number;
  total_ratings: number;
  created_at: string;
}

interface Ride {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  final_fare: number;
  status: string;
  created_at: string;
  rider: { full_name: string; email: string };
  driver: { full_name: string; email: string } | null;
}

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

export default function Admin() {
  const { user, profile, loading, signOut } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [driverApplications, setDriverApplications] = useState<DriverApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<DriverApplication | null>(null);
  const [applicationDocuments, setApplicationDocuments] = useState<DriverDocument[]>([]);
  const [adminPermissions, setAdminPermissions] = useState<{[key: string]: boolean}>({});
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDrivers: 0,
    totalRiders: 0,
    totalRides: 0,
    totalRevenue: 0,
    pendingApplications: 0
  });

  // Fetch data if admin
  useEffect(() => {
    if (profile?.role === 'admin') {
      console.log('User is admin, starting data fetch...');
      // Prioritize critical data first
      fetchAdminPermissions();
      fetchStats();
      fetchDriverApplications();
      
      // Delay non-critical data to improve perceived performance
      setTimeout(() => {
        console.log('Loading additional data...');
        fetchUsers();
        fetchRides();
      }, 100);
    } else if (profile && profile.role === 'rider') {
      console.log('User is rider, not admin');
    } else if (profile && profile.role === 'driver') {
      console.log('User is driver, not admin');
    }
  }, [profile]);

  const fetchAdminPermissions = async () => {
    try {
      const permissions = ['users', 'drivers', 'riders', 'rides', 'applications', 'pricing'];
      const permissionChecks = await Promise.all(
        permissions.map(async (permission) => {
          const { data } = await supabase.rpc('check_admin_permission', {
            required_permission: permission,
            operation_type: 'write'
          });
          return { [permission]: data };
        })
      );
      
      const permissionsObj = permissionChecks.reduce((acc, curr) => ({ ...acc, ...curr }), {});
      setAdminPermissions(permissionsObj);
    } catch (error) {
      console.error('Error fetching admin permissions:', error);
    }
  };


  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          rider:profiles!rides_rider_id_fkey(full_name, email),
          driver:profiles!rides_driver_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setRides(data || []);
    } catch (error) {
      console.error('Error fetching rides:', error);
    }
  };

  const fetchDriverApplications = async () => {
    console.log('Fetching driver applications...');
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select(`
          *,
          driver:profiles!driver_applications_driver_id_fkey(id, full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(20); // Limit initial load to improve performance

      if (error) throw error;
      console.log('Applications fetched:', data?.length || 0, 'data:', data);
      console.log('First application:', data?.[0]);
      // Only fetch vehicle info for applications that need it (not all at once)
      const applicationsWithVehicles = data || [];
      
      setDriverApplications(applicationsWithVehicles as DriverApplication[]);
      
      // Fetch vehicle data lazily
      if (data && data.length > 0) {
        setTimeout(async () => {
          const withVehicles = await Promise.all(data.map(async (app: any) => {
            const { data: vehicleData } = await supabase
              .from('vehicles')
              .select('*')
              .eq('driver_id', app.driver.id)
              .single();
            
            return {
              ...app,
              vehicle: vehicleData
            };
          }));
          setDriverApplications(withVehicles as DriverApplication[]);
        }, 500);
      }
    } catch (error) {
      console.error('Error fetching driver applications:', error);
    }
  };

  const fetchApplicationDocuments = async (driverId: string) => {
    try {
      const { data, error } = await supabase
        .from('driver_documents')
        .select('*')
        .eq('driver_id', driverId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplicationDocuments(data || []);
    } catch (error) {
      console.error('Error fetching application documents:', error);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: string, rejectionReason?: string) => {
    try {
      const updateData: any = {
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      };

      if (rejectionReason) {
        updateData.rejection_reason = rejectionReason;
      }

      const { error } = await supabase
        .from('driver_applications')
        .update(updateData)
        .eq('id', applicationId);

      if (error) throw error;

      // Refresh applications
      fetchDriverApplications();
      setSelectedApplication(null);
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const [usersRes, ridesRes, applicationsRes] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('rides').select('final_fare, status'),
        supabase.from('driver_applications').select('status')
      ]);

      const users = usersRes.data || [];
      const rides = ridesRes.data || [];
      const applications = applicationsRes.data || [];

      const totalUsers = users.length;
      const totalDrivers = users.filter(u => u.role === 'driver').length;
      const totalRiders = users.filter(u => u.role === 'rider').length;
      const totalRides = rides.length;
      const totalRevenue = rides
        .filter(r => r.status === 'completed' && r.final_fare)
        .reduce((sum, r) => sum + Number(r.final_fare), 0);
      const pendingApplications = applications.filter(a => a.status === 'pending' || a.status === 'documents_submitted').length;

      setStats({
        totalUsers,
        totalDrivers,
        totalRiders,
        totalRides,
        totalRevenue,
        pendingApplications
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm onSuccess={() => window.location.reload()} />;
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Access Denied</CardTitle>
            <CardDescription>
              This admin panel is restricted to administrators only.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={signOut} variant="outline" className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Ubify Admin</h1>
              <p className="text-sm text-muted-foreground">Platform Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="font-medium">{profile?.full_name}</p>
              <Badge variant="secondary">
                {profile?.admin_role?.replace('_', ' ') || 'Administrator'}
              </Badge>
            </div>
            <Button onClick={signOut} variant="outline" size="sm">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalDrivers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Riders</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRiders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRides}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Applications</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApplications}</div>
            </CardContent>
          </Card>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="ongoing-trips" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ongoing-trips">Ongoing Trips</TabsTrigger>
            <TabsTrigger value="applications">Driver Applications</TabsTrigger>
            <TabsTrigger value="riders">Rider Management</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="rides">Ride History</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="ongoing-trips">
            <OngoingTripsView />
          </TabsContent>

          <TabsContent value="applications">
            <AdminRoleGuard permission="applications" operation="read">
              {selectedApplication ? (
                <ApplicationReviewDetail 
                  application={selectedApplication}
                  documents={applicationDocuments}
                  onBack={() => setSelectedApplication(null)}
                  onApprove={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                  onReject={(reason: string) => updateApplicationStatus(selectedApplication.id, 'rejected', reason)}
                />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Driver Applications</CardTitle>
                    <CardDescription>Review and approve driver applications</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Driver</TableHead>
                          <TableHead>Applied</TableHead>
                          <TableHead>Experience</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {driverApplications.filter(app => app?.driver != null).map((application) => (
                          <TableRow key={application.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{application.driver?.full_name || 'N/A'}</div>
                                <div className="text-sm text-muted-foreground">{application.driver?.email || 'N/A'}</div>
                              </div>
                            </TableCell>
                            <TableCell>{application?.created_at ? new Date(application.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                            <TableCell>{application.driving_experience_years} years</TableCell>
                            <TableCell>
                              {application.vehicle ? 
                                `${application.vehicle.year} ${application.vehicle.make} ${application.vehicle.model}` :
                                'Not provided'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  application.status === 'approved' ? 'default' :
                                  application.status === 'rejected' ? 'destructive' :
                                  'secondary'
                                }
                              >
                                {application.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  if (application?.driver?.id) {
                                    setSelectedApplication(application);
                                    fetchApplicationDocuments(application.driver.id);
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Review
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </AdminRoleGuard>
          </TabsContent>

          <TabsContent value="riders">
            <RiderManagement />
          </TabsContent>

          <TabsContent value="users">
            <AdminRoleGuard permission="users" operation="read">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>Manage platform users and their roles</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Admin Role</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.filter(user => user != null).map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user?.full_name || 'N/A'}</TableCell>
                          <TableCell>{user?.email || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant={user?.role === 'admin' ? 'destructive' : user?.role === 'driver' ? 'default' : 'secondary'}>
                              {user?.role || 'Unknown'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(user as any)?.admin_role && (
                              <Badge variant="outline">
                                {(user as any).admin_role.replace('_', ' ')}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {user?.rating ? `${user.rating.toFixed(1)} (${user.total_ratings || 0} reviews)` : 'No rating'}
                          </TableCell>
                          <TableCell>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </AdminRoleGuard>
          </TabsContent>

          <TabsContent value="rides">
            <AdminRoleGuard permission="rides" operation="read">
              <Card>
                <CardHeader>
                  <CardTitle>Ride History</CardTitle>
                  <CardDescription>View all completed and historical rides</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rider</TableHead>
                        <TableHead>Driver</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Fare</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rides.filter(ride => ride != null).map((ride) => (
                        <TableRow key={ride.id}>
                          <TableCell>{ride.rider?.full_name || 'N/A'}</TableCell>
                          <TableCell>{ride.driver?.full_name || 'Unassigned'}</TableCell>
                          <TableCell>
                            <div className="max-w-xs truncate">
                              {ride.pickup_location} → {ride.dropoff_location}
                            </div>
                          </TableCell>
                          <TableCell>${ride.final_fare?.toFixed(2) || 'TBD'}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                ride.status === 'completed' ? 'default' :
                                ride.status === 'in_progress' ? 'secondary' :
                                ride.status === 'cancelled' ? 'destructive' :
                                'outline'
                              }
                            >
                              {ride.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(ride.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </AdminRoleGuard>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>Support & Reports</CardTitle>
                <CardDescription>Handle user reports and support tickets</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Support ticket system coming soon. Users can report issues and disputes here.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}