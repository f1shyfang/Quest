import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/db/rpc", () => ({ callRpcOne: vi.fn(), callRpcRows: vi.fn() }));

import { POST } from "./route";
import { callRpcOne } from "@/lib/db/rpc";

const mockedOne = vi.mocked(callRpcOne);

function makeReq(body: unknown) {
  return new Request("http://localhost/api/mvp/join", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.clearAllMocks());

describe("POST /api/mvp/join", () => {
  it("returns the jsonb player state from mvp_join_game", async () => {
    mockedOne.mockResolvedValueOnce({ mvp_join_game: { player_id: "p1", state: "lobby" } });
    const res = await POST(makeReq({ gameId: "g1", name: "Alex", existingPlayerId: null }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ player_id: "p1", state: "lobby" });
    expect(mockedOne).toHaveBeenCalledWith("mvp_join_game", ["g1", "Alex", null]);
  });

  it("400s on empty name", async () => {
    const res = await POST(makeReq({ gameId: "g1", name: "  " }));
    expect(res.status).toBe(400);
  });
});
