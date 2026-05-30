import { callRpcOne } from "@/lib/db/rpc";
import { jsonbPayload } from "../../../_jsonb";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  try {
    const row = await callRpcOne<Record<string, unknown>>("mvp_complete_player", [id]);
    return Response.json(jsonbPayload(row), { status: 200 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "action_failed" }, { status: 400 });
  }
}
