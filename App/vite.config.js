import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cardsApi } from "./scripts/cards-api.js";

// all_cards.json is served from App/public/ at /all_cards.json (Vite default).
// cardsApi() adds the dev-only editing API (/api/deck, /api/health).
export default defineConfig({
  plugins: [react(), cardsApi()],
  server: { open: true },
});
