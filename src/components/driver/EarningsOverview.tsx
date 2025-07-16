import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Car,
  Star,
  MapPin,
  Calendar,
  BarChart3,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow, format, startOfWeek, startOfMonth, startOfDay } from "date-fns";

interface EarningsOverviewProps {
  driverId: string;
}

interface EarningsData {
  totalEarnings: number;
  ridesCompleted: number;
  averageFare: number;
  totalDistance: number;
  totalTime: number;
  averageRating: number;
}

interface RecentRide {
  id: string;
  pickup_location: string;
  dropoff_location: string;
  final_fare: number;
  distance_miles: number;
  duration_minutes: number;
  completed_at: string;
  rider: {
    full_name: string;
    rating: number;
  };
}

export default function EarningsOverview({ driverId }: EarningsOverviewProps) {
  const { toast } = useToast();
  
  const [dailyEarnings, setDailyEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    ridesCompleted: 0,
    averageFare: 0,
    totalDistance: 0,
    totalTime: 0,
    averageRating: 0
  });
  
  const [weeklyEarnings, setWeeklyEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    ridesCompleted: 0,
    averageFare: 0,
    totalDistance: 0,
    totalTime: 0,
    averageRating: 0
  });
  
  const [monthlyEarnings, setMonthlyEarnings] = useState<EarningsData>({
    totalEarnings: 0,
    ridesCompleted: 0,
    averageFare: 0,
    totalDistance: 0,
    totalTime: 0,
    averageRating: 0
  });

  const [recentRides, setRecentRides] = useState<RecentRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEarningsData();
    fetchRecentRides();
  }, [driverId]);

  const fetchEarningsData = async () => {
    try {
      const now = new Date();
      const startOfToday = startOfDay(now);
      const startOfThisWeek = startOfWeek(now);
      const startOfThisMonth = startOfMonth(now);

      // Fetch daily earnings
      const { data: dailyData, error: dailyError } = await supabase
        .from('rides')
        .select('final_fare, distance_miles, duration_minutes')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('completed_at', startOfToday.toISOString());

      if (dailyError) throw dailyError;

      // Fetch weekly earnings
      const { data: weeklyData, error: weeklyError } = await supabase
        .from('rides')
        .select('final_fare, distance_miles, duration_minutes')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('completed_at', startOfThisWeek.toISOString());

      if (weeklyError) throw weeklyError;

      // Fetch monthly earnings
      const { data: monthlyData, error: monthlyError } = await supabase
        .from('rides')
        .select('final_fare, distance_miles, duration_minutes')
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .gte('completed_at', startOfThisMonth.toISOString());

      if (monthlyError) throw monthlyError;

      // Calculate earnings data
      setDailyEarnings(calculateEarnings(dailyData || []));
      setWeeklyEarnings(calculateEarnings(weeklyData || []));
      setMonthlyEarnings(calculateEarnings(monthlyData || []));

    } catch (error) {
      console.error('Error fetching earnings data:', error);
      toast({
        title: "Error",
        description: "Failed to load earnings data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentRides = async () => {
    try {
      const { data, error } = await supabase
        .from('rides')
        .select(`
          id,
          pickup_location,
          dropoff_location,
          final_fare,
          distance_miles,
          duration_minutes,
          completed_at,
          rider:profiles!rides_rider_id_fkey(
            full_name,
            rating
          )
        `)
        .eq('driver_id', driverId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentRides(data || []);
    } catch (error) {
      console.error('Error fetching recent rides:', error);
    }
  };

  const calculateEarnings = (rides: any[]): EarningsData => {
    if (rides.length === 0) {
      return {
        totalEarnings: 0,
        ridesCompleted: 0,
        averageFare: 0,
        totalDistance: 0,
        totalTime: 0,
        averageRating: 0
      };
    }

    const totalEarnings = rides.reduce((sum, ride) => sum + (ride.final_fare || 0), 0);
    const totalDistance = rides.reduce((sum, ride) => sum + (ride.distance_miles || 0), 0);
    const totalTime = rides.reduce((sum, ride) => sum + (ride.duration_minutes || 0), 0);

    return {
      totalEarnings,
      ridesCompleted: rides.length,
      averageFare: totalEarnings / rides.length,
      totalDistance,
      totalTime,
      averageRating: 4.8 // Mock data - would need to calculate from rider ratings
    };
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchEarningsData();
    fetchRecentRides();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours === 0) return `${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const EarningsCard = ({ title, data, period }: { title: string; data: EarningsData; period: string }) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(data.totalEarnings)}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Car className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Rides</span>
          </div>
          <p className="text-2xl font-bold">{data.ridesCompleted}</p>
          <p className="text-xs text-muted-foreground">
            Avg: {formatCurrency(data.averageFare)}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Distance</span>
          </div>
          <p className="text-2xl font-bold">{data.totalDistance.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">miles</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Drive Time</span>
          </div>
          <p className="text-2xl font-bold">{formatTime(data.totalTime)}</p>
          <p className="text-xs text-muted-foreground">
            <Star className="h-3 w-3 inline mr-1 fill-yellow-400 text-yellow-400" />
            {data.averageRating.toFixed(1)}
          </p>
        </CardContent>
      </Card>
    </div>
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Earnings Overview
              </CardTitle>
              <CardDescription>
                Track your performance and earnings
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Earnings Tabs */}
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="today" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            This Week
          </TabsTrigger>
          <TabsTrigger value="month" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            This Month
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="today" className="mt-6">
          <EarningsCard title="Today's Earnings" data={dailyEarnings} period="today" />
        </TabsContent>
        
        <TabsContent value="week" className="mt-6">
          <EarningsCard title="Weekly Earnings" data={weeklyEarnings} period="week" />
        </TabsContent>
        
        <TabsContent value="month" className="mt-6">
          <EarningsCard title="Monthly Earnings" data={monthlyEarnings} period="month" />
        </TabsContent>
      </Tabs>

      {/* Recent Rides */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Completed Rides</CardTitle>
          <CardDescription>Your last {recentRides.length} completed trips</CardDescription>
        </CardHeader>
        <CardContent>
          {recentRides.length === 0 ? (
            <div className="text-center py-8">
              <Car className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Completed Rides</h3>
              <p className="text-muted-foreground">
                Your completed rides will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRides.map((ride) => (
                <Card key={ride.id} className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{formatCurrency(ride.final_fare)}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {ride.rider.full_name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs">{ride.rider.rating?.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-green-600" />
                            {ride.pickup_location.substring(0, 40)}...
                          </p>
                          <p className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-red-600" />
                            {ride.dropoff_location.substring(0, 40)}...
                          </p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">
                          {ride.distance_miles?.toFixed(1)} mi • {formatTime(ride.duration_minutes || 0)}
                        </p>
                        <p className="text-muted-foreground">
                          {formatDistanceToNow(new Date(ride.completed_at))} ago
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}