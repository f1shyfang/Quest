import { callRpcOne } from "@/lib/db/rpc";
import { getDeviceIdFromRequest } from "@/lib/api/device";

export async function POST(req: Request): Promise<Response> {
  const deviceId = getDeviceIdFromRequest(req);
  if (!deviceId) {
    return Response.json({ error: "missing_device_id" }, { status: 400 });
  }
  const body = (await req.json()) as { teamId?: string };
  if (!body.teamId) {
    return Response.json({ error: "missing_team_id" }, { status: 400 });
  }
  try {
    const row = await callRpcOne("quest_start_hunt", [deviceId, body.teamId]);
    return Response.json(row, { status: 200 });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "start_failed" },
      { status: 400 },
    );
  }
}
