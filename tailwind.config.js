/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
    "app/**/*.{ts,tsx}",
    "components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Nueva paleta de colores personalizada
        primary: {
          DEFAULT: "#013A1A", // Verde oscuro (principal)
          light: "#025928", // Verde medio
          lighter: "#0B7A40", // Verde claro
          lightest: "#E6F2ED", // Verde muy claro
        },
        accent: {
          DEFAULT: "#D4A72C", // Dorado/Ámbar
          light: "#F5F1E6", // Beige claro
        },
        neutral: {
          dark: "#333333", // Gris oscuro
          medium: "#666666", // Gris medio
          light: "#E5E5E5", // Gris claro
          white: "#FFFFFF", // Blanco
        },
        state: {
          success: "#0B7A40", // Verde claro (mismo que primary.lighter)
          error: "#D64045", // Rojo
          warning: "#F9A03F", // Ámbar
          info: "#2D7DD2", // Azul
        },
        // Mantener las variables originales de shadcn/ui
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/forms")],
}
