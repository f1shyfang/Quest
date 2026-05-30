import { uploadPublic } from "@/lib/blob/upload";

export async function POST(req: Request): Promise<Response> {
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "missing_file" }, { status: 400 });
  }
  const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
  const url = await uploadPublic(`quest-photos/upload.${ext}`, file, file.type || undefined);
  return Response.json({ url }, { status: 200 });
}
