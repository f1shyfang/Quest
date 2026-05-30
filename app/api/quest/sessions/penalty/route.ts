import { callRpcOne } from "@/lib/db/rpc";
import { getDeviceIdFromRequest } from "@/lib/api/device";

export async function POST(req: Request): Promise<Response> {
  const deviceId = getDeviceIdFromRequest(req);
  if (!deviceId) {
    return Response.json({ error: "missing_device_id" }, { status: 400 });
  }
  const body = (await req.json()) as { sessionId?: string; seconds?: number };
  if (!body.sessionId || typeof body.seconds !== "number") {
    return Response.json({ error: "missing_args" }, { status: 400 });
  }
  try {
    const row = await callRpcOne("quest_apply_penalty", [deviceId, body.sessionId, body.seconds]);
    return Response.json(row, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "penalty_failed" },
      { status: 400 },
    );
  }
}
