import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Navigation, 
  MapPin, 
  Clock, 
  ArrowRight, 
  RotateCcw,
  Volume2,
  VolumeX,
  Phone,
  MessageCircle
} from 'lucide-react';
import Map from '@/components/ui/map';

interface NavigationStep {
  instruction: string;
  distance: string;
  duration: string;
  maneuver: string;
}

interface TurnByTurnNavigationProps {
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  rideId: string;
  driverPhone?: string;
  onNavigationComplete?: () => void;
}

export const TurnByTurnNavigation: React.FC<TurnByTurnNavigationProps> = ({
  origin,
  destination,
  rideId,
  driverPhone,
  onNavigationComplete
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [steps, setSteps] = useState<NavigationStep[]>([]);
  const [eta, setEta] = useState<string>('--');
  const [distanceRemaining, setDistanceRemaining] = useState<string>('--');
  const speechSynthesis = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      speechSynthesis.current = window.speechSynthesis;
    }
  }, []);

  useEffect(() => {
    // Simulate getting navigation steps from Google Maps API
    const simulatedSteps: NavigationStep[] = [
      {
        instruction: "Head north on Main St toward Oak Ave",
        distance: "0.3 mi",
        duration: "2 min",
        maneuver: "straight"
      },
      {
        instruction: "Turn right onto Oak Ave",
        distance: "0.8 mi", 
        duration: "3 min",
        maneuver: "turn-right"
      },
      {
        instruction: "Continue onto Highway 101 N",
        distance: "2.1 mi",
        duration: "5 min", 
        maneuver: "straight"
      },
      {
        instruction: "Take exit 23 for Downtown",
        distance: "0.5 mi",
        duration: "2 min",
        maneuver: "exit-right"
      },
      {
        instruction: "Turn left onto Park St",
        distance: "0.2 mi",
        duration: "1 min",
        maneuver: "turn-left"
      },
      {
        instruction: "Arrive at destination on the right",
        distance: "0.0 mi",
        duration: "0 min",
        maneuver: "arrive"
      }
    ];
    
    setSteps(simulatedSteps);
    setEta("13 min");
    setDistanceRemaining("3.9 mi");
  }, [origin, destination]);

  const startNavigation = () => {
    setIsNavigating(true);
    announceStep(steps[currentStep]);
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      const nextStepIndex = currentStep + 1;
      setCurrentStep(nextStepIndex);
      announceStep(steps[nextStepIndex]);
      
      if (nextStepIndex === steps.length - 1) {
        onNavigationComplete?.();
      }
    }
  };

  const announceStep = (step: NavigationStep) => {
    if (voiceEnabled && speechSynthesis.current) {
      speechSynthesis.current.cancel(); // Cancel any ongoing speech
      const utterance = new SpeechSynthesisUtterance(step.instruction);
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      speechSynthesis.current.speak(utterance);
    }
  };

  const getManeuverIcon = (maneuver: string) => {
    switch (maneuver) {
      case 'turn-right':
        return <ArrowRight className="h-6 w-6 transform rotate-90" />;
      case 'turn-left': 
        return <ArrowRight className="h-6 w-6 transform -rotate-90" />;
      case 'straight':
        return <ArrowRight className="h-6 w-6" />;
      case 'exit-right':
        return <ArrowRight className="h-6 w-6 transform rotate-45" />;
      case 'arrive':
        return <MapPin className="h-6 w-6" />;
      default:
        return <Navigation className="h-6 w-6" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Turn-by-Turn Navigation
            </CardTitle>
            <Badge variant="secondary">{eta} remaining</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Distance remaining:</span>
            <span className="font-medium">{distanceRemaining}</span>
          </div>
          
          <div className="flex gap-2">
            {!isNavigating ? (
              <Button onClick={startNavigation} className="flex-1">
                <Navigation className="mr-2 h-4 w-4" />
                Start Navigation
              </Button>
            ) : (
              <Button onClick={nextStep} className="flex-1" disabled={currentStep >= steps.length - 1}>
                Next Step
              </Button>
            )}
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => setVoiceEnabled(!voiceEnabled)}
            >
              {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Step */}
      {isNavigating && steps[currentStep] && (
        <Card className="border-primary">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-primary/10 rounded-lg">
                {getManeuverIcon(steps[currentStep].maneuver)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-lg">{steps[currentStep].instruction}</p>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span>{steps[currentStep].distance}</span>
                  <span>{steps[currentStep].duration}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map */}
      <Card>
        <CardContent className="p-0">
          <div className="h-64 rounded-lg overflow-hidden">
            <Map 
              pickupLocation={{
                lat: origin.lat,
                lng: origin.lng,
                address: origin.address
              }}
              dropoffLocation={{
                lat: destination.lat,
                lng: destination.lng,
                address: destination.address
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Steps */}
      {isNavigating && steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Upcoming Steps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.slice(currentStep + 1, currentStep + 4).map((step, index) => (
              <div key={index} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 flex items-center justify-center">
                  {getManeuverIcon(step.maneuver)}
                </div>
                <div className="flex-1">
                  <p className="text-muted-foreground">{step.instruction}</p>
                </div>
                <span className="text-xs text-muted-foreground">{step.distance}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Driver Contact */}
      {driverPhone && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Phone className="mr-2 h-4 w-4" />
                Call Driver
              </Button>
              <Button variant="outline" className="flex-1">
                <MessageCircle className="mr-2 h-4 w-4" />
                Message
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};