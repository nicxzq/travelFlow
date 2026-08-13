export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      trips: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          destination: string;
          start_date: string | null;
          end_date: string | null;
          status: 'planning' | 'active' | 'completed' | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          destination: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'planning' | 'active' | 'completed' | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          destination?: string;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'planning' | 'active' | 'completed' | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'trips_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      days: {
        Row: {
          id: string;
          trip_id: string;
          day_index: number;
          date: string | null;
          summary: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_index: number;
          date?: string | null;
          summary?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_index?: number;
          date?: string | null;
          summary?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'days_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      events: {
        Row: {
          id: string;
          day_id: string;
          trip_id: string;
          start_time: string | null;
          end_time: string | null;
          is_time_flexible: boolean | null;
          title: string;
          description: string | null;
          category: 'spot' | 'food' | 'hotel' | 'transport' | 'custom' | null;
          location_name: string | null;
          address: string | null;
          geo_point: unknown | null;
          external_link: string | null;
          is_completed: boolean | null;
          status: 'planned' | 'active' | 'done' | 'skipped' | 'changed' | null;
          sort_order: number | null;
          navigation_url: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          day_id: string;
          trip_id: string;
          start_time?: string | null;
          end_time?: string | null;
          is_time_flexible?: boolean | null;
          title: string;
          description?: string | null;
          category?: 'spot' | 'food' | 'hotel' | 'transport' | 'custom' | null;
          location_name?: string | null;
          address?: string | null;
          geo_point?: unknown | null;
          external_link?: string | null;
          is_completed?: boolean | null;
          status?: 'planned' | 'active' | 'done' | 'skipped' | 'changed' | null;
          sort_order?: number | null;
          navigation_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          day_id?: string;
          trip_id?: string;
          start_time?: string | null;
          end_time?: string | null;
          is_time_flexible?: boolean | null;
          title?: string;
          description?: string | null;
          category?: 'spot' | 'food' | 'hotel' | 'transport' | 'custom' | null;
          location_name?: string | null;
          address?: string | null;
          geo_point?: unknown | null;
          external_link?: string | null;
          is_completed?: boolean | null;
          status?: 'planned' | 'active' | 'done' | 'skipped' | 'changed' | null;
          sort_order?: number | null;
          navigation_url?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'events_day_id_fkey';
            columns: ['day_id'];
            isOneToOne: false;
            referencedRelation: 'days';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'events_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
      todos: {
        Row: {
          id: string;
          trip_id: string;
          day_id: string | null;
          event_id: string | null;
          scope: 'trip' | 'day' | 'event';
          title: string;
          due_date: string | null;
          status: 'open' | 'done' | 'blocked' | null;
          sort_order: number | null;
          created_by: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_id?: string | null;
          event_id?: string | null;
          scope: 'trip' | 'day' | 'event';
          title: string;
          due_date?: string | null;
          status?: 'open' | 'done' | 'blocked' | null;
          sort_order?: number | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_id?: string | null;
          event_id?: string | null;
          scope?: 'trip' | 'day' | 'event';
          title?: string;
          due_date?: string | null;
          status?: 'open' | 'done' | 'blocked' | null;
          sort_order?: number | null;
          created_by?: string | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'todos_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'todos_day_id_fkey';
            columns: ['day_id'];
            isOneToOne: false;
            referencedRelation: 'days';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'todos_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      destination_map_points: {
        Row: {
          id: string;
          trip_id: string;
          day_id: string | null;
          event_id: string | null;
          name: string;
          city: string;
          kind: 'airport' | 'spot' | 'hotel' | 'food' | 'route';
          geo_point: unknown | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          trip_id: string;
          day_id?: string | null;
          event_id?: string | null;
          name: string;
          city: string;
          kind: 'airport' | 'spot' | 'hotel' | 'food' | 'route';
          geo_point?: unknown | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          trip_id?: string;
          day_id?: string | null;
          event_id?: string | null;
          name?: string;
          city?: string;
          kind?: 'airport' | 'spot' | 'hotel' | 'food' | 'route';
          geo_point?: unknown | null;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'destination_map_points_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'destination_map_points_day_id_fkey';
            columns: ['day_id'];
            isOneToOne: false;
            referencedRelation: 'days';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'destination_map_points_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
        ];
      };
      memories: {
        Row: {
          id: string;
          event_id: string | null;
          trip_id: string | null;
          type: 'image' | 'text' | 'voice' | null;
          content_url: string | null;
          text_content: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          event_id?: string | null;
          trip_id?: string | null;
          type?: 'image' | 'text' | 'voice' | null;
          content_url?: string | null;
          text_content?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          event_id?: string | null;
          trip_id?: string | null;
          type?: 'image' | 'text' | 'voice' | null;
          content_url?: string | null;
          text_content?: string | null;
          created_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'memories_event_id_fkey';
            columns: ['event_id'];
            isOneToOne: false;
            referencedRelation: 'events';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'memories_trip_id_fkey';
            columns: ['trip_id'];
            isOneToOne: false;
            referencedRelation: 'trips';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
