import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: "#7C3AED",
        surface: "#F3F4F6",
        "text-main": "#111827",
        "status-confirmado": "#22C55E",
        "status-pendente": "#F59E0B",
        "status-cancelado": "#EF4444",
        "status-concluido": "#374151",
        "status-livre": "#E5E7EB",
      },
      boxShadow: {
        sm: "0 1px 4px rgba(0, 0, 0, 0.06)",
      },
      borderRadius: {
        lg: "10px",
        xl: "12px",
      },
    },
  },
  plugins: [],
};
export default config;
