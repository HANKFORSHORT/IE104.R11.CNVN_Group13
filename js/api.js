(function () {
  "use strict";

  class ApiError extends Error {
    constructor(status, code, message) {
      super(message);
      this.name = "ApiError";
      this.status = status;
      this.code = code;
    }
  }

  async function request(path, options = {}) {
    const url = new URL(path, window.CONFIG.API_BASE_URL);
    const headers = { ...(options.headers || {}) };
    if (options.body !== undefined) headers["Content-Type"] = "application/json";
    let response;
    try {
      response = await fetch(url, {
        method: options.method || "GET",
        credentials: "include",
        headers,
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
        signal: options.signal
      });
    } catch (error) {
      if (error.name === "AbortError") throw error;
      throw new ApiError(0, "NETWORK_ERROR", "Could not connect to Astra. Check your connection and try again.");
    }
    let payload;
    try { payload = await response.json(); }
    catch { throw new ApiError(response.status, "INVALID_RESPONSE", "Astra returned an invalid response."); }
    if (!response.ok) {
      const issue = payload && payload.error;
      throw new ApiError(response.status, issue && issue.code || "REQUEST_FAILED",
        issue && issue.message || "The request could not be completed.");
    }
    return payload.data;
  }

  function oauthUrl(provider, returnTo = window.location.href, link = false) {
    if (!["google", "facebook"].includes(provider)) throw new TypeError("Unknown provider");
    const url = new URL("/api/v1/auth/" + provider + (link ? "/link" : ""),
      window.CONFIG.API_BASE_URL);
    url.searchParams.set("returnTo", returnTo);
    return url.href;
  }

  window.AstraAPI = Object.freeze({ request, oauthUrl, ApiError });
})();
