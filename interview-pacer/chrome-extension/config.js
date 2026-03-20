// Set this to your deployed app URL (Vercel) or local dev URL
// The extension finds the app tab by matching this string against tab URLs
const APP_URL = 'localhost:5173'; // Change to your Vercel URL, e.g. 'interview-pacer.vercel.app'

// Export for use in background.js (loaded as a module via importScripts is not needed —
// background.js reads this directly since both files are in the same extension context)
