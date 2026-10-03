import type { IntegrationConfig } from "./types";
import generatedIntegrationsRaw from "../content/generated/integrations.json";

type GeneratedIntegrations = {
  gaMeasurementId?: string | null;
  googleSiteVerification?: string | null;
  bingSiteVerification?: string | null;
};

const generatedIntegrations = generatedIntegrationsRaw as GeneratedIntegrations;

const pirschCode = process.env.NEXT_PUBLIC_PIRSCH_CODE?.trim() || "";
const gaFromEnv = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "";
const gaFromGenerated = typeof generatedIntegrations.gaMeasurementId === "string"
  ? generatedIntegrations.gaMeasurementId.trim()
  : "";
const gaMeasurementId = gaFromEnv || gaFromGenerated || "";

const googleFromEnv = process.env.GOOGLE_SITE_VERIFICATION?.trim() || "";
const googleFromGenerated = typeof generatedIntegrations.googleSiteVerification === "string"
  ? generatedIntegrations.googleSiteVerification.trim()
  : "";
const googleVerification = googleFromEnv || googleFromGenerated || null;

const bingFromEnv = process.env.BING_SITE_VERIFICATION?.trim() || "";
const bingFromGenerated = typeof generatedIntegrations.bingSiteVerification === "string"
  ? generatedIntegrations.bingSiteVerification.trim()
  : "";
const bingVerification = bingFromEnv || bingFromGenerated || null;

export const integrations: IntegrationConfig = {
  analytics: /^G-[A-Z0-9]+$/i.test(gaMeasurementId)
    ? { provider: "google-analytics", measurementId: gaMeasurementId.toUpperCase() }
    : pirschCode
      ? { provider: "pirsch", identificationCode: pirschCode }
      : { provider: "none" },
  verification: {
    google: googleVerification,
    bing: bingVerification,
  },
};
