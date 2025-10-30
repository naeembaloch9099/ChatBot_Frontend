// services/Api.js
// Helper to resolve backend base URL. If VITE_BACKEND_URL points to localhost
// but the app is being accessed from another device (window.location.hostname),
// rewrite the hostname so API calls target the server machine instead of the
// client's localhost (which would be the phone/tablet).
function resolveBackend() {
  const envUrl = import.meta.env.VITE_BACKEND_URL ?? null;
  let backend =
    envUrl ?? "https://chatbotserver-production-6d4b.up.railway.app";

  if (envUrl && typeof window !== "undefined") {
    try {
      const parsed = new URL(envUrl);
      const isLocalhost = ["localhost", "127.0.0.1"].includes(parsed.hostname);
      const hostIsRemote = !["localhost", "127.0.0.1"].includes(
        window.location.hostname
      );
      if (isLocalhost && hostIsRemote) {
        // replace localhost with the current client host (your PC's LAN IP when
        // you're accessing from a phone). Keep the original port.
        parsed.hostname = window.location.hostname;
        // strip trailing slash
        backend = parsed.toString().replace(/\/$/, "");
      }
    } catch {
      // if parsing fails, just fall back to the original value
    }
  }
  return backend;
}

// Helper to get auth headers with token
function getAuthHeaders(additionalHeaders = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = { ...additionalHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// Helper to refresh the access token
async function refreshAccessToken() {
  const BACKEND = resolveBackend();
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.log("[api client] No refresh token available");
    return false;
  }

  try {
    const res = await fetch(`${BACKEND}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      console.log("[api client] Failed to refresh token");
      // Clear invalid tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("isAuthenticated");
      return false;
    }

    const data = await res.json();
    if (data.accessToken) {
      localStorage.setItem("accessToken", data.accessToken);
      console.log("[api client] Access token refreshed successfully");
      return true;
    }
    return false;
  } catch (err) {
    console.error("[api client] refreshAccessToken error:", err);
    return false;
  }
}

// Helper to make authenticated fetch with auto token refresh
async function authenticatedFetch(url, options = {}) {
  let res = await fetch(url, options);

  // If 401, try to refresh token and retry once
  if (res.status === 401) {
    console.log("[api client] Got 401, attempting to refresh token...");
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      // Update headers with new token and retry
      const newHeaders = {
        ...options.headers,
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      };
      res = await fetch(url, { ...options, headers: newHeaders });
    } else {
      // Refresh failed, redirect to login
      console.log("[api client] Token refresh failed, redirecting to login");
      window.location.href = "/";
    }
  }

  return res;
}

export async function getGeminiResponse({ systemPrompt, conversation }) {
  // Use a relative URL in dev so Vite dev-server middleware/proxy handles /api/* routes
  // resolveBackend() will rewrite localhost to the current LAN host when needed.
  const BACKEND = resolveBackend();
  console.log(
    "[api client] Forwarding prompt to backend",
    BACKEND || "(relative) /api/gemini"
  );
  const res = await authenticatedFetch(`${BACKEND}/api/gemini`, {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    credentials: "include",
    body: JSON.stringify({ systemPrompt, conversation }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[api client] backend error body:", data);
    // Ensure we throw a readable error message, not [object Object]
    const errPayload = data?.error ?? data;
    const msg =
      typeof errPayload === "string" ? errPayload : JSON.stringify(errPayload);
    throw new Error(msg || "Backend error");
  }
  return data.response;
}

export async function saveMessage(message) {
  const BACKEND = resolveBackend();
  try {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const res = await authenticatedFetch(`${BACKEND}/api/messages`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify(message),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[api client] Failed to save message:", data);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error("[api client] saveMessage error:", err);
    return null;
  }
}

export async function getMessages({ chatId, limit = 100 } = {}) {
  const BACKEND = resolveBackend();
  const params = new URLSearchParams();
  if (chatId) params.set("chatId", chatId);
  params.set("limit", String(limit));
  const res = await authenticatedFetch(
    `${BACKEND}/api/messages?${params.toString()}`,
    {
      headers: getAuthHeaders(),
      credentials: "include",
    }
  );
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function getLatestMessageForChat(chatId) {
  const BACKEND = resolveBackend();
  const res = await fetch(
    `${BACKEND}/api/messages/latest/${encodeURIComponent(chatId)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Failed to fetch latest message");
  return res.json();
}

export async function getChats() {
  const BACKEND = resolveBackend();
  const res = await authenticatedFetch(`${BACKEND}/api/chats`, {
    headers: getAuthHeaders(),
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("[api client] getChats failed:", data);
    throw new Error("Failed to fetch chats");
  }
  return res.json();
}

export async function askWithFiles({ question, files = [] } = {}) {
  const BACKEND = resolveBackend();
  const fd = new FormData();
  fd.append("question", question || "");
  for (const f of files) {
    fd.append("files", f, f.name);
  }
  const res = await authenticatedFetch(`${BACKEND}/api/ask-with-files`, {
    method: "POST",
    headers: getAuthHeaders(), // Don't set Content-Type for FormData
    credentials: "include",
    body: fd,
  });
  const data = await res.json();
  if (!res.ok) {
    console.error("askWithFiles failed", data);
    throw new Error(data?.error || "askWithFiles failed");
  }
  return data;
}

export async function createChat({ title } = {}) {
  const BACKEND = resolveBackend();
  try {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const res = await authenticatedFetch(`${BACKEND}/api/chats`, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[api client] createChat failed:", data);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("[api client] createChat error:", err);
    return null;
  }
}

export async function deleteChat(chatId) {
  const BACKEND = resolveBackend();
  try {
    const res = await authenticatedFetch(
      `${BACKEND}/api/chats/${encodeURIComponent(chatId)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
        credentials: "include",
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[api client] deleteChat failed:", data);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("[api client] deleteChat error:", err);
    return null;
  }
}

export async function updateChat(chatId, { title } = {}) {
  const BACKEND = resolveBackend();
  try {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const res = await authenticatedFetch(
      `${BACKEND}/api/chats/${encodeURIComponent(chatId)}`,
      {
        method: "PATCH",
        headers,
        credentials: "include",
        body: JSON.stringify({ title }),
      }
    );
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      console.error("[api client] updateChat failed:", data);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error("[api client] updateChat error:", err);
    return null;
  }
}

export async function checkAuthStatus() {
  const BACKEND = resolveBackend();
  try {
    const res = await authenticatedFetch(`${BACKEND}/api/auth/me`, {
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      return { authenticated: false };
    }
    const data = await res.json();
    return { authenticated: true, user: data.user };
  } catch (err) {
    console.error("[api client] checkAuthStatus error:", err);
    return { authenticated: false };
  }
}

export async function updateProfile(formData) {
  const BACKEND = resolveBackend();
  try {
    const res = await authenticatedFetch(`${BACKEND}/api/auth/profile`, {
      method: "PUT",
      headers: getAuthHeaders(),
      credentials: "include",
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || "Failed to update profile" };
    }
    return await res.json();
  } catch (err) {
    console.error("[api client] updateProfile error:", err);
    return { ok: false, error: "Network error" };
  }
}

export async function deleteAccount() {
  const BACKEND = resolveBackend();
  try {
    const res = await authenticatedFetch(`${BACKEND}/api/auth/account`, {
      method: "DELETE",
      headers: getAuthHeaders(),
      credentials: "include",
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || "Failed to delete account" };
    }
    return await res.json();
  } catch (err) {
    console.error("[api client] deleteAccount error:", err);
    return { ok: false, error: "Network error" };
  }
}
