import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/db/rpc", () => ({ callRpcOne: vi.fn(), callRpcRows: vi.fn() }));

import { POST } from "./route";
import { callRpcOne } from "@/lib/db/rpc";

const mockedOne = vi.mocked(callRpcOne);

function makeReq(body: unknown, deviceId = "dev-1") {
  return new Request("http://localhost/api/quest/sessions/unlock", {
    method: "POST",
    headers: { "content-type": "application/json", cookie: `quest_device_id=${deviceId}` },
    body: JSON.stringify(body),
  });
}

afterEach(() => vi.clearAllMocks());

describe("POST /api/quest/sessions/unlock", () => {
  it("forwards all 7 args in order with defaults", async () => {
    mockedOne.mockResolvedValueOnce({ id: "s1" });
    const res = await POST(makeReq({ sessionId: "s1", clueId: "c1" }));
    expect(res.status).toBe(200);
    expect(mockedOne).toHaveBeenCalledWith("quest_unlock_clue", [
      "dev-1", "s1", "c1", false, 0, null, 0,
    ]);
  });

  it("forwards optional args when present", async () => {
    mockedOne.mockResolvedValueOnce({ id: "s1" });
    await POST(makeReq({
      sessionId: "s1", clueId: "c1", manualOverride: true, hintsUsed: 2, photoUrl: "u", mapsUsed: 1,
    }));
    expect(mockedOne).toHaveBeenCalledWith("quest_unlock_clue", [
      "dev-1", "s1", "c1", true, 2, "u", 1,
    ]);
  });

  it("400s when sessionId/clueId missing", async () => {
    const res = await POST(makeReq({ sessionId: "s1" }));
    expect(res.status).toBe(400);
  });
});
