import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: `http://oh-cxg-dev.mvls.gla.ac.uk/breastcancer/`,
  server: {
   port: 5000
  }
});
