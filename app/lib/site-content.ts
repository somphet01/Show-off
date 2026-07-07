import { unstable_noStore as noStore } from "next/cache";
import fs from "node:fs/promises";
import path from "node:path";
import { createSupabaseAdminClient } from "./supabase/admin";
import { createSupabaseServerClient } from "./supabase/server";
import {
  defaultHomeCovers,
  defaultIntroSettings,
  normalizeSiteContent,
  type SiteContentSettings,
} from "./site-content-types";

export {
  defaultHomeCovers,
  defaultIntroSettings,
  normalizeSiteContent,
  type HomeCoverSlot,
  type IntroSettings,
  type SiteContentSettings,
  type SiteMediaType,
} from "./site-content-types";

export const siteContentStoreSettingsPrefix = "show-off-site-content:v1:";
const localSiteContentPath = path.join(process.cwd(), ".tmp", "site-content.json");

export async function readLocalSiteContentSettings() {
  try {
    const content = await fs.readFile(localSiteContentPath, "utf8");
    return normalizeSiteContent(JSON.parse(content));
  } catch {
    return null;
  }
}

export async function writeLocalSiteContentSettings(settings: SiteContentSettings) {
  await fs.mkdir(path.dirname(localSiteContentPath), { recursive: true });
  await fs.writeFile(localSiteContentPath, JSON.stringify(normalizeSiteContent(settings), null, 2), "utf8");
}

function parseStoredSiteContent(value: string | null | undefined) {
  if (!value?.startsWith(siteContentStoreSettingsPrefix)) {
    return null;
  }

  try {
    return normalizeSiteContent(JSON.parse(value.slice(siteContentStoreSettingsPrefix.length)));
  } catch {
    return null;
  }
}

async function getSiteContentFromStoreSettings() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("store_settings")
      .select("logo_path")
      .eq("id", "main")
      .maybeSingle<{ logo_path: string | null }>();

    if (error || !data) {
      return null;
    }

    return parseStoredSiteContent(data.logo_path);
  } catch {
    return null;
  }
}

export async function getSiteContentSettings(): Promise<SiteContentSettings> {
  noStore();

  const localSettings = await readLocalSiteContentSettings();
  if (localSettings) {
    return localSettings;
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("site_content_settings")
      .select("covers,intro")
      .eq("id", "main")
      .maybeSingle<{ covers: unknown; intro: unknown }>();

    if (error || !data) {
      return (await getSiteContentFromStoreSettings()) ?? { covers: defaultHomeCovers, intro: defaultIntroSettings };
    }

    return normalizeSiteContent({ covers: data.covers, intro: data.intro });
  } catch {
    return (await getSiteContentFromStoreSettings()) ?? { covers: defaultHomeCovers, intro: defaultIntroSettings };
  }
}
