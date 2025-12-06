// services/Api.js
// Backend URLs to try in order
const BACKEND_URLS = [
  "http://localhost:8080",
  "https://chatbotserver-production-6d4b.up.railway.app",
];

// Helper function to try fetch with fallback to multiple backends
async function fetchWithFallback(endpoint, options = {}) {
  const errors = [];

  for (const backend of BACKEND_URLS) {
    try {
      console.log(`[API] Trying ${backend}${endpoint}`);
      const response = await fetch(`${backend}${endpoint}`, {
        ...options,
        credentials: "include",
      });

      // If request succeeded, return the response
      console.log(`[API] Success with ${backend}`);
      return response;
    } catch (error) {
      console.warn(`[API] Failed with ${backend}:`, error.message);
      errors.push({ backend, error: error.message });
      // Continue to next backend
    }
  }

  // All backends failed
  console.error("[API] All backends failed:", errors);
  throw new Error(
    "Network error: Unable to connect to server. Please check your connection."
  );
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
  const refreshToken = localStorage.getItem("refreshToken");

  if (!refreshToken) {
    console.log("[api client] No refresh token available");
    return false;
  }

  try {
    const res = await fetchWithFallback("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

// Helper to make authenticated fetch with auto token refresh and fallback
async function authenticatedFetch(endpoint, options = {}) {
  try {
    let res = await fetchWithFallback(endpoint, options);

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
        res = await fetchWithFallback(endpoint, {
          ...options,
          headers: newHeaders,
        });
      } else {
        // Refresh failed, redirect to login
        console.log("[api client] Token refresh failed, redirecting to login");
        window.location.href = "/";
      }
    }

    return res;
  } catch (error) {
    // Re-throw with user-friendly message
    throw new Error(error.message || "Network error");
  }
}

export async function getGeminiResponse({ systemPrompt, conversation }) {
  console.log("[api client] Forwarding prompt to backend");
  const res = await authenticatedFetch("/api/gemini", {
    method: "POST",
    headers: getAuthHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ systemPrompt, conversation }),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("[api client] backend error body:", data);
    const errPayload = data?.error ?? data;
    const msg =
      typeof errPayload === "string" ? errPayload : JSON.stringify(errPayload);
    throw new Error(msg || "Backend error");
  }
  return data.response;
}

export async function saveMessage(message) {
  try {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const res = await authenticatedFetch("/api/messages", {
      method: "POST",
      headers,
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
  const params = new URLSearchParams();
  if (chatId) params.set("chatId", chatId);
  params.set("limit", String(limit));
  const res = await authenticatedFetch(`/api/messages?${params.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch messages");
  return res.json();
}

export async function getLatestMessageForChat(chatId) {
  const res = await fetchWithFallback(
    `/api/messages/latest/${encodeURIComponent(chatId)}`,
    {}
  );
  if (!res.ok) throw new Error("Failed to fetch latest message");
  return res.json();
}

export async function getChats() {
  const res = await authenticatedFetch("/api/chats", {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    console.error("[api client] getChats failed:", data);
    throw new Error("Failed to fetch chats");
  }
  return res.json();
}

export async function askWithFiles({ question, files = [] } = {}) {
  const fd = new FormData();
  fd.append("question", question || "");
  for (const f of files) {
    fd.append("files", f, f.name);
  }
  const res = await authenticatedFetch("/api/ask-with-files", {
    method: "POST",
    headers: getAuthHeaders(),
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
  try {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const res = await authenticatedFetch("/api/chats", {
      method: "POST",
      headers,
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
  try {
    const res = await authenticatedFetch(
      `/api/chats/${encodeURIComponent(chatId)}`,
      {
        method: "DELETE",
        headers: getAuthHeaders(),
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
  try {
    const headers = getAuthHeaders({ "Content-Type": "application/json" });
    const res = await authenticatedFetch(
      `/api/chats/${encodeURIComponent(chatId)}`,
      {
        method: "PATCH",
        headers,
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
  try {
    const res = await authenticatedFetch("/api/auth/me", {
      headers: getAuthHeaders(),
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
  try {
    const res = await authenticatedFetch("/api/auth/profile", {
      method: "PUT",
      headers: getAuthHeaders(),
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || "Failed to update profile" };
    }
    return await res.json();
  } catch (err) {
    console.error("[api client] updateProfile error:", err);
    return { ok: false, error: err.message || "Network error" };
  }
}

export async function deleteAccount() {
  try {
    const res = await authenticatedFetch("/api/auth/account", {
      method: "DELETE",
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || "Failed to delete account" };
    }
    return await res.json();
  } catch (err) {
    console.error("[api client] deleteAccount error:", err);
    return { ok: false, error: err.message || "Network error" };
  }
}

// Export helper for direct auth calls (used in Login/Signup components)
export { fetchWithFallback };
