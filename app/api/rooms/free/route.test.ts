import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the dependencies the route uses, before importing the route.
// We preserve the real FreeroomsError class so we can throw and catch it.
vi.mock("@/lib/freerooms/client", async () => {
  const actual = await vi.importActual<
    typeof import("@/lib/freerooms/client")
  >("@/lib/freerooms/client");
  return { ...actual, createFreeroomsClient: vi.fn() };
});
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    }),
  }),
}));
vi.mock("@/lib/rooms/get-free-rooms", async () => {
  const actual = await vi.importActual<typeof import("@/lib/rooms/get-free-rooms")>(
    "@/lib/rooms/get-free-rooms",
  );
  return { ...actual, getFreeRooms: vi.fn() };
});

import { GET } from "./route";
import { getFreeRooms } from "@/lib/rooms/get-free-rooms";

const mockedGetFreeRooms = vi.mocked(getFreeRooms);

function makeReq(query = "") {
  return new Request(`http://localhost/api/rooms/free${query}`);
}

describe("GET /api/rooms/free", () => {
  beforeEach(() => {
    mockedGetFreeRooms.mockResolvedValue({
      as_of: "2026-05-19T13:00:00Z",
      rooms: [],
    });
  });
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with the aggregator response on a valid request", async () => {
    const res = await GET(makeReq());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ as_of: "2026-05-19T13:00:00Z", rooms: [] });
  });

  it("returns 400 for an invalid usage param", async () => {
    const res = await GET(makeReq("?usage=NOTREAL"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "invalid_param", param: "usage" });
  });

  it("returns 400 for an invalid status param", async () => {
    const res = await GET(makeReq("?status=banana"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.param).toBe("status");
  });

  it("returns 400 for a non-numeric capacity", async () => {
    const res = await GET(makeReq("?capacity=abc"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.param).toBe("capacity");
  });

  it("returns 400 for a non-ISO datetime", async () => {
    const res = await GET(makeReq("?at=not-a-date"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.param).toBe("at");
  });

  it("returns 503 when the aggregator throws a FreeroomsError", async () => {
    const { FreeroomsError } = await import("@/lib/freerooms/client");
    mockedGetFreeRooms.mockRejectedValueOnce(
      new FreeroomsError("/rooms/status", 500, "boom"),
    );
    const res = await GET(makeReq());
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body).toEqual({ error: "rooms_service_unavailable" });
  });

  it("returns 400 when only near_lat is set", async () => {
    const res = await GET(makeReq("?near_lat=-33.9"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    const blob = JSON.stringify(body);
    expect(blob).toContain("near_lat");
    expect(blob).toContain("near_lng");
  });

  it("returns 400 when only near_lng is set", async () => {
    const res = await GET(makeReq("?near_lng=151.2"));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
    const blob = JSON.stringify(body);
    expect(blob).toContain("near_lat");
    expect(blob).toContain("near_lng");
  });

  it("passes parsed params through to getFreeRooms", async () => {
    await GET(
      makeReq(
        "?at=2026-05-19T13:00:00Z&capacity=20&usage=CMLB&duration=45&status=soon&near_lat=-33.9&near_lng=151.2",
      ),
    );
    expect(mockedGetFreeRooms).toHaveBeenCalledWith(
      {
        at: "2026-05-19T13:00:00Z",
        capacity: 20,
        usage: "CMLB",
        duration: 45,
        statusFilter: "soon",
        nearLat: -33.9,
        nearLng: 151.2,
      },
      expect.any(Object),
    );
  });
});
