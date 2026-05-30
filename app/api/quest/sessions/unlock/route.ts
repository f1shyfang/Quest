import { callRpcOne } from "@/lib/db/rpc";
import { getDeviceIdFromRequest } from "@/lib/api/device";

export async function POST(req: Request): Promise<Response> {
  const deviceId = getDeviceIdFromRequest(req);
  if (!deviceId) {
    return Response.json({ error: "missing_device_id" }, { status: 400 });
  }
  const body = (await req.json()) as {
    sessionId?: string;
    clueId?: string;
    manualOverride?: boolean;
    hintsUsed?: number;
    photoUrl?: string | null;
    mapsUsed?: number;
  };
  if (!body.sessionId || !body.clueId) {
    return Response.json({ error: "missing_args" }, { status: 400 });
  }
  try {
    const row = await callRpcOne("quest_unlock_clue", [
      deviceId,
      body.sessionId,
      body.clueId,
      body.manualOverride ?? false,
      body.hintsUsed ?? 0,
      body.photoUrl ?? null,
      body.mapsUsed ?? 0,
    ]);
    return Response.json(row, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "unlock_failed" },
      { status: 400 },
    );
  }
}
