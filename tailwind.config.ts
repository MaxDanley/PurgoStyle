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
        brand: {
          50: '#fef5f2',
          100: '#fdeee9',
          200: '#fad9cf',
          300: '#f5b8a4',
          400: '#f39476',
          500: '#f27e56',
          600: '#e0653d',
          700: '#c94d28',
          800: '#a63d1e',
          900: '#8b3319',
        },
        primary: {
          50: '#fef5f2',
          100: '#fdeee9',
          200: '#fad9cf',
          300: '#f5b8a4',
          400: '#f39476',
          500: '#f27e56',
          600: '#e0653d',
          700: '#c94d28',
          800: '#a63d1e',
          900: '#8b3319',
        },
        secondary: {
          50: '#f5f5f5',
          100: '#e8e8e8',
          200: '#d9d9d9',
          300: '#bfbfbf',
          400: '#a6a6a6',
          500: '#8c8c8c',
          600: '#737373',
          700: '#595959',
          800: '#434343',
          900: '#262626',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;

