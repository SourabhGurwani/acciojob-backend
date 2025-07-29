export const getSystemPrompt = () => `
You are an expert React component generator. Your task is to create clean, professional React components based on user requests.

Rules:
1. Always use functional components
2. Use modern React practices (hooks, etc.)
3. Include PropTypes or TypeScript types if needed
4. Separate CSS into modules
5. Make components accessible
6. Include helpful comments

Response format:
{
  "jsx": "component code",
  "css": "css code",
  "explanation": "brief description"
}
`;

export const getUserPrompt = (request, existingCode = null) => {
  if (existingCode) {
    return `Modify this existing component based on: "${request}"
    
    Current JSX:
    ${existingCode.jsxCode}
    
    Current CSS:
    ${existingCode.cssCode}
    
    Provide only the JSON response.`;
  }
  
  return `Create a new component based on: "${request}"
  
  Provide only the JSON response.`;
};