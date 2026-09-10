import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate"; // ✨ Importe o plugin aqui

function withColorMix(variableName: string): any {
    return ({ opacityValue }: { opacityValue?: string }) => {
        if (opacityValue !== undefined) {
            return `color-mix(in srgb, var(${variableName}) calc(${opacityValue} * 100%), transparent)`;
        }
        return `var(${variableName})`;
    };
}

const config: Config = {
    darkMode: ["class"],
    content: [
        "./src/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}", 
        "./node_modules/@design-systems-orion/**/*.{js,mjs}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    '50': '#fff7ed',
                    '100': '#ffedd5',
                    '200': '#fed7aa',
                    '300': '#fdba74',
                    '400': '#fb923c',
                    '500': '#f97316',
                    '600': '#ea580c',
                    '700': '#c2410c',
                    '800': '#9a3412',
                    '900': '#7c2d12',

                    DEFAULT: withColorMix('--primary'),
                    foreground: withColorMix('--primary-foreground')
                },
                sidebar: {
                    DEFAULT: withColorMix('--sidebar'),
                    foreground: withColorMix('--sidebar-foreground'),
                    primary: withColorMix('--sidebar-primary'),
                    'primary-foreground': withColorMix('--sidebar-primary-foreground'),
                    accent: withColorMix('--sidebar-accent'),
                    'accent-foreground': withColorMix('--sidebar-accent-foreground'),
                    border: withColorMix('--sidebar-border'),
                    ring: withColorMix('--sidebar-ring'),
                },
                'brand-primary': withColorMix('--brand-primary'),
                'brand-hover': withColorMix('--brand-hover'),
                'brand-accent': withColorMix('--brand-accent'),
                'primary-hover': withColorMix('--primary-hover'),
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
                ring: 'var(--ring)',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                }
            },
            animation: {
                spin: 'spin 1s linear infinite',
                in: 'fadeIn 0.5s ease-in-out',
                'accordion-down': 'accordion-down 0.2s ease-out',
                'accordion-up': 'accordion-up 0.2s ease-out',
            },
            keyframes: {
                fadeIn: {
                    '0%': {
                        opacity: '0'
                    },
                    '100%': {
                        opacity: '1'
                    }
                },

                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            }
        }
    },
    plugins: [
        tailwindcssAnimate
    ],
};

export default config;