import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "buffer", replacement: "buffer" },
      // Exact match: a string alias also rewrites `process/` (readable-stream@4)
      // into `process/browser.js/`, which breaks the Netlify build.
      { find: /^process$/, replacement: "process/browser.js" },
      { find: "stream", replacement: "stream-browserify" },
      { find: "crypto", replacement: "crypto-browserify" },
    ],
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
          "vendor-motion": ["framer-motion"],
        },
      },
    },
  },
});
