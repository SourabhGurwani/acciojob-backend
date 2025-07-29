import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

const openRouter = axios.create({
  baseURL: OPENROUTER_API_URL,
  headers: {
    "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
    "HTTP-Referer": "YOUR_SITE_URL", // Required for OpenRouter
    "X-Title": "AccioJob Component Generator" // Optional
  }
});

export default openRouter;