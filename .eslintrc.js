/**
 * ESLint configuration for BoomPay Shopify Integration
 * Following Semantic Seed Coding Standards V2.0
 */

module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: [
    'eslint:recommended',
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },
  rules: {
    // Enforce consistent indentation (4 spaces as per Semantic Seed standards)
    'indent': ['error', 2],
    
    // Enforce line length (80 chars as per Semantic Seed standards)
    'max-len': ['error', { 'code': 80, 'ignoreComments': true, 'ignoreUrls': true }],
    
    // Enforce consistent use of semicolons
    'semi': ['error', 'always'],
    
    // Enforce consistent spacing
    'space-before-function-paren': ['error', {
      'anonymous': 'always',
      'named': 'never',
      'asyncArrow': 'always'
    }],
    
    // Enforce consistent quotes
    'quotes': ['error', 'single', { 'avoidEscape': true }],
    
    // Enforce consistent comma usage
    'comma-dangle': ['error', 'always-multiline'],
    
    // Enforce consistent spacing in object literals
    'object-curly-spacing': ['error', 'always'],
    
    // No console statements in production
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    
    // Enforce consistent naming conventions
    'camelcase': ['error', { 'properties': 'always' }],
    
    // Enforce consistent arrow function body style
    'arrow-body-style': ['error', 'as-needed'],
    
    // Enforce consistent function declarations
    'func-style': ['error', 'declaration', { 'allowArrowFunctions': true }],
    
    // Enforce consistent brace style
    'brace-style': ['error', '1tbs', { 'allowSingleLine': true }],
    
    // Enforce consistent spacing before blocks
    'space-before-blocks': ['error', 'always'],
    
    // Enforce consistent spacing in comments
    'spaced-comment': ['error', 'always'],
    
    // Enforce consistent spacing around infix operators
    'space-infix-ops': 'error',
    
    // Enforce consistent spacing around keywords
    'keyword-spacing': ['error', { 'before': true, 'after': true }],
    
    // Enforce consistent spacing inside array brackets
    'array-bracket-spacing': ['error', 'never'],
    
    // Enforce consistent spacing before and after commas
    'comma-spacing': ['error', { 'before': false, 'after': true }],
    
    // Enforce consistent spacing around colons of object literals
    'key-spacing': ['error', { 'beforeColon': false, 'afterColon': true }],
    
    // Enforce consistent linebreak style
    'linebreak-style': ['error', 'unix'],
    
    // Enforce consistent spacing between function identifiers and their invocations
    'func-call-spacing': ['error', 'never'],
    
    // Disallow multiple empty lines
    'no-multiple-empty-lines': ['error', { 'max': 1, 'maxEOF': 1 }],
    
    // Disallow trailing spaces at the end of lines
    'no-trailing-spaces': 'error',
    
    // Enforce consistent spacing inside parentheses
    'space-in-parens': ['error', 'never'],
    
    // Require or disallow padding lines between statements
    'padding-line-between-statements': [
      'error',
      { 'blankLine': 'always', 'prev': '*', 'next': 'return' },
      { 'blankLine': 'always', 'prev': ['const', 'let', 'var'], 'next': '*' },
      { 'blankLine': 'any', 'prev': ['const', 'let', 'var'], 'next': ['const', 'let', 'var'] },
      { 'blankLine': 'always', 'prev': 'directive', 'next': '*' },
      { 'blankLine': 'any', 'prev': 'directive', 'next': 'directive' },
      { 'blankLine': 'always', 'prev': '*', 'next': 'function' },
    ],
  },
};
