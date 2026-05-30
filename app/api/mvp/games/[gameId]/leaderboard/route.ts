import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { mvpPlayers } from "@/lib/db/schema";

export async function GET(_req: Request, { params }: { params: Promise<{ gameId: string }> }): Promise<Response> {
  const { gameId } = await params;
  const rows = await db
    .select({
      id: mvpPlayers.id,
      name: mvpPlayers.name,
      completed_at: mvpPlayers.completedAt,
      started_at: mvpPlayers.startedAt,
      total_time_seconds: mvpPlayers.totalTimeSeconds,
    })
    .from(mvpPlayers)
    .where(eq(mvpPlayers.gameId, gameId));
  return Response.json({ rows }, { status: 200 });
}
