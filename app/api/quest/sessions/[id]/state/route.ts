import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  questHuntSessions,
  questClueProgress,
  questTeamMembers,
  questProfiles,
} from "@/lib/db/schema";

/**
 * Combined session-state poll for the play-shell. Replaces the three Supabase
 * realtime subscriptions (session row, clue_progress, team_members+profiles)
 * with a single GET the client polls. All keys are snake_case to match the
 * play-shell's Session / ProgressRow / MemberRow types.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await params;

  const s = (
    await db.select().from(questHuntSessions).where(eq(questHuntSessions.id, id)).limit(1)
  )[0];
  if (!s) return Response.json({ error: "not_found" }, { status: 404 });

  const session = {
    id: s.id,
    team_id: s.teamId,
    hunt_id: s.huntId,
    state: s.state,
    started_at: s.startedAt,
    completed_at: s.completedAt,
    current_tier: s.currentTier,
    current_sequence: s.currentSequence,
    hint_penalty_seconds: s.hintPenaltySeconds,
    total_time_seconds: s.totalTimeSeconds,
    created_at: s.createdAt,
    abandoned_at: s.abandonedAt,
    results_card_url: s.resultsCardUrl,
  };

  const progressRaw = await db
    .select()
    .from(questClueProgress)
    .where(eq(questClueProgress.huntSessionId, id));
  const progress = progressRaw.map((p) => ({
    id: p.id,
    hunt_session_id: p.huntSessionId,
    clue_id: p.clueId,
    unlocked_at: p.unlockedAt,
    hints_used: p.hintsUsed,
    manual_override: p.manualOverride,
    photo_capture_url: p.photoCaptureUrl,
    maps_used: p.mapsUsed,
  }));

  const memberRows = await db
    .select({ userId: questTeamMembers.userId, joinedAt: questTeamMembers.joinedAt })
    .from(questTeamMembers)
    .where(eq(questTeamMembers.teamId, s.teamId));
  const memberIds = memberRows.map((m) => m.userId);
  const profiles = memberIds.length
    ? await db
        .select({
          userId: questProfiles.userId,
          displayName: questProfiles.displayName,
          avatarColor: questProfiles.avatarColor,
        })
        .from(questProfiles)
        .where(inArray(questProfiles.userId, memberIds))
    : [];
  const byId = new Map(profiles.map((p) => [p.userId, p]));
  const members = memberRows.map((m) => {
    const p = byId.get(m.userId);
    return {
      user_id: m.userId,
      joined_at: m.joinedAt,
      display_name: p?.displayName ?? "Player",
      avatar_color: p?.avatarColor ?? "#ef5b3a",
    };
  });

  return Response.json({ session, progress, members }, { status: 200 });
}
