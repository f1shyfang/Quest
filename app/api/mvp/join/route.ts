import { callRpcOne } from "@/lib/db/rpc";
import { jsonbPayload } from "../_jsonb";

export async function POST(req: Request): Promise<Response> {
  const body = (await req.json()) as { gameId?: string; name?: string; existingPlayerId?: string | null };
  const name = (body.name ?? "").trim();
  if (!body.gameId || !name) {
    return Response.json({ error: "missing_args" }, { status: 400 });
  }
  try {
    const row = await callRpcOne<Record<string, unknown>>("mvp_join_game", [body.gameId, name, body.existingPlayerId ?? null]);
    return Response.json(jsonbPayload(row), { status: 200 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "join_failed" }, { status: 400 });
  }
}
