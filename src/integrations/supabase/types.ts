export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          base_price: number
          booking_date: string
          booking_time: string
          client_id: string
          client_rating: number | null
          created_at: string
          distance_km: number | null
          distance_price: number
          id: string
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          notes: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
          worker_id: string
          worker_rating: number | null
        }
        Insert: {
          base_price: number
          booking_date: string
          booking_time: string
          client_id: string
          client_rating?: number | null
          created_at?: string
          distance_km?: number | null
          distance_price?: number
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at?: string
          worker_id: string
          worker_rating?: number | null
        }
        Update: {
          base_price?: number
          booking_date?: string
          booking_time?: string
          client_id?: string
          client_rating?: number | null
          created_at?: string
          distance_km?: number | null
          distance_price?: number
          id?: string
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          notes?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
          worker_id?: string
          worker_rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_archives: {
        Row: {
          archived_at: string
          booking_id: string
          id: string
          user_id: string
        }
        Insert: {
          archived_at?: string
          booking_id: string
          id?: string
          user_id: string
        }
        Update: {
          archived_at?: string
          booking_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          booking_id: string
          content: string
          created_at: string
          id: string
          is_read: boolean
          sender_id: string
        }
        Insert: {
          booking_id: string
          content: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id: string
        }
        Update: {
          booking_id?: string
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: Database["public"]["Enums"]["city"]
          created_at: string
          id: string
          name: string
          phone: string
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          city?: Database["public"]["Enums"]["city"]
          created_at?: string
          id: string
          name: string
          phone: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          city?: Database["public"]["Enums"]["city"]
          created_at?: string
          id?: string
          name?: string
          phone?: string
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          from_user_id: string
          id: string
          on_time: boolean | null
          rating: number
          satisfactory: boolean | null
          to_user_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          from_user_id: string
          id?: string
          on_time?: boolean | null
          rating: number
          satisfactory?: boolean | null
          to_user_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          from_user_id?: string
          id?: string
          on_time?: boolean | null
          rating?: number
          satisfactory?: boolean | null
          to_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          id: string
          is_online: boolean
          last_seen: string
          user_id: string
        }
        Insert: {
          id?: string
          is_online?: boolean
          last_seen?: string
          user_id: string
        }
        Update: {
          id?: string
          is_online?: boolean
          last_seen?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_documents: {
        Row: {
          address: string
          ai_verification_result: Json | null
          bi_back_url: string | null
          bi_front_url: string | null
          bi_number: string
          birth_date: string
          created_at: string
          full_name: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          selfie_url: string | null
          submitted_at: string | null
          updated_at: string
          worker_id: string
        }
        Insert: {
          address: string
          ai_verification_result?: Json | null
          bi_back_url?: string | null
          bi_front_url?: string | null
          bi_number: string
          birth_date: string
          created_at?: string
          full_name: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          worker_id: string
        }
        Update: {
          address?: string
          ai_verification_result?: Json | null
          bi_back_url?: string | null
          bi_front_url?: string | null
          bi_number?: string
          birth_date?: string
          created_at?: string
          full_name?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          selfie_url?: string | null
          submitted_at?: string | null
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_documents_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: true
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_locations: {
        Row: {
          id: string
          lat: number
          lng: number
          updated_at: string
          worker_id: string
        }
        Insert: {
          id?: string
          lat: number
          lng: number
          updated_at?: string
          worker_id: string
        }
        Update: {
          id?: string
          lat?: number
          lng?: number
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_locations_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: true
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_portfolio: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string
          likes: number
          worker_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          likes?: number
          worker_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          likes?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_portfolio_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_schedule: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          start_time: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          start_time: string
          worker_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          start_time?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_schedule_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "workers"
            referencedColumns: ["id"]
          },
        ]
      }
      workers: {
        Row: {
          base_price: number
          completed_jobs: number
          created_at: string
          description: string | null
          id: string
          is_available: boolean
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          offers_home_service: boolean
          price_per_km: number
          rating: number
          review_count: number
          service_type: Database["public"]["Enums"]["service_type"]
          total_earnings: number
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          base_price?: number
          completed_jobs?: number
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          offers_home_service?: boolean
          price_per_km?: number
          rating?: number
          review_count?: number
          service_type: Database["public"]["Enums"]["service_type"]
          total_earnings?: number
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          base_price?: number
          completed_jobs?: number
          created_at?: string
          description?: string | null
          id?: string
          is_available?: boolean
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          offers_home_service?: boolean
          price_per_km?: number
          rating?: number
          review_count?: number
          service_type?: Database["public"]["Enums"]["service_type"]
          total_earnings?: number
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      booking_status:
        | "pending"
        | "accepted"
        | "rejected"
        | "in_progress"
        | "completed"
        | "cancelled"
      city:
        | "Bengo"
        | "Benguela"
        | "Bié"
        | "Cabinda"
        | "Cuando Cubango"
        | "Cuanza Norte"
        | "Cuanza Sul"
        | "Cunene"
        | "Huambo"
        | "Huíla"
        | "Luanda"
        | "Lunda Norte"
        | "Lunda Sul"
        | "Malanje"
        | "Moxico"
        | "Namibe"
        | "Uíge"
        | "Zaire"
      service_type:
        | "barber"
        | "car_wash"
        | "laundry"
        | "electrician"
        | "plumber"
        | "mechanic"
        | "cleaning"
        | "tutor"
        | "handyman"
        | "painter"
        | "gardener"
        | "beauty"
      user_type: "client" | "worker"
      verification_status: "not_verified" | "pending" | "verified" | "rejected"
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
      app_role: ["admin", "moderator", "user"],
      booking_status: [
        "pending",
        "accepted",
        "rejected",
        "in_progress",
        "completed",
        "cancelled",
      ],
      city: [
        "Bengo",
        "Benguela",
        "Bié",
        "Cabinda",
        "Cuando Cubango",
        "Cuanza Norte",
        "Cuanza Sul",
        "Cunene",
        "Huambo",
        "Huíla",
        "Luanda",
        "Lunda Norte",
        "Lunda Sul",
        "Malanje",
        "Moxico",
        "Namibe",
        "Uíge",
        "Zaire",
      ],
      service_type: [
        "barber",
        "car_wash",
        "laundry",
        "electrician",
        "plumber",
        "mechanic",
        "cleaning",
        "tutor",
        "handyman",
        "painter",
        "gardener",
        "beauty",
      ],
      user_type: ["client", "worker"],
      verification_status: ["not_verified", "pending", "verified", "rejected"],
    },
  },
} as const
