import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path' 

// Custom plugin to replace remote code strings (reCAPTCHA, etc.) in Firebase JS bundle
function stripFirebaseRemoteCode() {
  return {
    name: 'strip-firebase-remote-code',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    generateBundle(_options: any, bundle: any) {
      for (const chunk of Object.values(bundle)) {
        // @ts-expect-error type narrowing inside rollup bundle
        if (chunk.type === 'chunk') {
          // Chrome Web Store flags these literal strings as 'remotely hosted code'
          // We replace them with empty strings so that NO remote scripts are attempted to be loaded.
          // @ts-expect-error type narrowing inside rollup bundle
          chunk.code = chunk.code
            // Replace the real URLs with empty strings
            .replace(/https:\/\/www\.google\.com\/recaptcha\/api\.js/g, "")
            .replace(/https:\/\/apis\.google\.com\/js\/api\.js/g, "")
            .replace(/https:\/\/www\.google\.com\/recaptcha\/enterprise\.js\?render=/g, "")
            // Also replace the dummy URLs that were previously added
            .replace(/https:\/\/dummy\.recaptcha\/api\.js/g, "")
            .replace(/https:\/\/dummy\.apis\.google\.com\/js\/api\.js/g, "")
            .replace(/https:\/\/dummy\.recaptcha\.enterprise\/render=/g, "")
            // Specifically disable the creation of `<script>` tags by Firebase Auth's `loadJS`.
            // The Chrome Web Store reviewer specifically flagged `document.createElement("script")`.
            // We replace it with "noscript" so no external scripts are fetched or executed.
            .replace(/document\.createElement\("script"\)/g, 'document.createElement("noscript")');
        }
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), stripFirebaseRemoteCode()],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: '[name].js', // makes the extension output filename the same as the input
      }
    },
  },
})