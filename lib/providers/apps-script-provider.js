import {
  sanitizeCheckInResult,
  sanitizeGuestListItem,
} from "@/lib/guest-utils";

const REQUEST_TIMEOUT_MS = 20_000;
const MAX_GUESTS = 10_000;

function configurationError(message) {
  const error = new Error(message);
  error.code = "PROVIDER_CONFIGURATION_ERROR";
  error.status = 503;
  return error;
}

function validateEndpoint(value) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw configurationError("The Google Apps Script URL is invalid.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "script.google.com" ||
    !url.pathname.startsWith("/macros/s/") ||
    !url.pathname.endsWith("/exec")
  ) {
    throw configurationError(
      "Use the HTTPS /exec URL from a deployed Google Apps Script web app.",
    );
  }

  return url.toString();
}

export class AppsScriptGuestProvider {
  source = "google-sheets";

  constructor({ endpoint, token }) {
    this.endpoint = validateEndpoint(endpoint);
    this.token = token;
  }

  async request(action, payload = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(this.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify({
          action,
          token: this.token,
          ...payload,
        }),
        cache: "no-store",
        redirect: "follow",
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error("Google Sheets service is unavailable.");
        error.code = "PROVIDER_UNAVAILABLE";
        error.status = 503;
        throw error;
      }

      let data;
      try {
        data = await response.json();
      } catch {
        const error = new Error("Google Sheets returned an invalid response.");
        error.code = "INVALID_PROVIDER_RESPONSE";
        error.status = 502;
        throw error;
      }

      if (!data?.ok) {
        const error = new Error(data?.message || "The request could not be completed.");
        error.code = data?.code || "PROVIDER_ERROR";
        error.status =
          error.code === "GUEST_NOT_FOUND"
            ? 404
            : error.code === "GUEST_INACTIVE" ||
                error.code === "TABLE_NOT_ASSIGNED"
              ? 409
              : 503;
        throw error;
      }

      return data;
    } catch (error) {
      if (error?.name === "AbortError") {
        const timeoutError = new Error("Google Sheets took too long to respond.");
        timeoutError.code = "PROVIDER_TIMEOUT";
        timeoutError.status = 504;
        throw timeoutError;
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async listGuests() {
    const data = await this.request("listGuests");
    if (!Array.isArray(data.guests) || data.guests.length > MAX_GUESTS) {
      const error = new Error("The guest list response is invalid.");
      error.code = "INVALID_PROVIDER_RESPONSE";
      error.status = 502;
      throw error;
    }

    return data.guests
      .map(sanitizeGuestListItem)
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async checkIn({ guestId, requestId }) {
    const data = await this.request("checkIn", { guestId, requestId });
    const guest = sanitizeCheckInResult(data.guest);

    if (
      !guest ||
      guest.id !== guestId ||
      !["checked-in", "already-checked-in"].includes(data.status)
    ) {
      const error = new Error("The check-in response is invalid.");
      error.code = "INVALID_PROVIDER_RESPONSE";
      error.status = 502;
      throw error;
    }

    return {
      status: data.status,
      guest,
    };
  }
}
