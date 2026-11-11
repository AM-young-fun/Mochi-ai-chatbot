import { createGA4Client } from "./ga4-core";

export const GA4_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID?.trim() || "G-FG9VQMZ6BZ";
export const mochiAnalytics = createGA4Client({
  measurementId: GA4_ID,
  surface: "mochi",
  productionHosts: ["mochichatbot.com", "www.mochichatbot.com"],
  enabled: true,
  additionalEvents: ["mochi_flatkey_click", "mochi_github_click", "mochi_guide_link", "mochi_guide_tab", "mochi_step_done", "mochi_guide_complete", "mochi_copy_command", "mochi_install_os", "mochi_copy_ai_prompt"],
  additionalParamKeys: ["source_site", "source_page", "cta_id", "guide_track", "step_number", "lang", "os", "has_ad_click"],
});
