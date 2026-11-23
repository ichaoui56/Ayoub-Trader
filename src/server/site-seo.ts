import "server-only";

import { cache } from "react";
import { getDefaultSiteSeoSettings, siteSeoSettingKey, type SiteSeoSettings } from "../seo";

export const getSiteSeoSettings = cache(async (): Promise<SiteSeoSettings> => {
  return getDefaultSiteSeoSettings();
});

export { getDefaultSiteSeoSettings, siteSeoSettingKey };