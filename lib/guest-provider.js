import { AppsScriptGuestProvider } from "@/lib/providers/apps-script-provider";
import { DemoGuestProvider } from "@/lib/providers/demo-provider";

const demoProvider = new DemoGuestProvider();

export function getGuestProvider() {
  const source = process.env.GUEST_DATA_SOURCE?.trim().toLowerCase();
  const endpoint = process.env.GOOGLE_APPS_SCRIPT_URL?.trim();
  const token = process.env.GOOGLE_APPS_SCRIPT_TOKEN?.trim();

  if (source === "demo" || (!source && process.env.NODE_ENV !== "production")) {
    return demoProvider;
  }

  if (source !== "google-sheets") {
    const error = new Error(
      "Set GUEST_DATA_SOURCE to either demo or google-sheets.",
    );
    error.code = "PROVIDER_CONFIGURATION_ERROR";
    error.status = 503;
    throw error;
  }

  if (!endpoint || !token) {
    const error = new Error(
      "Both GOOGLE_APPS_SCRIPT_URL and GOOGLE_APPS_SCRIPT_TOKEN are required.",
    );
    error.code = "PROVIDER_CONFIGURATION_ERROR";
    error.status = 503;
    throw error;
  }

  return new AppsScriptGuestProvider({ endpoint, token });
}
