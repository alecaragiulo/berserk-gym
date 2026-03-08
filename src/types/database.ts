// ══════════════════════════════════════════
//  Iron Berserk — Database Types
//  Generados manualmente del schema SQL.
//  Una vez tengas Supabase configurado, podés
//  autogenerarlos con: npx supabase gen types
// ══════════════════════════════════════════

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          streak: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'streak'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      exercises: {
        Row: {
          id: number
          name: string
          muscle_group: string
          secondary_muscles: string[] | null
          equipment: string | null
          is_custom: boolean
          created_by: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>
      }
      routines: {
        Row: {
          id: number
          author_id: string
          name: string
          description: string | null
          days_per_week: number | null
          is_public: boolean
          tags: string[] | null
          subscribers_count: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['routines']['Row'], 'id' | 'subscribers_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['routines']['Insert']>
      }
      routine_exercises: {
        Row: {
          id: number
          routine_id: number
          exercise_id: number
          day_number: number
          position: number
          target_sets: number
          target_reps: number | null
          target_weight: number | null
          notes: string | null
        }
        Insert: Omit<Database['public']['Tables']['routine_exercises']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['routine_exercises']['Insert']>
      }
      routine_subscriptions: {
        Row: {
          id: number
          user_id: string
          routine_id: number
          subscribed_at: string
        }
        Insert: Omit<Database['public']['Tables']['routine_subscriptions']['Row'], 'id' | 'subscribed_at'>
        Update: never
      }
      workout_sessions: {
        Row: {
          id: number
          user_id: string
          routine_id: number | null
          name: string | null
          started_at: string
          finished_at: string | null
          notes: string | null
          total_volume: number
        }
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'started_at' | 'total_volume'>
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>
      }
      workout_sets: {
        Row: {
          id: number
          session_id: number
          exercise_id: number
          set_number: number
          weight_kg: number | null
          reps: number | null
          rpe: number | null
          completed: boolean
          logged_at: string
        }
        Insert: Omit<Database['public']['Tables']['workout_sets']['Row'], 'id' | 'logged_at'>
        Update: Partial<Database['public']['Tables']['workout_sets']['Insert']>
      }
    }
  }
}

// ── Tipos derivados (más cómodos de usar) ──
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Exercise = Database['public']['Tables']['exercises']['Row']
export type Routine = Database['public']['Tables']['routines']['Row']
export type RoutineExercise = Database['public']['Tables']['routine_exercises']['Row']
export type WorkoutSession = Database['public']['Tables']['workout_sessions']['Row']
export type WorkoutSet = Database['public']['Tables']['workout_sets']['Row']

// ── Tipos extendidos para queries con joins ──
export type RoutineWithAuthor = Routine & {
  profiles: Pick<Profile, 'username' | 'display_name' | 'avatar_url'>
}

export type SessionWithSets = WorkoutSession & {
  workout_sets: (WorkoutSet & { exercises: Pick<Exercise, 'name' | 'muscle_group'> })[]
}
