'use strict';

/**
 * ESLint flat config (ESLint 9+).
 * Kept intentionally lean: this project has no build step and no bundler,
 * so rules focus on catching real bugs (undefined globals, unused
 * variables, accidental var leaks) rather than enforcing a style guide.
 */
module.exports = [
  {
    ignores: ['node_modules/**', 'css/**']
  },
  {
    files: ['js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        confirm: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        TextDecoder: 'readonly',
        Event: 'readonly',
        StadiaAI: 'writable'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { args: 'none' }],
      'no-undef': 'error',
      'no-var': 'warn',
      'prefer-const': 'warn',
      eqeqeq: ['warn', 'smart'],
      'no-console': 'off'
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
      globals: {
        require: 'readonly',
        module: 'readonly',
        global: 'writable',
        process: 'readonly',
        __dirname: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'warn'
    }
  }
];
