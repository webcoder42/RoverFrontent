import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // VITE_API_BASE_URL is the *shipped* backend URL (it ends up in the generated
  // embed script and share links), so it must stay pointed at production.
  // The dev proxy is a separate concern: set VITE_DEV_API_PROXY to keep local
  // server work visible in `npm run dev`.
  const devProxyTarget =
    env.VITE_DEV_API_PROXY || "http://localhost:3000";

  return {
    envPrefix: ["VITE_", "PADDLE_"],
    plugins: [
      TanStackRouterVite(),
      react(),
      tailwindcss(),
      tsconfigPaths()
    ],
    server: {
      port: 5174,
      host: true,
      proxy: {
        // Use '/api/' (with trailing slash) so the SPA route '/api-keys/…' is
        // NOT silently proxied to the backend — it must stay on the SPA.
        '/api/': {
          target: devProxyTarget,
          changeOrigin: true,
        }
      }
    }
  };
});
