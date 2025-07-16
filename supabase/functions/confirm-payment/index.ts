import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) throw new Error("Missing paymentIntentId");
    logStep("Request data received", { paymentIntentId });

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logStep("Payment intent retrieved", { 
      status: paymentIntent.status, 
      amount: paymentIntent.amount 
    });

    if (paymentIntent.status === "succeeded") {
      const rideId = paymentIntent.metadata.rideId;
      const amount = paymentIntent.amount / 100; // Convert from cents

      // Update ride with final payment details
      const { error: updateError } = await supabaseClient
        .from("rides")
        .update({ 
          final_fare: amount,
          status: "completed",
          completed_at: new Date().toISOString(),
          fare_breakdown: {
            paymentIntentId: paymentIntent.id,
            amount: amount,
            currency: "usd",
            status: "paid"
          }
        })
        .eq("id", rideId);

      if (updateError) throw updateError;
      logStep("Ride updated with payment confirmation", { rideId, amount });

      return new Response(JSON.stringify({
        success: true,
        amount: amount,
        rideId: rideId
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({
        success: false,
        status: paymentIntent.status
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in confirm-payment", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});