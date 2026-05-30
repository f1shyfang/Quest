import { callRpcOne } from "@/lib/db/rpc";
import { getDeviceIdFromRequest } from "@/lib/api/device";

export async function POST(req: Request): Promise<Response> {
  const deviceId = getDeviceIdFromRequest(req);
  if (!deviceId) {
    return Response.json({ error: "missing_device_id" }, { status: 400 });
  }
  const body = (await req.json().catch(() => ({}))) as { displayName?: string };
  const row = await callRpcOne("quest_ensure_profile", [deviceId, body.displayName ?? ""]);
  return Response.json(row, { status: 200 });
}
