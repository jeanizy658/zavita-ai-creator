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
      ai_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          input: Json
          output: Json | null
          progress: number
          project_id: string | null
          status: Database["public"]["Enums"]["job_status"]
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json | null
          progress?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          input?: Json
          output?: Json | null
          progress?: number
          project_id?: string | null
          status?: Database["public"]["Enums"]["job_status"]
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          created_at: string
          duration: number | null
          file_url: string | null
          id: string
          metadata: Json
          mime_type: string | null
          name: string
          project_id: string | null
          size: number | null
          storage_path: string | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["asset_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          duration?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          name: string
          project_id?: string | null
          size?: number | null
          storage_path?: string | null
          thumbnail_url?: string | null
          type: Database["public"]["Enums"]["asset_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          duration?: number | null
          file_url?: string | null
          id?: string
          metadata?: Json
          mime_type?: string | null
          name?: string
          project_id?: string | null
          size?: number | null
          storage_path?: string | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["asset_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          duration: number
          id: string
          settings: Json
          status: Database["public"]["Enums"]["project_status"]
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          settings?: Json
          status?: Database["public"]["Enums"]["project_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration?: number
          id?: string
          settings?: Json
          status?: Database["public"]["Enums"]["project_status"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      timeline_clips: {
        Row: {
          asset_id: string | null
          created_at: string
          duration: number
          end_time: number
          id: string
          label: string | null
          locked: boolean
          opacity: number
          position: number
          project_id: string
          rotation: number
          scale: number
          start_time: number
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at: string
          user_id: string
          visible: boolean
          volume: number
          x: number
          y: number
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          duration?: number
          end_time?: number
          id?: string
          label?: string | null
          locked?: boolean
          opacity?: number
          position?: number
          project_id: string
          rotation?: number
          scale?: number
          start_time?: number
          track_type: Database["public"]["Enums"]["track_type"]
          updated_at?: string
          user_id: string
          visible?: boolean
          volume?: number
          x?: number
          y?: number
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          duration?: number
          end_time?: number
          id?: string
          label?: string | null
          locked?: boolean
          opacity?: number
          position?: number
          project_id?: string
          rotation?: number
          scale?: number
          start_time?: number
          track_type?: Database["public"]["Enums"]["track_type"]
          updated_at?: string
          user_id?: string
          visible?: boolean
          volume?: number
          x?: number
          y?: number
        }
        Relationships: [
          {
            foreignKeyName: "timeline_clips_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_clips_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      asset_type:
        | "VIDEO"
        | "PHOTO"
        | "AUDIO"
        | "MUSIC"
        | "VOICE"
        | "IMAGE"
        | "LOGO"
        | "AI_VISUAL"
        | "AI_VIDEO"
        | "GRAPHIC"
        | "TEXT"
      job_status: "QUEUED" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED"
      project_status: "DRAFT" | "READY" | "SCHEDULED" | "PUBLISHED"
      track_type: "MAIN" | "OVERLAY" | "PHOTO" | "TEXT" | "AI_VISUAL" | "AUDIO"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      asset_type: [
        "VIDEO",
        "PHOTO",
        "AUDIO",
        "MUSIC",
        "VOICE",
        "IMAGE",
        "LOGO",
        "AI_VISUAL",
        "AI_VIDEO",
        "GRAPHIC",
        "TEXT",
      ],
      job_status: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      project_status: ["DRAFT", "READY", "SCHEDULED", "PUBLISHED"],
      track_type: ["MAIN", "OVERLAY", "PHOTO", "TEXT", "AI_VISUAL", "AUDIO"],
    },
  },
} as const
