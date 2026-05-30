import { describe, it, expect, vi, afterEach } from "vitest";

vi.mock("@/lib/blob/upload", () => ({ uploadPublic: vi.fn() }));

import { POST } from "./route";
import { uploadPublic } from "@/lib/blob/upload";

const mockedUpload = vi.mocked(uploadPublic);

function makeReq(file?: File) {
  const fd = new FormData();
  if (file) fd.set("file", file);
  return new Request("http://localhost/api/uploads/quest-photo", { method: "POST", body: fd });
}

afterEach(() => vi.clearAllMocks());

describe("POST /api/uploads/quest-photo", () => {
  it("uploads the file and returns its public url", async () => {
    mockedUpload.mockResolvedValueOnce("https://blob.example/quest-photos/x.jpg");
    const file = new File([new Uint8Array([1, 2, 3])], "x.jpg", { type: "image/jpeg" });
    const res = await POST(makeReq(file));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://blob.example/quest-photos/x.jpg" });
  });

  it("400s when no file is provided", async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });
});
