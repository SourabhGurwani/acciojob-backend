// src/services/aiService.js
import axios from 'axios';

class AIService {
  constructor() {
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000', // Required by OpenRouter
        'X-Title': 'AccioJob Component Generator'
      }
    });
  }

  async generateComponent(prompt, existingCode = null) {
    try {
      const messages = [
        {
          role: "system",
          content: `You're a React component generator. Create clean, production-ready components in this JSON format:
          {
            "componentName": "PascalCaseName",
            "jsx": "component code",
            "css": "css code",
            "explanation": "brief description"
          }`
        },
        {
          role: "user",
          content: existingCode 
            ? `Refine this component: ${prompt}\n\nCurrent JSX:\n${existingCode.jsx}\nCurrent CSS:\n${existingCode.css}`
            : `Create new component: ${prompt}`
        }
      ];

      const response = await this.client.post('/chat/completions', {
        model: "meta-llama/llama-3-70b-instruct", // Default model
        messages,
        response_format: { type: "json_object" }
      });

      return JSON.parse(response.data.choices[0].message.content);
      
    } catch (error) {
      console.error('AI Service Error:', error.response?.data || error.message);
      throw new Error('Failed to generate component');
    }
  }
}

export default new AIService();