import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The dev server proxies /api to Express so the browser treats the API as
// same-origin. Better Auth's session cookie is then sent without any
// third-party-cookie or CORS complications.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
