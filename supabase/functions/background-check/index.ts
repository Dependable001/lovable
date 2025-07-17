import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helper logging function
const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BACKGROUND-CHECK] ${step}${detailsStr}`);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");
    
    // Initialize Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Initialize Supabase client with the anon key for user authentication
    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verify user authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Authorization header is missing");
    
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseAnon.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    
    logStep("User authenticated", { userId: user.id });

    // Get request data
    const { applicationId, action } = await req.json();
    if (!applicationId) throw new Error("Application ID is required");
    
    logStep("Request data received", { applicationId, action });

    // Check if the user is an admin
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    
    if (profile?.role !== "admin") {
      throw new Error("Only admins can perform background checks");
    }

    // Get the application data
    const { data: application, error: applicationError } = await supabaseAdmin
      .from("driver_applications")
      .select(`
        *,
        driver:profiles(*)
      `)
      .eq("id", applicationId)
      .single();
    
    if (applicationError || !application) {
      throw new Error(`Application not found: ${applicationError?.message || "Unknown error"}`);
    }

    // Simulate background check API integration
    // In a real implementation, this would call an external service like Checkr or Sterling
    const simulateBackgroundCheckAPI = async (application: any) => {
      // Simulating background check delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, we'll do a simple check based on driving experience
      const hasViolations = application.previous_violations !== null;
      const hasCriminalRecord = application.has_criminal_record;
      const experienceYears = application.driving_experience_years;
      
      const checks = {
        identityVerified: true,
        criminalHistoryCheck: {
          passed: !hasCriminalRecord,
          details: hasCriminalRecord ? "Criminal record found" : "No criminal history found"
        },
        drivingRecordCheck: {
          passed: experienceYears >= 2 && !hasViolations,
          details: hasViolations 
            ? "Driving violations found in record" 
            : (experienceYears < 2 
                ? "Insufficient driving experience" 
                : "Driving record check passed")
        },
        ssn_verification: {
          passed: true,
          details: "SSN verified successfully"
        },
        sex_offender_check: {
          passed: true,
          details: "No records found"
        },
        global_watchlist_check: {
          passed: true,
          details: "No records found"
        }
      };
      
      const passed = checks.criminalHistoryCheck.passed && 
                     checks.drivingRecordCheck.passed &&
                     checks.ssn_verification.passed &&
                     checks.sex_offender_check.passed &&
                     checks.global_watchlist_check.passed;
      
      return {
        passed,
        checks,
        report_id: `BG-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        completed_at: new Date().toISOString()
      };
    };

    let result;
    
    switch (action) {
      case "initiate": {
        // Update application status to "background_check_in_progress"
        const { error: updateError } = await supabaseAdmin
          .from("driver_applications")
          .update({
            status: "background_check_in_progress",
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
          })
          .eq("id", applicationId);
        
        if (updateError) throw new Error(`Failed to update application: ${updateError.message}`);
        
        result = { 
          message: "Background check initiated",
          status: "background_check_in_progress"
        };
        break;
      }
      
      case "check_status": {
        // Get current status
        result = { 
          message: "Background check in progress",
          status: application.status
        };
        break;
      }
      
      case "complete": {
        // Simulate completing the background check
        const checkResult = await simulateBackgroundCheckAPI(application);
        
        // Update application based on check result
        const newStatus = checkResult.passed ? "approved" : "rejected";
        const rejectionReason = !checkResult.passed ? "Failed background check" : null;
        
        const { error: updateError } = await supabaseAdmin
          .from("driver_applications")
          .update({
            status: newStatus,
            rejection_reason: rejectionReason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
          })
          .eq("id", applicationId);
        
        if (updateError) throw new Error(`Failed to update application: ${updateError.message}`);
        
        // If approved, update the driver's role in profiles
        if (checkResult.passed && application.driver?.id) {
          const { error: profileUpdateError } = await supabaseAdmin
            .from("profiles")
            .update({ role: "driver" })
            .eq("id", application.driver.id);
          
          if (profileUpdateError) {
            logStep("WARNING: Failed to update driver role", { error: profileUpdateError.message });
          }
        }
        
        result = { 
          message: `Background check ${checkResult.passed ? 'passed' : 'failed'}`,
          status: newStatus,
          report: checkResult
        };
        break;
      }
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    logStep("ERROR", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});