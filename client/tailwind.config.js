/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
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
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand color extensions
        navy: "hsl(var(--navy-blue))",
        royal: "hsl(var(--royal-blue))",
        medium: "hsl(var(--medium-blue))",
        light: "hsl(var(--light-blue))",
        sky: "hsl(var(--sky-blue))",
        surface: "hsl(var(--surface-gray))",
        brand: {
          navy: "hsl(var(--navy-blue))",
          royal: "hsl(var(--royal-blue))",
          medium: "hsl(var(--medium-blue))",
          light: "hsl(var(--light-blue))",
          sky: "hsl(var(--sky-blue))",
          surface: "hsl(var(--surface-gray))",
          background: "hsl(var(--background-light))",
          text: "hsl(var(--text-dark))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, hsl(var(--navy-blue)) 0%, hsl(var(--royal-blue)) 100%)',
        'gradient-hero': 'linear-gradient(135deg, hsl(var(--background-light)) 0%, hsl(var(--sky-blue)) 100%)',
        'gradient-card': 'linear-gradient(135deg, hsl(0 0% 100%) 0%, hsl(var(--background-light)) 100%)',
      },
      boxShadow: {
        'brand': '0 4px 6px -1px hsl(var(--navy-blue) / 0.1), 0 2px 4px -1px hsl(var(--navy-blue) / 0.06)',
        'brand-lg': '0 10px 15px -3px hsl(var(--navy-blue) / 0.1), 0 4px 6px -2px hsl(var(--navy-blue) / 0.05)',
      },
    },
  },
  plugins: [],
}