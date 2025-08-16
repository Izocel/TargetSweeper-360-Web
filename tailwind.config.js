/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'military': {
                    50: '#f0f9f0',
                    100: '#dcf2dc',
                    200: '#bce5bc',
                    300: '#8bd18b',
                    400: '#52b552',
                    500: '#2d9a2d',
                    600: '#1e7e1e',
                    700: '#1a651a',
                    800: '#185118',
                    900: '#164316',
                },
                'tactical': {
                    50: '#f8f8f8',
                    100: '#e8e8e8',
                    200: '#d1d1d1',
                    300: '#b4b4b4',
                    400: '#8a8a8a',
                    500: '#6a6a6a',
                    600: '#4a4a4a',
                    700: '#3a3a3a',
                    800: '#2a2a2a',
                    900: '#1a1a1a',
                }
            },
            fontFamily: {
                'mono': ['Courier New', 'monospace'],
                'tactical': ['Arial', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
