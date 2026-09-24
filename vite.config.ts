import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "https://rover-uoik.onrender.com";

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
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
        }
      }
    }
  };
});
