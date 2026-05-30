import { describe, it, expect, vi } from "vitest";

vi.mock("./client", () => ({
  db: { execute: vi.fn() },
}));

import { callRpcRows, callRpcOne } from "./rpc";
import { db } from "./client";

const mockedExecute = vi.mocked((db as unknown as { execute: ReturnType<typeof vi.fn> }).execute);

describe("callRpcRows", () => {
  it("returns the rows array from the result", async () => {
    mockedExecute.mockResolvedValueOnce({ rows: [{ team_id: "t1" }] });
    const rows = await callRpcRows("quest_create_team", ["u1", "h1", "Team"]);
    expect(rows).toEqual([{ team_id: "t1" }]);
  });
});

describe("callRpcOne", () => {
  it("returns the first row", async () => {
    mockedExecute.mockResolvedValueOnce({ rows: [{ id: "s1" }, { id: "s2" }] });
    const row = await callRpcOne("quest_start_hunt", ["u1", "t1"]);
    expect(row).toEqual({ id: "s1" });
  });

  it("returns null when there are no rows", async () => {
    mockedExecute.mockResolvedValueOnce({ rows: [] });
    const row = await callRpcOne("mvp_get_player_state", ["p1"]);
    expect(row).toBeNull();
  });
});
