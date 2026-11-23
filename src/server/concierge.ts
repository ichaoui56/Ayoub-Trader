import "server-only";

import { cache } from "react";
import { getDefaultConciergeSettings, type ConciergeSectionSettings } from "../concierge";

export const getConciergeSettings = cache(async (): Promise<ConciergeSectionSettings> => getDefaultConciergeSettings());