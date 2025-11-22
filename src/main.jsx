import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./AppRouter.jsx";
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Debug: Check if client ID is loaded
console.log("Google Client ID:", GOOGLE_CLIENT_ID);

if (!GOOGLE_CLIENT_ID) {
  console.error("VITE_GOOGLE_CLIENT_ID is not set in environment variables");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
