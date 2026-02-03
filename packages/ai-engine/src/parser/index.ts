import type { ParsedFile, ValidationResult } from '../types';

/**
 * Parse generated files from AI response
 * Extracts <file path="...">...</file> blocks
 */
export function parseGeneratedFiles(response: string): ParsedFile[] {
  const files: ParsedFile[] = [];
  
  // Match <file path="...">...</file> blocks
  const fileRegex = /<file path="([^"]+)">([\s\S]*?)<\/file>/g;
  
  let match;
  while ((match = fileRegex.exec(response)) !== null) {
    const [, path, content] = match;
    const language = getLanguageFromPath(path);
    
    files.push({
      path: path.trim(),
      content: content.trim(),
      language,
    });
  }
  
  return files;
}

/**
 * Get language identifier from file path
 */
export function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  
  switch (ext) {
    case 'tsx':
    case 'ts':
      return 'typescript';
    case 'jsx':
    case 'js':
      return 'javascript';
    case 'json':
      return 'json';
    case 'css':
      return 'css';
    case 'md':
      return 'markdown';
    case 'html':
      return 'html';
    default:
      return 'plaintext';
  }
}

/**
 * Validate React Native code for common issues
 */
export function validateReactNativeCode(code: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check for web elements (common mistake)
  const webElements = ['<div', '<span', '<button', '<input', '<a href'];
  for (const element of webElements) {
    if (code.includes(element)) {
      errors.push(`Using web element "${element}" instead of React Native component`);
    }
  }
  
  // Check for missing export
  if (!code.includes('export default') && !code.includes('export {')) {
    warnings.push('Missing export statement');
  }
  
  // Check for StyleSheet usage
  if (code.includes('style={{') && !code.includes('StyleSheet.create')) {
    warnings.push('Consider using StyleSheet.create for better performance');
  }
  
  // Check for required imports
  if (code.includes('StyleSheet') && !code.includes("from 'react-native'")) {
    errors.push('Missing React Native import for StyleSheet');
  }
  
  if (code.includes('useState') && !code.includes("from 'react'")) {
    errors.push('Missing React import for useState');
  }
  
  // Check for inline functions in JSX (performance issue)
  const inlineFunctionPattern = /onPress=\{(?!\s*\w+\s*\})[^}]+\}/g;
  if (inlineFunctionPattern.test(code)) {
    warnings.push('Consider extracting inline functions for better performance');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Extract message text without file blocks
 */
export function extractMessageText(response: string): string {
  // Remove file blocks
  const withoutFiles = response.replace(/<file path="[^"]+">[\s\S]*?<\/file>/g, '');
  
  // Clean up whitespace
  return withoutFiles.trim();
}
