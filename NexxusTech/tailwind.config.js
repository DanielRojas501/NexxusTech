/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: [
      "./index.html",
      "./src/**/*.{ts,tsx,js,jsx}",
      "../src/api/**/*.{ts,tsx,js,jsx}",
    ],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			},
  			/* ---- Identidad ITS (Instituto Tecnológico de Saltillo) ---- */
  			guindo: {
  				50: '#FAF0F2', 100: '#F2DCE0', 200: '#E2BAC2', 300: '#D1939F',
  				400: '#B05064', 500: '#932435', 600: '#7A1B29', 700: '#651723',
  				800: '#54111B', 900: '#3E0D15', 950: '#2A090E'
  			},
  			dorado: {
  				50: '#FAF5EA', 100: '#F2E8CF', 200: '#E5D2A8', 300: '#D8B775',
  				400: '#CDAE6B', 500: '#C5A059', 600: '#A8894B', 700: '#987836',
  				800: '#775D2A', 900: '#5A451F', 950: '#3C2D14'
  			},
  			verde: {
  				100: '#DEECE0', 200: '#B2D4BA', 300: '#9CC2A4', 400: '#6FA37C',
  				500: '#548962', 600: '#436E4F', 700: '#385942', 800: '#2F4A37', 900: '#283D2E'
  			},
  			acero: {
  				100: '#E4EAF1', 200: '#C7D2DE', 300: '#A3B5C9', 400: '#7C93AC',
  				500: '#5F7C97', 600: '#4E6580', 700: '#415468', 800: '#374756', 900: '#2F3B46'
  			},
  			/* Remapeo de acentos antiguos → paleta ITS (valores por modo en index.css) */
  			cyan: {
  				100: 'rgb(var(--its-cyan-100) / <alpha-value>)',
  				200: 'rgb(var(--its-cyan-200) / <alpha-value>)',
  				300: 'rgb(var(--its-cyan-300) / <alpha-value>)',
  				400: 'rgb(var(--its-cyan-400) / <alpha-value>)',
  				500: 'rgb(var(--its-cyan-500) / <alpha-value>)'
  			},
  			violet: {
  				300: 'rgb(var(--its-violet-300) / <alpha-value>)',
  				400: 'rgb(var(--its-violet-400) / <alpha-value>)',
  				500: 'rgb(var(--its-violet-500) / <alpha-value>)'
  			},
  			sky: {
  				300: 'rgb(var(--its-sky-300) / <alpha-value>)',
  				400: 'rgb(var(--its-sky-400) / <alpha-value>)'
  			},
  			amber: {
  				100: 'rgb(var(--its-amber-100) / <alpha-value>)',
  				200: 'rgb(var(--its-amber-200) / <alpha-value>)',
  				300: 'rgb(var(--its-amber-300) / <alpha-value>)',
  				400: 'rgb(var(--its-amber-400) / <alpha-value>)'
  			},
  			orange: {
  				100: 'rgb(var(--its-orange-100) / <alpha-value>)',
  				400: 'rgb(var(--its-orange-400) / <alpha-value>)',
  				600: 'rgb(var(--its-orange-600) / <alpha-value>)'
  			},
  			emerald: {
  				100: 'rgb(var(--its-emerald-100) / <alpha-value>)',
  				200: 'rgb(var(--its-emerald-200) / <alpha-value>)',
  				300: 'rgb(var(--its-emerald-300) / <alpha-value>)',
  				400: 'rgb(var(--its-emerald-400) / <alpha-value>)',
  				500: 'rgb(var(--its-emerald-500) / <alpha-value>)'
  			},
  			green: {
  				400: 'rgb(var(--its-green-400) / <alpha-value>)'
  			},
  			rose: {
  				200: 'rgb(var(--its-rose-200) / <alpha-value>)',
  				300: 'rgb(var(--its-rose-300) / <alpha-value>)',
  				400: 'rgb(var(--its-rose-400) / <alpha-value>)',
  				500: 'rgb(var(--its-rose-500) / <alpha-value>)'
  			},
  			red: {
  				50: 'rgb(var(--its-red-50) / <alpha-value>)',
  				300: 'rgb(var(--its-red-300) / <alpha-value>)',
  				400: 'rgb(var(--its-red-400) / <alpha-value>)',
  				600: 'rgb(var(--its-red-600) / <alpha-value>)'
  			},
  			pink: {
  				400: 'rgb(var(--its-pink-400) / <alpha-value>)'
  			},
  			blue: {
  				300: 'rgb(var(--its-blue-300) / <alpha-value>)',
  				400: 'rgb(var(--its-blue-400) / <alpha-value>)'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)']
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
