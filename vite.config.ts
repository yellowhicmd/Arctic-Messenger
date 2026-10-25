
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: new URL("./index.html", import.meta.url).pathname,
        login: new URL("./login/index.html", import.meta.url).pathname,
        signup: new URL("./sign-up/index.html", import.meta.url).pathname,
      },
    },
  },
});
