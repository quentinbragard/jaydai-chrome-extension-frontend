/** @type {import('tailwindcss').Config} */
module.exports = {
	prefix: 'jd-',
	darkMode: ["class"],
	content: [
	  './src/**/*.{js,jsx,ts,tsx}',
	],
	theme: {
	  extend: {
		colors: {
		  background: 'var(--background)',
		  foreground: 'var(--foreground)',
		  card: {
			DEFAULT: 'var(--card)',
			foreground: 'var(--card-foreground)'
		  },
		  popover: {
			DEFAULT: 'var(--popover)',
			foreground: 'var(--popover-foreground)'
		  },
		  primary: {
			DEFAULT: 'var(--primary)',
			foreground: 'var(--primary-foreground)'
		  },
		  secondary: {
			DEFAULT: 'var(--secondary)',
			foreground: 'var(--secondary-foreground)'
		  },
		  muted: {
			DEFAULT: 'var(--muted)',
			foreground: 'var(--muted-foreground)'
		  },
		  accent: {
			DEFAULT: 'var(--accent)',
			foreground: 'var(--accent-foreground)'
		  },
		  destructive: {
			DEFAULT: 'var(--destructive)',
			foreground: 'var(--destructive-foreground)'
		  },
		  border: 'var(--border)',
		  input: 'var(--input)',
		  ring: 'var(--ring)',
		  chart: {
			'1': 'var(--chart-1)',
			'2': 'var(--chart-2)',
			'3': 'var(--chart-3)',
			'4': 'var(--chart-4)',
			'5': 'var(--chart-5)'
		  },
		},
		borderRadius: {
		  lg: 'var(--radius)',
		  md: 'calc(var(--radius) - 2px)',
		  sm: 'calc(var(--radius) - 4px)'
		},
		// Add animation utilities
		animation: {
		  'in': 'jd-fadeIn 0.3s ease-out',
		  'slide-up': 'jd-slideInUp 0.3s ease-out',
		  'pulse-slow': 'jd-pulse-glow 3s infinite',
		  'float': 'jd-float 3s ease infinite',
		},
	  }
	},
	plugins: [
		require('tailwind-scrollbar')({ nocompatible: true }),
	],
  }