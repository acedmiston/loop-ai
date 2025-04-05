export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export type Database = {
  public: {
    Tables: {
      guests: {
        Row: {
          id: string;
          first_name: string;
          last_name: string | null;
          phone: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          first_name: string;
          last_name?: string | null;
          phone: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          first_name?: string;
          last_name?: string | null;
          phone?: string;
          created_by?: string;
          created_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          title: string;
          date: string;
          time: string;
          tone: string;
          message: string;
          input: string;
          created_by: string;
          created_at: string;
        };
        Insert: {
          title: string;
          date: string;
          time: string;
          tone: string;
          message: string;
          input: string;
          created_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          date?: string;
          time?: string;
          tone?: string;
          message?: string;
          input?: string;
          created_by?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
};
