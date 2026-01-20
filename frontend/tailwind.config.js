/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#0c0c0e", // Premium Black
        surface: "#111114", // Card Surface
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1", // Indigo Neon
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          DEFAULT: "#6366f1",
        },
        secondary: {
          500: "#8b5cf6",
          600: "#7c3aed",
          DEFAULT: "#7c3aed", // Purple
        },
        operations: "#1e40af", // Blue
        finance: "#d97706", // Gold/Amber
        success: "#059669", // Green
      },
      fontFamily: {
        sans: ["Inter", "Outfit", "sans-serif"],
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        glow: "0 0 15px rgba(99, 102, 241, 0.3)",
        neon: "0 0 20px rgba(124, 58, 237, 0.4)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "fade-in-up": "fadeInUp 0.6s ease-out",
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};
