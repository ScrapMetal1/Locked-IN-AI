import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path' 

// Custom plugin to replace remote code strings (reCAPTCHA, etc.) in Firebase JS bundle
function stripFirebaseRemoteCode() {
  return {
    name: 'strip-firebase-remote-code',
    generateBundle(_options: any, bundle: any) {
      for (const chunk of Object.values(bundle)) {
        // @ts-ignore
        if (chunk.type === 'chunk') {
          // Chrome Web Store flags these literal strings as 'remotely hosted code'
          // @ts-ignore
          chunk.code = chunk.code
            .replace(/https:\/\/www\.google\.com\/recaptcha\/api\.js/g, "https://dummy.recaptcha/api.js")
            .replace(/https:\/\/apis\.google\.com\/js\/api\.js/g, "https://dummy.apis.google.com/js/api.js")
            .replace(/https:\/\/www\.google\.com\/recaptcha\/enterprise\.js\?render=/g, "https://dummy.recaptcha.enterprise/render=");
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