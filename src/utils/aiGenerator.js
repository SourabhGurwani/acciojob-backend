import openRouter from '../config/openRouter.js';

// Component generation presets
const GENERATION_PRESETS = {
  REACT: {
    systemMessage: `You are an expert React/Next.js component generator. Follow these rules:
1. Generate clean, production-ready components
2. Use React 18+ best practices
3. Include TypeScript types
4. Use CSS Modules for styling
5. Make components accessible (a11y compliant)
6. Add JSDoc comments for props
7. Support responsive design
8. Include unit test boilerplate
9. For refinements, preserve existing functionality while making requested changes`,
    responseFormat: {
      componentName: "PascalCaseName",
      jsx: "component code",
      css: "css module code",
      tests: "test code",
      storybook: "Storybook story",
      explanation: "brief description"
    }
  },
  MUI: {
    systemMessage: `You are an expert Material-UI component generator. Follow these rules:
1. Use latest MUI (v5+) components
2. Follow MUI design guidelines
3. Include TypeScript types
4. Support theme customization
5. Make components accessible
6. Add prop comments
7. Include responsive behavior
8. Generate Storybook stories`,
    responseFormat: {
      componentName: "PascalCaseName",
      jsx: "component code using MUI",
      css: "CSS-in-JS styles",
      tests: "test code",
      storybook: "Storybook story",
      explanation: "brief description"
    }
  }
};

export const generateComponent = async (prompt, existingJsx = '', existingCss = '', preset = 'REACT') => {
  try {
    const isRefinement = existingJsx && existingCss;
    const config = GENERATION_PRESETS[preset] || GENERATION_PRESETS.REACT;

    // Prepare the AI messages
    const messages = [
      {
        role: "system",
        content: config.systemMessage + `\n\nResponse MUST be valid JSON matching this structure:\n${JSON.stringify(config.responseFormat, null, 2)}`
      },
      {
        role: "user",
        content: isRefinement 
          ? `Refine this component based on: "${prompt}"\n\nCurrent JSX:\n${existingJsx}\n\nCurrent CSS:\n${existingCss}`
          : `Create a new ${preset === 'MUI' ? 'Material-UI' : 'React'} component based on: "${prompt}"`
      }
    ];

    // Call OpenRouter API
    const response = await openRouter.post('', {
      model: "meta-llama/llama-3-70b-instruct",
      messages,
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 3000
    });

    // Parse and validate the response
    const result = parseAIResponse(response.data.choices[0].message.content);
    
    return {
      jsxCode: result.jsx,
      cssCode: result.css,
      testCode: result.tests,
      storybookCode: result.storybook,
      aiResponse: result.explanation || `Successfully ${isRefinement ? 'refined' : 'created'} ${result.componentName} component`,
      componentName: result.componentName || 'MyComponent',
      metadata: {
        preset,
        isRefinement,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    console.error('AI generation failed:', error);
    return handleGenerationError(error, prompt, existingJsx, existingCss);
  }
};

// Helper functions
const parseAIResponse = (content) => {
  try {
    const result = JSON.parse(content);
    
    // Validate required fields
    if (!result.jsx || !result.css) {
      throw new Error('AI response missing required code sections');
    }

    // Set defaults for optional fields
    return {
      componentName: result.componentName || 'MyComponent',
      jsx: result.jsx,
      css: result.css,
      tests: result.tests || '// Test file would be generated here',
      storybook: result.storybook || '// Storybook story would be generated here',
      explanation: result.explanation || 'Component generated successfully'
    };
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    throw new Error('Invalid response format from AI');
  }
};

const handleGenerationError = (error, prompt, existingJsx, existingCss) => {
  // Production fallback
  if (process.env.NODE_ENV === 'production') {
    throw new Error(`Component generation failed: ${error.message}`);
  }

  // Development mock fallback
  console.warn('Using mock generator as fallback');
  return mockGenerateComponent(prompt, existingJsx, existingCss);
};

// Enhanced mock generator
const mockGenerateComponent = (prompt, existingJsx = '', existingCss = '') => {
  const isRefinement = existingJsx && existingCss;
  const componentName = extractComponentName(prompt);
  const now = new Date().toISOString();

  const baseComponent = `import React from 'react';
import styles from './${componentName}.module.css';

interface ${componentName}Props {
  /**
   * Component children
   */
  children?: React.ReactNode;
  
  /**
   * Visual variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary';
  
  /**
   * Click handler
   */
  onClick?: () => void;
}

/**
 * ${componentName} component
 * @generated ${now}
 */
const ${componentName} = ({ 
  children, 
  variant = 'primary',
  onClick 
}: ${componentName}Props) => {
  return (
    <div className={styles.container} data-testid="${componentName.toLowerCase()}">
      <button 
        className={\`\${styles.button} \${styles[variant]}\`}
        onClick={onClick}
        aria-label={\`\${componentName} button\`}
      >
        {children || 'Click Me'}
      </button>
    </div>
  );
};

export default ${componentName};`;

  const baseStyles = `.container {
  padding: 1rem;
  display: flex;
  justify-content: center;
}

.button {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.primary {
  background-color: #3b82f6;
  color: white;
}

.secondary {
  background-color: #e2e8f0;
  color: #1e293b;
}

@media (max-width: 768px) {
  .button {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
}`;

  const testBoilerplate = `import React from 'react';
import { render, screen } from '@testing-library/react';
import ${componentName} from './${componentName}';

describe('${componentName}', () => {
  it('renders correctly', () => {
    render(<${componentName} />);
    expect(screen.getByTestId('${componentName.toLowerCase()}')).toBeInTheDocument();
  });
});`;

  const storybookBoilerplate = `import React from 'react';
import ${componentName} from './${componentName}';

export default {
  title: 'Components/${componentName}',
  component: ${componentName},
};

const Template = (args) => <${componentName} {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  variant: 'primary',
  children: 'Primary Button'
};

export const Secondary = Template.bind({});
Secondary.args = {
  variant: 'secondary',
  children: 'Secondary Button'
};`;

  return {
    jsxCode: isRefinement ? `${existingJsx}\n\n/* Modified: ${prompt} */` : baseComponent,
    cssCode: isRefinement ? `${existingCss}\n\n/* Modified: ${prompt} */` : baseStyles,
    testCode: testBoilerplate,
    storybookCode: storybookBoilerplate,
    aiResponse: isRefinement 
      ? `Mock refinement based on: ${prompt}`
      : `Mock ${componentName} component with TypeScript, tests and Storybook`,
    componentName,
    metadata: {
      isMock: true,
      timestamp: now
    }
  };
};

const extractComponentName = (prompt) => {
  const nameMatch = prompt.match(/(?:create|generate|make)\s+(?:a|an)\s+([^\s]+)/i) || 
                   prompt.match(/component\s+named?\s+([^\s]+)/i);
  return nameMatch 
    ? nameMatch[1].replace(/[^a-zA-Z0-9]/g, '').replace(/^[a-z]/, c => c.toUpperCase())
    : 'MyComponent';
};