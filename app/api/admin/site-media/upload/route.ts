import { NextResponse } from "next/server";
import { getAdminSession } from "../../../../lib/admin/auth";
import { createSupabaseServerClient } from "../../../../lib/supabase/server";

const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 80 * 1024 * 1024;

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(-90);
}

async function readUpload(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return null;
    }

    return {
      body: file,
      name: file.name,
      type: file.type,
      size: file.size,
    };
  }

  const arrayBuffer = await request.arrayBuffer();
  const body = Buffer.from(arrayBuffer);
  const rawName = request.headers.get("x-file-name") || "site-media";
  const name = decodeURIComponent(rawName);

  return {
    body,
    name,
    type: contentType,
    size: body.byteLength,
  };
}

async function toBuffer(body: Buffer | File) {
  return Buffer.isBuffer(body) ? body : Buffer.from(await body.arrayBuffer());
}

function isMp4Like(extension: string, contentType: string) {
  return contentType === "video/mp4" || ["mp4", "m4v", "mov"].includes(extension);
}

async function validatePlayableMp4(body: Buffer | File, extension: string, contentType: string) {
  if (!isMp4Like(extension, contentType.toLowerCase())) {
    return null;
  }

  const bytes = await toBuffer(body);
  const hasFileTypeBox = bytes.indexOf(Buffer.from("ftyp")) >= 0;
  const hasMovieBox = bytes.indexOf(Buffer.from("moov")) >= 0;

  if (!hasFileTypeBox || !hasMovieBox) {
    return "This video file looks incomplete or unsupported. Please upload the original MP4 again after restarting the dev server.";
  }

  return null;
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const file = await readUpload(request);

    if (!file) {
      return NextResponse.json({ error: "No media file provided." }, { status: 400 });
    }

    const extension = file.name.split(".").pop()?.toLowerCase() || "";
    const isImage = file.type.startsWith("image/");
    const isVideo =
      file.type.startsWith("video/") || ["mp4", "mov", "webm", "m4v", "avi", "quicktime"].includes(extension);

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: "Only image and video files are supported." }, { status: 400 });
    }

    const limit = isVideo ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
    if (file.size > limit) {
      return NextResponse.json(
        { error: `${file.name} is larger than ${isVideo ? "80MB" : "12MB"}.` },
        { status: 400 },
      );
    }

    const finalExtension = extension || (isVideo ? "mp4" : "jpg");
    const contentType = file.type || (isVideo ? "video/mp4" : "image/jpeg");

    const videoValidationError = isVideo
      ? await validatePlayableMp4(file.body, finalExtension, contentType)
      : null;

    if (videoValidationError) {
      return NextResponse.json({ error: videoValidationError }, { status: 400 });
    }

    const baseName = safeName(file.name.replace(new RegExp(`\\.${finalExtension}$`, "i"), "")) || "site-media";
    const path = `website/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${baseName}.${finalExtension}`;
    const supabase = await createSupabaseServerClient();
    const bucket = "product-images";
    const { error } = await supabase.storage.from(bucket).upload(path, file.body, {
      contentType,
      upsert: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message || `Failed to upload ${file.name}.` }, { status: 400 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return NextResponse.json({
      media: {
        url: data.publicUrl,
        path,
        name: file.name,
        mediaType: isVideo ? "video" : "image",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Upload failed before the media file could be processed.",
      },
      { status: 500 },
    );
  }
}
