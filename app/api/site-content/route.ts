import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "../../lib/admin/auth";
import { createSupabaseAdminClient } from "../../lib/supabase/admin";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import {
  getSiteContentSettings,
  normalizeSiteContent,
  siteContentStoreSettingsPrefix,
  writeLocalSiteContentSettings,
} from "../../lib/site-content";

export async function GET() {
  const settings = await getSiteContentSettings();
  return NextResponse.json(settings, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = normalizeSiteContent(await request.json());
  let saved = false;
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("site_content_settings").upsert(
    {
      id: "main",
      covers: settings.covers,
      intro: settings.intro,
      updated_by: session.userId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" },
  );

  if (!error) {
    saved = true;
  } else {
    let fallbackClient = supabase;

    try {
      fallbackClient = createSupabaseAdminClient();
    } catch {
      fallbackClient = supabase;
    }

    const fallbackValue = `${siteContentStoreSettingsPrefix}${JSON.stringify(settings)}`;
    const fallback = await fallbackClient
      .from("store_settings")
      .upsert({ id: "main", logo_path: fallbackValue, updated_at: new Date().toISOString() }, { onConflict: "id" });

    if (!fallback.error) {
      saved = true;
    }
  }

  if (!saved) {
    await writeLocalSiteContentSettings(settings);
  }

  revalidatePath("/en");
  revalidatePath("/lo");
  revalidatePath("/", "layout");

  return NextResponse.json(settings);
}
