export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      trade: {
        Row: {
          amount_deposit: number | null;
          amount_receive: number | null;
          chain: string | null;
          created_at: string;
          device_uid: string | null;
          from_currency: string | null;
          id: string;
          to_currency: string | null;
          transcript: string | null;
          txid: string | null;
        };
        Insert: {
          amount_deposit?: number | null;
          amount_receive?: number | null;
          chain?: string | null;
          created_at?: string;
          device_uid?: string | null;
          from_currency?: string | null;
          id?: string;
          to_currency?: string | null;
          transcript?: string | null;
          txid?: string | null;
        };
        Update: {
          amount_deposit?: number | null;
          amount_receive?: number | null;
          chain?: string | null;
          created_at?: string;
          device_uid?: string | null;
          from_currency?: string | null;
          id?: string;
          to_currency?: string | null;
          transcript?: string | null;
          txid?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "trade_device_uid_fkey";
            columns: ["device_uid"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["omi_id"];
          },
        ];
      };
      transaction: {
        Row: {
          amount: number | null;
          chain: string | null;
          created_at: string;
          currrency: string | null;
          device_uid: string | null;
          from: string | null;
          id: string;
          to: string | null;
          transcript: string | null;
          txid: string | null;
        };
        Insert: {
          amount?: number | null;
          chain?: string | null;
          created_at?: string;
          currrency?: string | null;
          device_uid?: string | null;
          from?: string | null;
          id?: string;
          to?: string | null;
          transcript?: string | null;
          txid?: string | null;
        };
        Update: {
          amount?: number | null;
          chain?: string | null;
          created_at?: string;
          currrency?: string | null;
          device_uid?: string | null;
          from?: string | null;
          id?: string;
          to?: string | null;
          transcript?: string | null;
          txid?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_device_uid_fkey";
            columns: ["device_uid"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["omi_id"];
          },
          {
            foreignKeyName: "transaction_from_fkey";
            columns: ["from"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["username"];
          },
          {
            foreignKeyName: "transaction_to_fkey";
            columns: ["to"];
            isOneToOne: false;
            referencedRelation: "user";
            referencedColumns: ["username"];
          },
        ];
      };
      user: {
        Row: {
          arbitrum_wallet: Json | null;
          base_wallet: Json | null;
          eth_wallet: Json | null;
          hash: string;
          id: number;
          omi_id: string | null;
          polygon_wallet: Json | null;
          sol_wallet: Json | null;
          username: string;
        };
        Insert: {
          arbitrum_wallet?: Json | null;
          base_wallet?: Json | null;
          eth_wallet?: Json | null;
          hash: string;
          id?: number;
          omi_id?: string | null;
          polygon_wallet?: Json | null;
          sol_wallet?: Json | null;
          username: string;
        };
        Update: {
          arbitrum_wallet?: Json | null;
          base_wallet?: Json | null;
          eth_wallet?: Json | null;
          hash?: string;
          id?: number;
          omi_id?: string | null;
          polygon_wallet?: Json | null;
          sol_wallet?: Json | null;
          username?: string;
        };
        Relationships: [];
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
};

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
