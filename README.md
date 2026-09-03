# AI-Coding-Challenge-flashcards-app

## Reflection
- **Where AI saved time:** AI significantly accelerated the initial setup by rapidly generating the boilerplate for state management (using `useState` and `useEffect`), the semantic HTML structure of the application shell, and the CSS grid layout, saving hours of manual setup.
- **AI bug identified and fixed:** The AI generated the UI for the "Previous", "Next", and "Shuffle" buttons but failed to wire them up to any `onClick` event handlers. I fixed this by implementing `handleNextCard`, `handlePrevCard`, and `handleShuffle` state transition logic and binding them directly to the buttons to restore full functionality.
- **Code refactored for clarity:** I refactored the standard text buttons (`Study`, `Rename`, `Delete`, `Edit card`, `Previous`, `Next`) in the UI into sleek, accessible SVG icons. This cleared up visual clutter in the interface and made the application look much cleaner and more modern.
- **Accessibility improvement added:** When I replaced the text buttons with SVG icons, I explicitly added `aria-label` attributes (e.g., `aria-label="Edit card"`) to ensure the controls remain fully accessible to screen readers despite having no visible text.
- **Prompt changes that improved AI output:** Providing highly specific instructions (like providing the exact SVG code and line numbers to replace) rather than vague requests (like "make the buttons look better") yielded much more accurate, predictable, and usable code modifications without unintended side effects.

```

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.
You can also try [the experimental native React Compiler support in plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md#rust-react-compiler) by using `compiler: true` in the plugin options instead of using the Babel plugin.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])


