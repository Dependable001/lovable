import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Phone, Star, Calendar, MapPin, DollarSign, Edit, Eye, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminRoleGuard from "./AdminRoleGuard";

interface RiderProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone?: string;
  rating: number;
  total_ratings: number;
  created_at: string;
  updated_at: string;
}

interface RiderStats {
  total_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  total_spent: number;
  avg_fare: number;
  last_ride_date?: string;
}

interface RiderWithStats extends RiderProfile {
  stats: RiderStats;
}

export default function RiderManagement() {
  const [riders, setRiders] = useState<RiderWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRider, setSelectedRider] = useState<RiderWithStats | null>(null);
  const [editingRider, setEditingRider] = useState<RiderProfile | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    phone: "",
    email: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchRiders();
  }, []);

  const fetchRiders = async () => {
    try {
      setLoading(true);
      
      // Fetch all riders
      const { data: ridersData, error: ridersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'rider')
        .order('created_at', { ascending: false });

      if (ridersError) throw ridersError;

      // Fetch ride statistics for each rider
      const ridersWithStats = await Promise.all(
        (ridersData || []).map(async (rider) => {
          const { data: ridesData } = await supabase
            .from('rides')
            .select('status, final_fare, created_at')
            .eq('rider_id', rider.id);

          const rides = ridesData || [];
          const completedRides = rides.filter(r => r.status === 'completed');
          const cancelledRides = rides.filter(r => r.status === 'cancelled');
          const totalSpent = completedRides.reduce((sum, r) => sum + (r.final_fare || 0), 0);
          const lastRide = rides.length > 0 ? 
            new Date(Math.max(...rides.map(r => new Date(r.created_at).getTime()))) : null;

          const stats: RiderStats = {
            total_rides: rides.length,
            completed_rides: completedRides.length,
            cancelled_rides: cancelledRides.length,
            total_spent: totalSpent,
            avg_fare: completedRides.length > 0 ? totalSpent / completedRides.length : 0,
            last_ride_date: lastRide?.toISOString()
          };

          return { ...rider, stats };
        })
      );

      setRiders(ridersWithStats);
    } catch (error) {
      console.error('Error fetching riders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch riders",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditRider = (rider: RiderProfile) => {
    setEditingRider(rider);
    setEditForm({
      full_name: rider.full_name || "",
      phone: rider.phone || "",
      email: rider.email
    });
  };

  const saveRiderChanges = async () => {
    if (!editingRider) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          email: editForm.email,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingRider.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Rider profile updated successfully"
      });

      setEditingRider(null);
      fetchRiders();
    } catch (error) {
      console.error('Error updating rider:', error);
      toast({
        title: "Error",
        description: "Failed to update rider profile",
        variant: "destructive"
      });
    }
  };

  const filteredRiders = riders.filter(rider =>
    rider.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rider.phone?.includes(searchQuery)
  );

  if (selectedRider) {
    return <RiderDetailView rider={selectedRider} onBack={() => setSelectedRider(null)} />;
  }

  return (
    <AdminRoleGuard permission="riders" operation="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Rider Management</h2>
            <p className="text-muted-foreground">Manage rider profiles and view ride history</p>
          </div>
          <div className="text-sm text-muted-foreground">
            Total Riders: {riders.length}
          </div>
        </div>

        {/* Search */}
        <div className="flex space-x-4">
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Rider Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Riders</p>
                  <p className="text-2xl font-bold">{riders.length}</p>
                </div>
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Active This Month</p>
                  <p className="text-2xl font-bold">
                    {riders.filter(r => 
                      r.stats.last_ride_date && 
                      new Date(r.stats.last_ride_date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                    ).length}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Total Revenue</p>
                  <p className="text-2xl font-bold">
                    ${riders.reduce((sum, r) => sum + r.stats.total_spent, 0).toFixed(2)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Avg. Rating</p>
                  <p className="text-2xl font-bold">
                    {riders.length > 0 ? 
                      (riders.reduce((sum, r) => sum + r.rating, 0) / riders.length).toFixed(1) : 
                      '0.0'
                    }
                  </p>
                </div>
                <Star className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Riders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Riders ({filteredRiders.length})</CardTitle>
            <CardDescription>Manage rider profiles and view their activity</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Ride</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRiders.map((rider) => (
                  <TableRow key={rider.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rider.full_name || 'No name'}</div>
                        <div className="text-sm text-muted-foreground">
                          Joined {new Date(rider.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{rider.email}</div>
                        {rider.phone && (
                          <div className="text-sm text-muted-foreground">{rider.phone}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span>{rider.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">({rider.total_ratings})</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{rider.stats.completed_rides}</div>
                        <div className="text-sm text-muted-foreground">
                          {rider.stats.cancelled_rides} cancelled
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">${rider.stats.total_spent.toFixed(2)}</div>
                        {rider.stats.avg_fare > 0 && (
                          <div className="text-sm text-muted-foreground">
                            Avg: ${rider.stats.avg_fare.toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rider.stats.last_ride_date ? (
                        <div className="text-sm">
                          {new Date(rider.stats.last_ride_date).toLocaleDateString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Never</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRider(rider)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <AdminRoleGuard permission="riders" operation="write" fallback={null}>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditRider(rider)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Edit Rider Profile</DialogTitle>
                                <DialogDescription>
                                  Update rider information and contact details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="full_name">Full Name</Label>
                                  <Input
                                    id="full_name"
                                    value={editForm.full_name}
                                    onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="email">Email</Label>
                                  <Input
                                    id="email"
                                    type="email"
                                    value={editForm.email}
                                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="phone">Phone</Label>
                                  <Input
                                    id="phone"
                                    value={editForm.phone}
                                    onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setEditingRider(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={saveRiderChanges}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </AdminRoleGuard>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredRiders.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                {riders.length === 0 ? 'No riders found' : 'No riders match your search criteria'}
              </div>
            )}
          </CardContent>
        </Card>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>
    </AdminRoleGuard>
  );
}

function RiderDetailView({ rider, onBack }: { rider: RiderWithStats; onBack: () => void }) {
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentRides();
  }, [rider.id]);

  const fetchRecentRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          driver:profiles!rides_driver_id_fkey(full_name, email)
        `)
        .eq('rider_id', rider.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecentRides(data || []);
    } catch (error) {
      console.error('Error fetching recent rides:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminRoleGuard permission="riders" operation="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            ← Back to Riders
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rider Profile */}
          <Card>
            <CardHeader>
              <CardTitle>Rider Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Name</Label>
                <p className="text-sm">{rider.full_name || 'No name provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <p className="text-sm">{rider.email}</p>
              </div>
              {rider.phone && (
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{rider.phone}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium">Rating</Label>
                <div className="flex items-center space-x-2">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{rider.rating.toFixed(1)} ({rider.total_ratings} ratings)</span>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Member Since</Label>
                <p className="text-sm">{new Date(rider.created_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          {/* Trip Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Statistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Total Trips</Label>
                  <p className="text-2xl font-bold">{rider.stats.total_rides}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Completed</Label>
                  <p className="text-2xl font-bold text-green-600">{rider.stats.completed_rides}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Cancelled</Label>
                  <p className="text-2xl font-bold text-red-600">{rider.stats.cancelled_rides}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Success Rate</Label>
                  <p className="text-2xl font-bold">
                    {rider.stats.total_rides > 0 ? 
                      Math.round((rider.stats.completed_rides / rider.stats.total_rides) * 100) : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Total Spent</Label>
                <p className="text-2xl font-bold">${rider.stats.total_spent.toFixed(2)}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Average Fare</Label>
                <p className="text-xl font-bold">${rider.stats.avg_fare.toFixed(2)}</p>
              </div>
              {rider.stats.last_ride_date && (
                <div>
                  <Label className="text-sm font-medium">Last Ride</Label>
                  <p className="text-sm">{new Date(rider.stats.last_ride_date).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Rides */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Rides</CardTitle>
            <CardDescription>Last 20 rides ordered by date</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Fare</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentRides.map((ride) => (
                    <TableRow key={ride.id}>
                      <TableCell className="text-sm">
                        {new Date(ride.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="truncate text-sm">📍 {ride.pickup_location}</div>
                          <div className="truncate text-sm text-muted-foreground">🎯 {ride.dropoff_location}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ride.driver ? ride.driver.full_name : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          ride.status === 'completed' ? 'default' :
                          ride.status === 'cancelled' ? 'destructive' :
                          'secondary'
                        }>
                          {ride.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {ride.final_fare ? `$${ride.final_fare.toFixed(2)}` : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            
            {!loading && recentRides.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No rides found for this rider
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRoleGuard>
  );
}