export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          city: string | null;
          household_size: number;
          avatar_url: string | null;
          banner_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          city?: string | null;
          household_size?: number;
          avatar_url?: string | null;
          banner_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          city?: string | null;
          household_size?: number;
          avatar_url?: string | null;
          banner_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      footprint_reports: {
        Row: {
          id: string;
          user_id: string;
          total_co2e: number;
          transport_co2e: number;
          energy_co2e: number;
          food_co2e: number;
          lifestyle_co2e: number;
          input_data: unknown;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_co2e: number;
          transport_co2e: number;
          energy_co2e: number;
          food_co2e: number;
          lifestyle_co2e: number;
          input_data: unknown;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_co2e?: number;
          transport_co2e?: number;
          energy_co2e?: number;
          food_co2e?: number;
          lifestyle_co2e?: number;
          input_data?: unknown;
          created_at?: string;
        };
        Relationships: [];
      };
      user_activities: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          category: string;
          activity: string;
          value: number;
          unit: string;
          co2e: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_id: string;
          category: string;
          activity: string;
          value: number;
          unit: string;
          co2e: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_id?: string;
          category?: string;
          activity?: string;
          value?: number;
          unit?: string;
          co2e?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string;
          estimated_saving: number;
          difficulty: string;
          status: string;
          source: string;
          recommendation_data: unknown | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category: string;
          estimated_saving?: number;
          difficulty?: string;
          status?: string;
          source?: string;
          recommendation_data?: unknown | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string;
          estimated_saving?: number;
          difficulty?: string;
          status?: string;
          source?: string;
          recommendation_data?: unknown | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [];
      };
      badges: {
        Row: {
          id: string;
          name: string;
          description: string;
          icon: string;
          condition_key: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          icon: string;
          condition_key: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          icon?: string;
          condition_key?: string;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [];
      };
      ai_insights: {
        Row: {
          id: string;
          user_id: string;
          report_id: string;
          summary: string;
          recommendations: unknown[];
          impact_level: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          report_id: string;
          summary: string;
          recommendations: unknown[];
          impact_level: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          report_id?: string;
          summary?: string;
          recommendations?: unknown[];
          impact_level?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
