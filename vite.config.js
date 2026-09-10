import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      buffer: "buffer",
      process: "process/browser.js",
      stream: "stream-browserify",
      crypto: "crypto-browserify",
    },
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["buffer", "process"],
  },
  build: {
    rollupOptions: {
      output: {
        // Vendors pesados en chunks propios: se cachean entre despliegues y no
        // los descarga quien no entra a la pantalla que los usa.
        manualChunks: {
          // Sin esto rollup los mete dentro de vendor-solana, y como polyfills.js
          // necesita Buffer en el arranque, el entry acababa importando el chunk
          // de Solana entero.
          "vendor-polyfills": [
            "buffer",
            "process",
            "stream-browserify",
            "crypto-browserify",
          ],
          "vendor-react": [
            "react",
            "react/jsx-runtime",
            "react-dom",
            "react-router-dom",
          ],
          "vendor-solana": [
            "@solana/web3.js",
            "@solana/spl-token",
            "@solana/wallet-adapter-base",
            "@solana/wallet-adapter-react",
            "@solana/wallet-adapter-react-ui",
            "@solana/wallet-adapter-wallets",
            "@solana/wallet-adapter-phantom",
          ],
          "vendor-stripe": ["@stripe/react-stripe-js", "@stripe/stripe-js"],
          "vendor-three": ["three"],
          "vendor-motion": ["framer-motion"],
        },
      },
    },
  },
});
