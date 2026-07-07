import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin/auth";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-90);
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files").filter((value): value is File => value instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No image files provided." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const uploaded: Array<{ url: string; path: string; name: string }> = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: `${file.name} is not an image.` }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: `${file.name} is larger than 5MB.` }, { status: 400 });
    }

    const extension = file.name.split(".").pop() || "jpg";
    const fileName = safeName(file.name.replace(new RegExp(`\\.${extension}$`, "i"), "")) || "product-image";
    const path = `admin-products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${fileName}.${extension}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file, {
      contentType: file.type,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message || `Failed to upload ${file.name}.` }, { status: 400 });
    }

    const { data } = supabase.storage.from("product-images").getPublicUrl(path);
    uploaded.push({ url: data.publicUrl, path, name: file.name });
  }

  return NextResponse.json({ images: uploaded });
}
