export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_permissions: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role_type"]
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string
          id: string
          permission_name: string
        }
        Insert: {
          admin_role: Database["public"]["Enums"]["admin_role_type"]
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string
          id?: string
          permission_name: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role_type"]
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string
          id?: string
          permission_name?: string
        }
        Relationships: []
      }
      driver_applications: {
        Row: {
          address: string
          background_check_consent: boolean
          background_check_consent_at: string | null
          city: string
          created_at: string
          criminal_record_details: string | null
          date_of_birth: string
          driver_id: string
          driving_experience_years: number
          emergency_contact_name: string
          emergency_contact_phone: string
          has_criminal_record: boolean
          id: string
          phone_number: string
          previous_violations: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          state: string
          status: string
          terms_accepted: boolean
          terms_accepted_at: string | null
          updated_at: string
          zip_code: string
        }
        Insert: {
          address: string
          background_check_consent?: boolean
          background_check_consent_at?: string | null
          city: string
          created_at?: string
          criminal_record_details?: string | null
          date_of_birth: string
          driver_id: string
          driving_experience_years: number
          emergency_contact_name: string
          emergency_contact_phone: string
          has_criminal_record?: boolean
          id?: string
          phone_number: string
          previous_violations?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state: string
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          zip_code: string
        }
        Update: {
          address?: string
          background_check_consent?: boolean
          background_check_consent_at?: string | null
          city?: string
          created_at?: string
          criminal_record_details?: string | null
          date_of_birth?: string
          driver_id?: string
          driving_experience_years?: number
          emergency_contact_name?: string
          emergency_contact_phone?: string
          has_criminal_record?: boolean
          id?: string
          phone_number?: string
          previous_violations?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          state?: string
          status?: string
          terms_accepted?: boolean
          terms_accepted_at?: string | null
          updated_at?: string
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_applications_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_documents: {
        Row: {
          created_at: string
          document_type: string
          document_url: string | null
          driver_id: string
          expires_at: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url?: string | null
          driver_id: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string | null
          driver_id?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_documents_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_locations: {
        Row: {
          created_at: string
          driver_id: string
          heading: number | null
          id: string
          latitude: number
          longitude: number
          ride_id: string | null
          speed: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          driver_id: string
          heading?: number | null
          id?: string
          latitude: number
          longitude: number
          ride_id?: string | null
          speed?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          driver_id?: string
          heading?: number | null
          id?: string
          latitude?: number
          longitude?: number
          ride_id?: string | null
          speed?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_locations_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_locations_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_subscriptions: {
        Row: {
          amount: number
          created_at: string | null
          driver_id: string
          end_date: string
          id: string
          start_date: string | null
          status: string | null
          stripe_subscription_id: string | null
          subscription_type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          driver_id: string
          end_date: string
          id?: string
          start_date?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscription_type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          driver_id?: string
          end_date?: string
          id?: string
          start_date?: string | null
          status?: string | null
          stripe_subscription_id?: string | null
          subscription_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "driver_subscriptions_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_role: Database["public"]["Enums"]["admin_role_type"] | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          phone: string | null
          rating: number | null
          role: Database["public"]["Enums"]["user_role"]
          total_ratings: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_role?: Database["public"]["Enums"]["admin_role_type"] | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          total_ratings?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_role?: Database["public"]["Enums"]["admin_role_type"] | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          rating?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          total_ratings?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ride_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          ride_id: string
          sender_id: string
          sender_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          ride_id: string
          sender_id: string
          sender_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          ride_id?: string
          sender_id?: string
          sender_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_messages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_offers: {
        Row: {
          counter_offer: number | null
          created_at: string | null
          driver_id: string
          id: string
          offered_fare: number
          ride_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          counter_offer?: number | null
          created_at?: string | null
          driver_id: string
          id?: string
          offered_fare: number
          ride_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          counter_offer?: number | null
          created_at?: string | null
          driver_id?: string
          id?: string
          offered_fare?: number
          ride_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ride_offers_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ride_offers_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_requests: {
        Row: {
          created_at: string
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_location: string
          estimated_distance_miles: number | null
          estimated_duration_minutes: number | null
          estimated_fare_max: number | null
          estimated_fare_min: number | null
          expires_at: string | null
          id: string
          payment_method: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string
          ride_type: string | null
          rider_id: string
          rider_notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location: string
          estimated_distance_miles?: number | null
          estimated_duration_minutes?: number | null
          estimated_fare_max?: number | null
          estimated_fare_min?: number | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location: string
          ride_type?: string | null
          rider_id: string
          rider_notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location?: string
          estimated_distance_miles?: number | null
          estimated_duration_minutes?: number | null
          estimated_fare_max?: number | null
          estimated_fare_min?: number | null
          expires_at?: string | null
          id?: string
          payment_method?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string
          ride_type?: string | null
          rider_id?: string
          rider_notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_requests_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string | null
          distance_miles: number | null
          driver_id: string | null
          driver_notes: string | null
          dropoff_lat: number | null
          dropoff_lng: number | null
          dropoff_location: string
          duration_minutes: number | null
          estimated_fare_max: number | null
          estimated_fare_min: number | null
          fare_breakdown: Json | null
          final_fare: number | null
          id: string
          payment_intent_id: string | null
          payment_method: string | null
          payment_status: string | null
          pickup_lat: number | null
          pickup_lng: number | null
          pickup_location: string
          requested_at: string | null
          ride_type: string | null
          rider_id: string
          rider_notes: string | null
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          distance_miles?: number | null
          driver_id?: string | null
          driver_notes?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location: string
          duration_minutes?: number | null
          estimated_fare_max?: number | null
          estimated_fare_min?: number | null
          fare_breakdown?: Json | null
          final_fare?: number | null
          id?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location: string
          requested_at?: string | null
          ride_type?: string | null
          rider_id: string
          rider_notes?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          distance_miles?: number | null
          driver_id?: string | null
          driver_notes?: string | null
          dropoff_lat?: number | null
          dropoff_lng?: number | null
          dropoff_location?: string
          duration_minutes?: number | null
          estimated_fare_max?: number | null
          estimated_fare_min?: number | null
          fare_breakdown?: Json | null
          final_fare?: number | null
          id?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pickup_lat?: number | null
          pickup_lng?: number | null
          pickup_location?: string
          requested_at?: string | null
          ride_type?: string | null
          rider_id?: string
          rider_notes?: string | null
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          color: string
          created_at: string
          driver_id: string
          id: string
          is_active: boolean
          is_verified: boolean
          license_plate: string
          make: string
          model: string
          seats: number
          updated_at: string
          vehicle_type: string
          vin: string | null
          year: number
        }
        Insert: {
          color: string
          created_at?: string
          driver_id: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          license_plate: string
          make: string
          model: string
          seats?: number
          updated_at?: string
          vehicle_type: string
          vin?: string | null
          year: number
        }
        Update: {
          color?: string
          created_at?: string
          driver_id?: string
          id?: string
          is_active?: boolean
          is_verified?: boolean
          license_plate?: string
          make?: string
          model?: string
          seats?: number
          updated_at?: string
          vehicle_type?: string
          vin?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "vehicles_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_estimated_fare: {
        Args: { distance_miles: number }
        Returns: {
          min_fare: number
          max_fare: number
        }[]
      }
      check_admin_permission: {
        Args: { required_permission: string; operation_type: string }
        Returns: boolean
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      admin_role_type: "super_admin" | "operations_admin" | "support_admin"
      user_role: "rider" | "driver" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      admin_role_type: ["super_admin", "operations_admin", "support_admin"],
      user_role: ["rider", "driver", "admin"],
    },
  },
} as const
