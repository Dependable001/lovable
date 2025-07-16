import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Clock, DollarSign, Navigation, Phone, Eye, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import AdminRoleGuard from "./AdminRoleGuard";

interface OngoingRide {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  pickup_lat?: number;
  pickup_lng?: number;
  dropoff_lat?: number;
  dropoff_lng?: number;
  estimated_fare_min?: number;
  estimated_fare_max?: number;
  final_fare?: number;
  payment_method?: string;
  status: string;
  created_at: string;
  updated_at: string;
  rider: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    rating: number;
    total_ratings: number;
  };
  driver: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
    rating: number;
    total_ratings: number;
  } | null;
  vehicle?: {
    make: string;
    model: string;
    year: number;
    color: string;
    license_plate: string;
  } | null;
}

export default function OngoingTripsView() {
  const [rides, setRides] = useState<OngoingRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRide, setSelectedRide] = useState<OngoingRide | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchOngoingRides();
    
    // Set up real-time updates every 10 seconds
    const interval = setInterval(fetchOngoingRides, 10000);
    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const fetchOngoingRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          *,
          rider:profiles!rides_rider_id_fkey(id, full_name, email, phone, rating, total_ratings),
          driver:profiles!rides_driver_id_fkey(id, full_name, email, phone, rating, total_ratings)
        `)
        .in('status', ['pending', 'accepted', 'in_progress', 'arrived'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch vehicle info separately for each ride with driver
      const ridesWithVehicles = await Promise.all((data || []).map(async (ride: any) => {
        let vehicle = null;
        if (ride.driver?.id) {
          const { data: vehicleData } = await supabase
            .from('vehicles')
            .select('make, model, year, color, license_plate')
            .eq('driver_id', ride.driver.id)
            .single();
          
          vehicle = vehicleData;
        }
        
        return {
          ...ride,
          vehicle
        };
      }));
      
      setRides(ridesWithVehicles as OngoingRide[]);
    } catch (error) {
      console.error('Error fetching ongoing rides:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      case 'arrived': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return Clock;
      case 'accepted': return Navigation;
      case 'in_progress': return MapPin;
      case 'arrived': return MapPin;
      default: return Clock;
    }
  };

  const calculateDuration = (createdAt: string) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMinutes = Math.floor((now.getTime() - created.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return `${diffMinutes}m`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m`;
    }
  };

  const filteredRides = rides.filter(ride => {
    const matchesSearch = 
      ride.rider.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.driver?.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.pickup_location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.dropoff_location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ride.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (selectedRide) {
    return <RideDetailView ride={selectedRide} onBack={() => setSelectedRide(null)} />;
  }

  return (
    <AdminRoleGuard permission="rides" operation="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Ongoing Trips</h2>
            <p className="text-muted-foreground">Monitor active rides and trip progress in real-time</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchOngoingRides}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search by rider, driver, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="arrived">Arrived</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ride Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {['pending', 'accepted', 'in_progress', 'arrived'].map(status => {
            const count = rides.filter(r => r.status === status).length;
            const StatusIcon = getStatusIcon(status);
            
            return (
              <Card key={status}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium capitalize">{status.replace('_', ' ')}</p>
                      <p className="text-2xl font-bold">{count}</p>
                    </div>
                    <StatusIcon className="w-8 h-8 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Rides Table */}
        <Card>
          <CardHeader>
            <CardTitle>Active Rides ({filteredRides.length})</CardTitle>
            <CardDescription>
              Real-time monitoring of all active trips. Updates every 10 seconds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rider</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRides.map((ride) => {
                  const StatusIcon = getStatusIcon(ride.status);
                  
                  return (
                    <TableRow key={ride.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ride.rider.full_name}</div>
                          <div className="text-sm text-muted-foreground">
                            ⭐ {ride.rider.rating.toFixed(1)} ({ride.rider.total_ratings})
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {ride.driver ? (
                          <div>
                            <div className="font-medium">{ride.driver.full_name}</div>
                            <div className="text-sm text-muted-foreground">
                              ⭐ {ride.driver.rating.toFixed(1)} ({ride.driver.total_ratings})
                            </div>
                            {ride.vehicle && (
                              <div className="text-xs text-muted-foreground">
                                {ride.vehicle.color} {ride.vehicle.make} {ride.vehicle.model}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="truncate text-sm">
                            📍 {ride.pickup_location}
                          </div>
                          <div className="truncate text-sm text-muted-foreground">
                            🎯 {ride.dropoff_location}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(ride.status)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {ride.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {calculateDuration(ride.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {ride.final_fare ? (
                            <span className="font-medium">${ride.final_fare.toFixed(2)}</span>
                          ) : ride.estimated_fare_min && ride.estimated_fare_max ? (
                            <span className="text-muted-foreground">
                              ${ride.estimated_fare_min} - ${ride.estimated_fare_max}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">TBD</span>
                          )}
                          {ride.payment_method && (
                            <div className="text-xs text-muted-foreground capitalize">
                              {ride.payment_method}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedRide(ride)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {filteredRides.length === 0 && !loading && (
              <div className="text-center py-8 text-muted-foreground">
                {rides.length === 0 ? 'No ongoing trips at the moment' : 'No rides match your search criteria'}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminRoleGuard>
  );
}

function RideDetailView({ ride, onBack }: { ride: OngoingRide; onBack: () => void }) {
  return (
    <AdminRoleGuard permission="rides" operation="read">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={onBack}>
            ← Back to Ongoing Trips
          </Button>
          <Badge className={`${
            ride.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            ride.status === 'accepted' ? 'bg-blue-100 text-blue-800' :
            ride.status === 'in_progress' ? 'bg-green-100 text-green-800' :
            'bg-purple-100 text-purple-800'
          }`}>
            {ride.status.replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Rider Information */}
          <Card>
            <CardHeader>
              <CardTitle>Rider Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">{ride.rider.full_name}</p>
                <p className="text-sm text-muted-foreground">{ride.rider.email}</p>
                {ride.rider.phone && (
                  <p className="text-sm text-muted-foreground">📞 {ride.rider.phone}</p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Rating</p>
                <p className="text-sm">⭐ {ride.rider.rating.toFixed(1)} ({ride.rider.total_ratings} trips)</p>
              </div>
            </CardContent>
          </Card>

          {/* Driver Information */}
          <Card>
            <CardHeader>
              <CardTitle>Driver Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ride.driver ? (
                <>
                  <div>
                    <p className="font-medium">{ride.driver.full_name}</p>
                    <p className="text-sm text-muted-foreground">{ride.driver.email}</p>
                    {ride.driver.phone && (
                      <p className="text-sm text-muted-foreground">📞 {ride.driver.phone}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">Rating</p>
                    <p className="text-sm">⭐ {ride.driver.rating.toFixed(1)} ({ride.driver.total_ratings} trips)</p>
                  </div>
                  {ride.vehicle && (
                    <div>
                      <p className="text-sm font-medium">Vehicle</p>
                      <p className="text-sm">
                        {ride.vehicle.year} {ride.vehicle.make} {ride.vehicle.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {ride.vehicle.color} • {ride.vehicle.license_plate}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground">No driver assigned yet</p>
              )}
            </CardContent>
          </Card>

          {/* Trip Details */}
          <Card>
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Route</p>
                <p className="text-sm">📍 {ride.pickup_location}</p>
                <p className="text-sm">🎯 {ride.dropoff_location}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Pricing</p>
                {ride.final_fare ? (
                  <p className="text-sm font-bold">${ride.final_fare.toFixed(2)}</p>
                ) : (
                  <p className="text-sm">
                    Est. ${ride.estimated_fare_min} - ${ride.estimated_fare_max}
                  </p>
                )}
                {ride.payment_method && (
                  <p className="text-sm text-muted-foreground capitalize">
                    Payment: {ride.payment_method}
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Timeline</p>
                <p className="text-sm">Created: {new Date(ride.created_at).toLocaleString()}</p>
                <p className="text-sm">Updated: {new Date(ride.updated_at).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminRoleGuard>
  );
}