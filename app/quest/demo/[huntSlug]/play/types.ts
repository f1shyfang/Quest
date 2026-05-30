// Domain types for the quest play flow.
//
// Previously derived from Supabase's generated `database.types`. Now defined
// explicitly to match the snake_case shapes the server pages (Drizzle queries
// with snake_case aliases) produce and the play-shell / API routes consume.

export type Hunt = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  duration_minutes: number | null;
  recommended_team_size: string | null;
  hero_emoji: string | null;
  status: string;
  created_at: string;
};

export type Clue = {
  id: string;
  hunt_id: string;
  tier: number;
  sequence_in_tier: number;
  type: string;
  body_text: string;
  image_url: string | null;
  verification_type: string;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  geofence_radius_m: number;
  qr_code_payload: string | null;
  photo_challenge_prompt: string | null;
  hints: unknown;
};

export type Session = {
  id: string;
  team_id: string;
  hunt_id: string;
  state: string;
  started_at: string | null;
  completed_at: string | null;
  current_tier: number;
  current_sequence: number;
  hint_penalty_seconds: number;
  total_time_seconds: number | null;
  created_at: string;
  abandoned_at: string | null;
  results_card_url: string | null;
};

export type ProgressRow = {
  id: string;
  hunt_session_id: string;
  clue_id: string;
  unlocked_at: string;
  hints_used: number;
  manual_override: boolean;
  photo_capture_url: string | null;
  maps_used: number;
};

export type TeamSummary = {
  id: string;
  hunt_id: string;
  name: string;
  invite_code: string;
  leader_user_id: string;
};

export type MemberRow = {
  user_id: string;
  joined_at: string;
  display_name: string;
  avatar_color: string;
};

export type Hint = { idx: 0 | 1; body: string };
