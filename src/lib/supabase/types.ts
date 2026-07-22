// Hand-written to match supabase/migrations/*.sql. Regenerate with
// `supabase gen types typescript` once the project is linked, if desired.

export type MuscleGroup =
  | "chest"
  | "back"
  | "legs"
  | "shoulders"
  | "arms"
  | "core"
  | "full_body"
  | "cardio"
  | "other";

export type MeasurementType =
  | "height"
  | "waist"
  | "chest"
  | "hips"
  | "arm_left"
  | "arm_right"
  | "thigh_left"
  | "thigh_right"
  | "shoulders"
  | "neck"
  | "calf_left"
  | "calf_right";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          username_slug: string;
          unit_preference: "kg" | "lb";
          leaderboard_opt_in: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          username_slug: string;
          unit_preference?: "kg" | "lb";
          leaderboard_opt_in?: boolean;
        };
        Update: Partial<{
          display_name: string;
          unit_preference: "kg" | "lb";
          leaderboard_opt_in: boolean;
        }>;
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: MuscleGroup;
          overload_note: string;
          video_url: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          muscle_group: MuscleGroup;
          overload_note?: string;
          video_url?: string | null;
          created_by: string;
        };
        Update: Partial<{
          name: string;
          muscle_group: MuscleGroup;
          overload_note: string;
          video_url: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "exercises_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routines: {
        Row: {
          id: string;
          owner_id: string | null;
          name: string;
          description: string | null;
          is_preset: boolean;
          visibility: "private" | "shared";
          claim_display_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string | null;
          visibility?: "private" | "shared";
        };
        Update: Partial<{
          name: string;
          description: string | null;
          visibility: "private" | "shared";
        }>;
        Relationships: [
          {
            foreignKeyName: "routines_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_days: {
        Row: {
          id: string;
          routine_id: string;
          day_order: number;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_id: string;
          day_order: number;
          name: string;
        };
        Update: Partial<{ day_order: number; name: string }>;
        Relationships: [
          {
            foreignKeyName: "routine_days_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
        ];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_day_id: string;
          exercise_id: string;
          exercise_order: number;
          target_sets: number | null;
          target_reps: string | null;
          target_weight: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          routine_day_id: string;
          exercise_id: string;
          exercise_order: number;
          target_sets?: number | null;
          target_reps?: string | null;
          target_weight?: number | null;
          notes?: string | null;
        };
        Update: Partial<{
          exercise_order: number;
          target_sets: number | null;
          target_reps: string | null;
          target_weight: number | null;
          notes: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "routine_exercises_routine_day_id_fkey";
            columns: ["routine_day_id"];
            isOneToOne: false;
            referencedRelation: "routine_days";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      workout_sessions: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          routine_day_id: string | null;
          started_at: string;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          routine_day_id?: string | null;
          started_at?: string;
          completed_at?: string | null;
          notes?: string | null;
        };
        Update: Partial<{
          completed_at: string | null;
          notes: string | null;
        }>;
        Relationships: [
          {
            foreignKeyName: "workout_sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_routine_id_fkey";
            columns: ["routine_id"];
            isOneToOne: false;
            referencedRelation: "routines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workout_sessions_routine_day_id_fkey";
            columns: ["routine_day_id"];
            isOneToOne: false;
            referencedRelation: "routine_days";
            referencedColumns: ["id"];
          },
        ];
      };
      set_logs: {
        Row: {
          id: string;
          session_id: string;
          exercise_id: string;
          set_order: number;
          reps: number;
          weight: number;
          is_warmup: boolean;
          completed_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          exercise_id: string;
          set_order: number;
          reps: number;
          weight: number;
          is_warmup?: boolean;
          completed_at?: string;
        };
        Update: Partial<{
          reps: number;
          weight: number;
          is_warmup: boolean;
        }>;
        Relationships: [
          {
            foreignKeyName: "set_logs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "workout_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "set_logs_exercise_id_fkey";
            columns: ["exercise_id"];
            isOneToOne: false;
            referencedRelation: "exercises";
            referencedColumns: ["id"];
          },
        ];
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          weight_kg: number;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recorded_at?: string;
          weight_kg: number;
          notes?: string | null;
        };
        Update: Partial<{ weight_kg: number; notes: string | null }>;
        Relationships: [
          {
            foreignKeyName: "body_metrics_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      body_measurements: {
        Row: {
          id: string;
          user_id: string;
          recorded_at: string;
          measurement_type: MeasurementType;
          value_cm: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          recorded_at?: string;
          measurement_type: MeasurementType;
          value_cm: number;
        };
        Update: Partial<{ value_cm: number }>;
        Relationships: [
          {
            foreignKeyName: "body_measurements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      progress_photos: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          taken_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          taken_at?: string;
          notes?: string | null;
        };
        Update: Partial<{ notes: string | null }>;
        Relationships: [
          {
            foreignKeyName: "progress_photos_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      profile_lookup: {
        Row: { id: string; display_name: string; username_slug: string };
        Relationships: [];
      };
      v_exercise_prs: {
        Row: {
          user_id: string;
          exercise_id: string;
          max_weight: number;
          best_est_1rm: number;
          max_session_volume: number;
        };
        Relationships: [];
      };
      v_leaderboard: {
        Row: {
          user_id: string;
          display_name: string;
          current_streak: number;
          longest_streak: number;
          weekly_volume: number;
        };
        Relationships: [];
      };
      v_workout_days: {
        Row: { user_id: string; workout_date: string };
        Relationships: [];
      };
    };
    Functions: {
      get_streak: {
        Args: { target_user: string };
        Returns: {
          current_streak: number;
          longest_streak: number;
          last_workout_date: string | null;
        }[];
      };
      get_weekly_streak: {
        Args: { target_user: string };
        Returns: {
          current_streak: number;
          longest_streak: number;
          last_workout_week: string | null;
        }[];
      };
    };
  };
}
