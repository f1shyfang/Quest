import { callRpcOne } from "@/lib/db/rpc";
import { jsonbPayload } from "../../../_jsonb";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  const body = (await req.json()) as { puzzleId?: string; input?: string };
  if (!body.puzzleId || body.input == null) {
    return Response.json({ error: "missing_args" }, { status: 400 });
  }
  try {
    const row = await callRpcOne<Record<string, unknown>>("mvp_submit_anagram", [id, body.puzzleId, body.input]);
    return Response.json(jsonbPayload(row), { status: 200 });
  } catch (err) {
    return Response.json({ error: err instanceof Error ? err.message : "submit_failed" }, { status: 400 });
  }
}
