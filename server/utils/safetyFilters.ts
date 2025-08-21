/**
 * Safety filters and validation for user inputs
 * Prevents inappropriate content and database pollution
 */

// Content that should never be processed or saved
const INAPPROPRIATE_PATTERNS = [
  // Explicit content
  /\b(xxx|porn|adult|nsfw|sex|nude|naked)\b/i,
  
  // Violence
  /\b(kill|murder|violence|bomb|terrorist|weapon|gun)\b/i,
  
  // Illegal substances
  /\b(drug|weed|cocaine|heroin|meth|cannabis)\b/i,
  
  // Hate speech
  /\b(hate|racist|nazi|supremacist)\b/i,
  
  // Personal information patterns
  /\b\d{3}-?\d{2}-?\d{4}\b/, // SSN pattern
  /\b\d{16}\b/, // Credit card pattern
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email
  /\b\d{10,}\b/, // Phone numbers
];

// Suspicious patterns that might indicate attempts to exploit the system
const SUSPICIOUS_PATTERNS = [
  /\bscript\b.*\balert\b/i, // XSS attempts
  /\bselect\b.*\bfrom\b/i, // SQL injection
  /\bdrop\b.*\btable\b/i, // SQL injection
  /\b<.*>\b/, // HTML injection
  /\b\$\{.*\}\b/, // Template injection
  /\b\.\.\//, // Path traversal
];

/**
 * Check if input contains inappropriate content
 */
export function containsInappropriateContent(input: string): boolean {
  return INAPPROPRIATE_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Check if input contains suspicious patterns
 */
export function containsSuspiciousPatterns(input: string): boolean {
  return SUSPICIOUS_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Sanitize user input for safe processing
 */
export function sanitizeInput(input: string): string {
  // Remove any HTML/script tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove SQL-like patterns
  sanitized = sanitized.replace(/\b(drop|delete|truncate|alter|create)\s+(table|database)/gi, '');
  
  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  // Limit length
  if (sanitized.length > 500) {
    sanitized = sanitized.substring(0, 500);
  }
  
  return sanitized;
}

/**
 * Validate if input is appropriate for processing
 */
export function isValidUserInput(input: string): { valid: boolean; reason?: string } {
  if (!input || input.trim().length === 0) {
    return { valid: false, reason: 'Empty input' };
  }
  
  if (containsInappropriateContent(input)) {
    return { valid: false, reason: 'Inappropriate content detected' };
  }
  
  if (containsSuspiciousPatterns(input)) {
    return { valid: false, reason: 'Suspicious patterns detected' };
  }
  
  // Check for nonsensical input (only special characters, random letters, etc.)
  if (!/[a-zA-Z]{2,}/.test(input)) {
    return { valid: false, reason: 'Input must contain meaningful text' };
  }
  
  // Check for excessive repetition
  const words = input.toLowerCase().split(/\s+/);
  const uniqueWords = new Set(words);
  if (words.length > 5 && uniqueWords.size < words.length / 3) {
    return { valid: false, reason: 'Input contains excessive repetition' };
  }
  
  return { valid: true };
}

/**
 * Filter out inappropriate POIs from search results
 */
export function filterPOIs(pois: any[]): any[] {
  return pois.filter(poi => {
    // Filter out inappropriate venue types
    const inappropriateTypes = [
      'adult_entertainment',
      'liquor_store',
      'casino',
      'night_club'
    ];
    
    if (poi.types && poi.types.some((t: string) => inappropriateTypes.includes(t))) {
      return false;
    }
    
    // Filter out venues with inappropriate names
    if (poi.name && containsInappropriateContent(poi.name)) {
      return false;
    }
    
    return true;
  });
}

/**
 * Rate limit check (would be implemented with Redis in production)
 */
export function checkRateLimit(userId: string, action: string): boolean {
  // In production, this would check against a Redis store
  // For now, always allow
  return true;
}