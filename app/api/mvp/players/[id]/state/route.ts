import { callRpcOne } from "@/lib/db/rpc";
import { jsonbPayload } from "../../../_jsonb";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const row = await callRpcOne<Record<string, unknown>>("mvp_get_player_state", [id]);
  const payload = jsonbPayload(row);
  if (!payload) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json(payload, { status: 200 });
}
