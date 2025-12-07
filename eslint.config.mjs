import eslintJs from '@eslint/js';
import jest from 'eslint-plugin-jest';
import typescriptParser from '@typescript-eslint/parser';
import globals from 'globals';

// Extract configs and globals from CommonJS modules
const { configs } = eslintJs;
const jestConfigs = jest.configs;
const { browser, jest: _jest, node } = globals;

// Shared stylistic rules for all JS/TS files
const sharedStylisticRules = {
  'no-console': 'warn',
  'no-debugger': 'off',
  'no-unused-vars': 'off',
  'eqeqeq': [ 'error', 'allow-null' ],
  'prefer-template': 'error',
  'no-param-reassign': 'off',
  'prefer-object-spread': 'error',
  'require-yield': 'error',
  'no-extra-boolean-cast': 'off',
  'import/no-anonymous-default-export': 'off',
  'no-prototype-builtins': 'off',
  'no-new-func': 'off',
  'no-template-curly-in-string': 'off'
};

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/build/**',
      '**/dist/**',
      '**/.DS_Store',
      '**/config/**',
      '**/*.tsbuildinfo',
      'packages/teselly-sales-channels/src/shopify/types'
    ]
  },
  configs.recommended,
  // React rules - only for JSX/TSX files, excluding test files
  {
    plugins: {
      jest: jest
    },
    files: [ 
      '**/*.test.{ts,tsx,js,jsx,mts,cts,mjs,cjs}', 
      '**/*.spec.{ts,tsx,js,jsx,mts,cts,mjs,cjs}', 
      '**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}' 
    ],
    ignores: [ '**/*.test.{jsx,tsx}', '**/*.spec.{jsx,tsx}', '**/__tests__/**' ],
    languageOptions: {
      ecmaVersion: 2020,
      parser: typescriptParser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...browser,
        React: true,
        JSX: true,
        HTMLElementEventMap: true,
        AddEventListenerOptions: true,
        DocumentEventMap: true
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      ...jestConfigs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      'no-empty-pattern': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    }
  },
  // Jest rules - only for test files (all JS/TS variants)
  {
    plugins: {
      jest: jest
    },
    files: [ 
      '**/*.test.{ts,tsx,js,jsx,mts,cts,mjs,cjs}', 
      '**/*.spec.{ts,tsx,js,jsx,mts,cts,mjs,cjs}', 
      '**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}' 
    ],
    languageOptions: {
      globals: {
        ..._jest
      }
    },
    rules: {
      ...jestConfigs.recommended.rules,
      'jest/no-conditional-expect': 'off'
    }
  },
  // Plain JavaScript files (no TypeScript parser)
  {
    plugins: {
    },
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...node,
        ...browser
      }
    },
    rules: sharedStylisticRules
  },
  // TypeScript files with TypeScript parser
  {
    plugins: {
    },
    files: ['**/*.{ts,tsx,cts,mts}'],
    languageOptions: {
      parser: typescriptParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...node,
        ...browser,
        NodeJS: 'readonly'
      }
    },
    rules: sharedStylisticRules
  },
  // Disable expensive stylistic rules for test files (all types)
  {
    files: [ 
      '**/*.test.{ts,tsx,js,jsx,mts,cts,mjs,cjs}', 
      '**/*.spec.{ts,tsx,js,jsx,mts,cts,mjs,cjs}', 
      '**/__tests__/**/*.{ts,tsx,js,jsx,mts,cts,mjs,cjs}' 
    ]
  }
];
