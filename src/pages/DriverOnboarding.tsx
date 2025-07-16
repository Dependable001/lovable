import React from 'react';
import { DriverVerificationFlow } from '@/components/driver/DriverVerificationFlow';

export default function DriverOnboarding() {
  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Become a Driver
          </h1>
          <p className="text-muted-foreground">
            Complete the verification process to start earning with our platform
          </p>
        </div>
        
        <DriverVerificationFlow />
      </div>
    </div>
  );
}