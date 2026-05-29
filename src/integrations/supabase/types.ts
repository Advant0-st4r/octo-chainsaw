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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      execution_maps: {
        Row: {
          cds_estimate: number | null
          created_at: string
          goal_id: string
          id: string
          leverage_rationale: string | null
          ltf_estimate: number | null
          model: string | null
          re_ramp_protocol: string | null
          scalability_mechanism: string | null
          summary: string | null
          user_id: string
        }
        Insert: {
          cds_estimate?: number | null
          created_at?: string
          goal_id: string
          id?: string
          leverage_rationale?: string | null
          ltf_estimate?: number | null
          model?: string | null
          re_ramp_protocol?: string | null
          scalability_mechanism?: string | null
          summary?: string | null
          user_id: string
        }
        Update: {
          cds_estimate?: number | null
          created_at?: string
          goal_id?: string
          id?: string
          leverage_rationale?: string | null
          ltf_estimate?: number | null
          model?: string | null
          re_ramp_protocol?: string | null
          scalability_mechanism?: string | null
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_maps_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          constraints: string | null
          context: string | null
          created_at: string
          deliverables: string | null
          horizon: string | null
          id: string
          success_metrics: string | null
          title: string
          user_id: string
        }
        Insert: {
          constraints?: string | null
          context?: string | null
          created_at?: string
          deliverables?: string | null
          horizon?: string | null
          id?: string
          success_metrics?: string | null
          title: string
          user_id: string
        }
        Update: {
          constraints?: string | null
          context?: string | null
          created_at?: string
          deliverables?: string | null
          horizon?: string | null
          id?: string
          success_metrics?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      phases: {
        Row: {
          actions: Json
          cds_contribution: number | null
          cognitive_waste_risk: string | null
          compounding_mechanism: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          leverage_multiplier: number | null
          map_id: string
          name: string
          ord: number
          session_type: Database["public"]["Enums"]["cog_time_type"]
          unlocks: Json
          user_id: string
        }
        Insert: {
          actions?: Json
          cds_contribution?: number | null
          cognitive_waste_risk?: string | null
          compounding_mechanism?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          leverage_multiplier?: number | null
          map_id: string
          name: string
          ord: number
          session_type: Database["public"]["Enums"]["cog_time_type"]
          unlocks?: Json
          user_id: string
        }
        Update: {
          actions?: Json
          cds_contribution?: number | null
          cognitive_waste_risk?: string | null
          compounding_mechanism?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          leverage_multiplier?: number | null
          map_id?: string
          name?: string
          ord?: number
          session_type?: Database["public"]["Enums"]["cog_time_type"]
          unlocks?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phases_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "execution_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      principles: {
        Row: {
          id: string
          map_id: string
          ord: number
          text: string
          user_id: string
        }
        Insert: {
          id?: string
          map_id: string
          ord: number
          text: string
          user_id: string
        }
        Update: {
          id?: string
          map_id?: string
          ord?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "principles_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "execution_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      rag_chunks: {
        Row: {
          chunk_ord: number
          content: string
          created_at: string
          embedding: string
          id: string
          map_id: string
          source_id: string
          source_type: string
          token_count: number | null
          user_id: string
        }
        Insert: {
          chunk_ord?: number
          content: string
          created_at?: string
          embedding: string
          id?: string
          map_id: string
          source_id: string
          source_type: string
          token_count?: number | null
          user_id: string
        }
        Update: {
          chunk_ord?: number
          content?: string
          created_at?: string
          embedding?: string
          id?: string
          map_id?: string
          source_id?: string
          source_type?: string
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rag_chunks_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "execution_maps"
            referencedColumns: ["id"]
          },
        ]
      }
      session_events: {
        Row: {
          blocked_flag: boolean
          context_switch_count: number
          created_at: string
          density_score: number | null
          derivation_source: string | null
          downstream_unlocks: Json
          duration_s: number | null
          end_ts: string
          id: string
          leveraged_flag: boolean
          map_id: string | null
          notes: string | null
          phase_id: string | null
          re_ramp_minutes: number
          session_label: string | null
          start_ts: string
          time_type: Database["public"]["Enums"]["cog_time_type"]
          user_id: string
        }
        Insert: {
          blocked_flag?: boolean
          context_switch_count?: number
          created_at?: string
          density_score?: number | null
          derivation_source?: string | null
          downstream_unlocks?: Json
          duration_s?: number | null
          end_ts: string
          id?: string
          leveraged_flag?: boolean
          map_id?: string | null
          notes?: string | null
          phase_id?: string | null
          re_ramp_minutes?: number
          session_label?: string | null
          start_ts: string
          time_type: Database["public"]["Enums"]["cog_time_type"]
          user_id: string
        }
        Update: {
          blocked_flag?: boolean
          context_switch_count?: number
          created_at?: string
          density_score?: number | null
          derivation_source?: string | null
          downstream_unlocks?: Json
          duration_s?: number | null
          end_ts?: string
          id?: string
          leveraged_flag?: boolean
          map_id?: string | null
          notes?: string | null
          phase_id?: string | null
          re_ramp_minutes?: number
          session_label?: string | null
          start_ts?: string
          time_type?: Database["public"]["Enums"]["cog_time_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "execution_maps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_events_phase_id_fkey"
            columns: ["phase_id"]
            isOneToOne: false
            referencedRelation: "phases"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_counters: {
        Row: {
          count: number
          kind: string
          user_id: string
          window_start: string
        }
        Insert: {
          count?: number
          kind: string
          user_id: string
          window_start: string
        }
        Update: {
          count?: number
          kind?: string
          user_id?: string
          window_start?: string
        }
        Relationships: []
      }
      waste_risks: {
        Row: {
          id: string
          map_id: string
          ord: number
          text: string
          user_id: string
        }
        Insert: {
          id?: string
          map_id: string
          ord: number
          text: string
          user_id: string
        }
        Update: {
          id?: string
          map_id?: string
          ord?: number
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waste_risks_map_id_fkey"
            columns: ["map_id"]
            isOneToOne: false
            referencedRelation: "execution_maps"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      match_user_chunks: {
        Args: {
          match_count?: number
          min_similarity?: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          map_id: string
          similarity: number
          source_type: string
        }[]
      }
    }
    Enums: {
      cog_time_type: "high" | "low" | "latent" | "lever"
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
      cog_time_type: ["high", "low", "latent", "lever"],
    },
  },
} as const
