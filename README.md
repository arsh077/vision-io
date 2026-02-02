# Vision IO - AI Screen Analysis

Capture any part of your screen, extract text with OCR, and get instant AI analysis using Groq AI. Perfect for solving problems, translating text, or explaining complex concepts from images.

## Features

- 📸 Screen capture with region selection
- 🖼️ Upload images or paste from clipboard
- 📝 OCR text extraction using Tesseract.js
- 🤖 AI-powered analysis using Groq's Llama 3.3 70B model
- ⚡ Fast and accurate responses

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set the `VITE_GROQ_API_KEY` in [.env.local](.env.local) to your Groq API key

3. Run the app:
   ```bash
   npm run dev
   ```

## Build for Production

```bash
npm run build
```
