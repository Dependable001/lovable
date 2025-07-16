import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, MapPin, DollarSign, Clock, Star, CreditCard, Banknote, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RiderDashboardProps {
  onBack: () => void;
}

interface DriverOffer {
  id: string;
  driverName: string;
  rating: number;
  price: number;
  estimatedTime: string;
  vehicleType: string;
  distance: string;
}

const RiderDashboard = ({ onBack }: RiderDashboardProps) => {
  const [pickup, setPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash">("card");
  const [showOffers, setShowOffers] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<string | null>(null);
  const [counterOffer, setCounterOffer] = useState("");
  const [showCounter, setShowCounter] = useState<string | null>(null);

  const driverOffers: DriverOffer[] = [
    {
      id: "1",
      driverName: "Sarah M.",
      rating: 4.9,
      price: 24.50,
      estimatedTime: "5 min",
      vehicleType: "Toyota Camry",
      distance: "2.3 miles"
    },
    {
      id: "2", 
      driverName: "Mike R.",
      rating: 4.7,
      price: 22.00,
      estimatedTime: "7 min",
      vehicleType: "Honda Civic",
      distance: "2.3 miles"
    },
    {
      id: "3",
      driverName: "Alex K.",
      rating: 4.8,
      price: 26.00,
      estimatedTime: "3 min",
      vehicleType: "Tesla Model 3",
      distance: "2.3 miles"
    }
  ];

  const handleRequestRide = () => {
    if (pickup && destination) {
      setShowOffers(true);
    }
  };

  const handleAcceptOffer = (offerId: string) => {
    setSelectedOffer(offerId);
    // Simulate ride confirmation
    alert("Ride confirmed! Driver is on the way.");
  };

  const handleCounterOffer = (offerId: string) => {
    if (counterOffer) {
      alert(`Counter offer of $${counterOffer} sent to driver!`);
      setShowCounter(null);
      setCounterOffer("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Rider Dashboard</h1>
              <p className="text-muted-foreground">Request a ride and choose your driver</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!showOffers ? (
          <div className="max-w-2xl mx-auto">
            {/* Ride Request Form */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-ubify-trust" />
                  Where are you going?
                </CardTitle>
                <CardDescription>
                  Enter your pickup and destination to see available drivers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Pickup Location
                    </label>
                    <Input
                      placeholder="Enter pickup address..."
                      value={pickup}
                      onChange={(e) => setPickup(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      Destination
                    </label>
                    <Input
                      placeholder="Enter destination address..."
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-3 block">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <Card
                      className={`cursor-pointer transition-all ${
                        paymentMethod === "card"
                          ? "border-ubify-primary bg-ubify-primary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => setPaymentMethod("card")}
                    >
                      <CardContent className="p-4 text-center">
                        <CreditCard className="h-8 w-8 mx-auto mb-2 text-ubify-primary" />
                        <p className="font-medium">Credit Card</p>
                        <p className="text-xs text-muted-foreground">Stripe Payment</p>
                      </CardContent>
                    </Card>
                    
                    <Card
                      className={`cursor-pointer transition-all ${
                        paymentMethod === "cash"
                          ? "border-ubify-secondary bg-ubify-secondary/10"
                          : "border-border hover:border-muted-foreground"
                      }`}
                      onClick={() => setPaymentMethod("cash")}
                    >
                      <CardContent className="p-4 text-center">
                        <Banknote className="h-8 w-8 mx-auto mb-2 text-ubify-secondary" />
                        <p className="font-medium">Cash</p>
                        <p className="text-xs text-muted-foreground">Pay on delivery</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Button
                  variant="ubify"
                  size="lg"
                  className="w-full"
                  onClick={handleRequestRide}
                  disabled={!pickup || !destination}
                >
                  Find Available Drivers
                </Button>
              </CardContent>
            </Card>

            {/* Estimated Fare Range */}
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-2">Estimated Fare Range</h3>
                  <div className="text-3xl font-bold text-ubify-primary mb-2">$18 - $30</div>
                  <p className="text-sm text-muted-foreground">
                    Based on distance and current demand. Final price set by drivers.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Driver Offers */
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-foreground mb-2">Available Drivers</h2>
              <p className="text-muted-foreground">
                Choose from transparent offers or negotiate once for fairness
              </p>
            </div>

            <div className="grid gap-6">
              {driverOffers.map((offer) => (
                <Card key={offer.id} className="border-border/50 hover:border-ubify-primary/50 transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-4 mb-3">
                          <div className="w-12 h-12 rounded-full bg-ubify-primary/20 flex items-center justify-center">
                            <span className="font-semibold text-ubify-primary">
                              {offer.driverName.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground">{offer.driverName}</h3>
                            <div className="flex items-center gap-2">
                              <Star className="h-4 w-4 text-ubify-secondary fill-current" />
                              <span className="text-sm text-muted-foreground">{offer.rating}</span>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-sm text-muted-foreground">{offer.vehicleType}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{offer.estimatedTime} away</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{offer.distance}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-ubify-primary">
                            ${offer.price.toFixed(2)}
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {paymentMethod === "card" ? "Card" : "Cash"}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-2">
                          <Button
                            variant="ubify"
                            size="sm"
                            onClick={() => handleAcceptOffer(offer.id)}
                            disabled={selectedOffer !== null}
                          >
                            Accept Offer
                          </Button>
                          
                          {showCounter === offer.id ? (
                            <div className="flex gap-2 items-center">
                              <Input
                                type="number"
                                placeholder="$"
                                value={counterOffer}
                                onChange={(e) => setCounterOffer(e.target.value)}
                                className="w-20"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCounterOffer(offer.id)}
                              >
                                Send
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setShowCounter(offer.id)}
                              disabled={selectedOffer !== null}
                            >
                              Counter
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Back to Search */}
            <div className="mt-8 text-center">
              <Button variant="ghost" onClick={() => setShowOffers(false)}>
                ← Change pickup or destination
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiderDashboard;