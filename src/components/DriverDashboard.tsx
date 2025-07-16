import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Car, DollarSign, Clock, MapPin, Star, CheckCircle, XCircle, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

interface DriverDashboardProps {
  onBack: () => void;
}

interface RideRequest {
  id: string;
  riderName: string;
  pickup: string;
  destination: string;
  distance: string;
  estimatedTime: string;
  suggestedFare: number;
  counterOffer?: number;
  status: "pending" | "counter" | "accepted" | "declined";
}

const DriverDashboard = ({ onBack }: DriverDashboardProps) => {
  const [isOnline, setIsOnline] = useState(false);
  const [customPrice, setCustomPrice] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<string | null>(null);

  const rideRequests: RideRequest[] = [
    {
      id: "1",
      riderName: "Jennifer L.",
      pickup: "Downtown Plaza",
      destination: "Airport Terminal 2",
      distance: "12.5 miles",
      estimatedTime: "25 min",
      suggestedFare: 28.50,
      status: "pending"
    },
    {
      id: "2",
      riderName: "Robert K.",
      pickup: "University Campus",
      destination: "Shopping Mall",
      distance: "3.2 miles", 
      estimatedTime: "12 min",
      suggestedFare: 15.00,
      counterOffer: 18.00,
      status: "counter"
    },
    {
      id: "3",
      riderName: "Maria S.",
      pickup: "Business District",
      destination: "Residential Area",
      distance: "7.8 miles",
      estimatedTime: "18 min",
      suggestedFare: 22.00,
      status: "pending"
    }
  ];

  const handleAcceptRequest = (requestId: string, price: number) => {
    alert(`Ride request accepted for $${price.toFixed(2)}!`);
    setSelectedRequest(requestId);
  };

  const handleDeclineRequest = (requestId: string) => {
    alert("Ride request declined.");
  };

  const handleSetCustomPrice = (requestId: string) => {
    if (customPrice) {
      alert(`Custom offer of $${customPrice} sent to rider!`);
      setCustomPrice("");
    }
  };

  const stats = {
    todayEarnings: 234.50,
    totalRides: 12,
    rating: 4.8,
    completionRate: 98
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={onBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Driver Dashboard</h1>
                <p className="text-muted-foreground">Control your pricing and accept rides</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  {isOnline ? "Online" : "Offline"}
                </span>
                <Switch checked={isOnline} onCheckedChange={setIsOnline} />
              </div>
              <Badge variant={isOnline ? "default" : "secondary"} className="px-3 py-1">
                {isOnline ? "Available" : "Unavailable"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-ubify-primary/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-ubify-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Today's Earnings</p>
                  <p className="text-2xl font-bold text-ubify-primary">${stats.todayEarnings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-ubify-trust/20 flex items-center justify-center">
                  <Car className="h-6 w-6 text-ubify-trust" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rides Today</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalRides}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-ubify-secondary/20 flex items-center justify-center">
                  <Star className="h-6 w-6 text-ubify-secondary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold text-foreground">{stats.rating}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Completion</p>
                  <p className="text-2xl font-bold text-foreground">{stats.completionRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ride Requests */}
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              {isOnline ? "Incoming Ride Requests" : "Go Online to Receive Requests"}
            </h2>
            <p className="text-muted-foreground">
              Set your own prices and choose which rides to accept
            </p>
          </div>

          {!isOnline ? (
            <Card className="text-center p-12">
              <CardContent>
                <Car className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-foreground mb-2">You're Currently Offline</h3>
                <p className="text-muted-foreground mb-6">
                  Turn on your availability to start receiving ride requests from nearby riders.
                </p>
                <Button variant="ubify" onClick={() => setIsOnline(true)}>
                  Go Online
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {rideRequests.map((request) => (
                <Card key={request.id} className="border-border/50 hover:border-ubify-primary/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-full bg-ubify-trust/20 flex items-center justify-center">
                            <span className="font-semibold text-ubify-trust">
                              {request.riderName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{request.riderName}</h3>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>{request.estimatedTime}</span>
                              <span>•</span>
                              <span>{request.distance}</span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-ubify-primary"></div>
                            <span className="text-muted-foreground">Pickup:</span>
                            <span className="text-foreground font-medium">{request.pickup}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-ubify-secondary"></div>
                            <span className="text-muted-foreground">Destination:</span>
                            <span className="text-foreground font-medium">{request.destination}</span>
                          </div>
                        </div>

                        {request.status === "counter" && (
                          <div className="mt-4 p-3 bg-ubify-secondary/10 rounded-lg border border-ubify-secondary/20">
                            <p className="text-sm font-medium text-ubify-secondary">
                              Counter Offer: ${request.counterOffer?.toFixed(2)}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-ubify-primary">
                            ${request.suggestedFare.toFixed(2)}
                          </div>
                          <p className="text-xs text-muted-foreground">Suggested fare</p>
                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                          {/* Custom Price Input */}
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              placeholder="Your price"
                              value={customPrice}
                              onChange={(e) => setCustomPrice(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="ubify-outline"
                              size="sm"
                              onClick={() => handleSetCustomPrice(request.id)}
                              disabled={!customPrice}
                            >
                              Set Price
                            </Button>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              variant="ubify"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleAcceptRequest(request.id, request.suggestedFare)}
                              disabled={selectedRequest !== null}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Accept
                            </Button>
                            
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDeclineRequest(request.id)}
                              disabled={selectedRequest !== null}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Decline
                            </Button>
                          </div>

                          {request.status === "counter" && (
                            <Button
                              variant="trust"
                              size="sm"
                              className="w-full"
                              onClick={() => handleAcceptRequest(request.id, request.counterOffer!)}
                              disabled={selectedRequest !== null}
                            >
                              Accept Counter (${request.counterOffer?.toFixed(2)})
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Subscription Info */}
        <Card className="mt-8 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Driver Subscription</CardTitle>
            <CardDescription className="text-center">
              Keep 100% of your earnings with our fair subscription model
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-foreground mb-2">Weekly Plan</h3>
                <div className="text-2xl font-bold text-ubify-primary mb-2">$29</div>
                <p className="text-sm text-muted-foreground">Perfect for part-time drivers</p>
              </div>
              <div className="p-4 border rounded-lg border-ubify-primary bg-ubify-primary/10">
                <h3 className="font-semibold text-foreground mb-2">Monthly Plan</h3>
                <div className="text-2xl font-bold text-ubify-primary mb-2">$99</div>
                <p className="text-sm text-muted-foreground">Best value for full-time drivers</p>
                <Badge className="mt-2">Current Plan</Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              No commission fees • Keep 100% of your fares • Cancel anytime
            </p>
            <Button variant="ubify-outline">
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverDashboard;