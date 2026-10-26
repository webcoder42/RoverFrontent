import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // In production the browser only ever talks to this origin (the gateway);
  // Vercel rewrites forward /api and /static. In dev the same paths are
  // proxied to the backend so local server work stays visible in `npm run dev`.
  const devProxyTarget = env.VITE_DEV_API_PROXY || "http://localhost:3000";

  return {
    envPrefix: ["VITE_", "PADDLE_"],
    // Keep Vite pre-bundling out of node_modules so EPERM locks on the
    // node_modules/.vite/deps folder (OneDrive/AV/file locks) disappear.
    cacheDir: "C:/Users/User/AppData/Local/Temp/rovor-chatbot-vite-cache",
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-dev-runtime",
        "@tanstack/react-router",
      ],
    },
    plugins: [TanStackRouterVite(), react(), tailwindcss(), tsconfigPaths()],
    server: {
      port: 5174,
      host: true,
      proxy: {
        // Use '/api/' (with trailing slash) so the SPA route '/api-keys/…' is
        // NOT silently proxied to the backend — it must stay on the SPA.
        "/api/": {
          target: devProxyTarget,
          changeOrigin: true,
        },
        // Same-origin gateway in production, so dev needs the static loader
        // (widget.js, rover-autoflow/*) forwarded to the backend too.
        "/static/": {
          target: devProxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
