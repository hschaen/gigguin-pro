export interface ParsedDJData {
  djName: string;
  fullName: string;
  phone: string;
  email: string;
  instagram: string;
  confidence: {
    djName: number;
    fullName: number;
    phone: number;
    email: number;
    instagram: number;
  };
  raw: string;
}

export interface ParseResult {
  success: boolean;
  data: Partial<ParsedDJData>;
  errors: string[];
  warnings: string[];
  lines?: string[]; // Raw lines for manual assignment
  requiresManualAssignment?: boolean;
}

// Regex patterns for field detection
const patterns = {
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /(\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4}|\d{10})/g,
  instagram: /@[\w.]+/g,
  numberedList: /^\s*(\d+)\.?\s*(.+)$/gm,
  djPattern: /\b(DJ|dj)\s+[\w\s]+/g,
  allCaps: /\b[A-Z]{2,}(?:\s+[A-Z]{2,})*\b/g,
  // Enhanced list patterns
  listItem: /^[\s]*([•\-\*\+][\s]+|[\d]+[\).\-\s]+|[a-zA-Z][\).\-\s]+)(.+)$/,
  numberedItem: /^[\s]*(\d+)[\).\-\s]+(.+)$/,
  bulletItem: /^[\s]*[•\-\*\+][\s]+(.+)$/,
  letterItem: /^[\s]*[a-zA-Z][\).\-\s]+(.+)$/
};

// Common DJ name indicators
const djIndicators = ['DJ', 'dj', 'Dj'];

/**
 * Clean and normalize text input
 */
function cleanText(text: string): string {
  return text
    .replace(/[\r\n]+/g, '\n') // Normalize line breaks
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();
}

/**
 * Extract phone number and format it properly
 */
export function extractPhone(text: string): { value: string; confidence: number } {
  // Try multiple patterns to catch phone numbers
  const phonePatterns = [
    /(\(?\d{3}\)?[-.\s]*\d{3}[-.\s]*\d{4})/g,  // Standard format
    /(\d{3}[-.\s]*\d{3}[-.\s]*\d{4})/g,        // Without parentheses
    /(\d{10})/g,                                // Just digits
    /(\d{3}[-.\s]+\d{7})/g                     // Alternative format like 760-5951290
  ];
  
  let bestMatch = '';
  let confidence = 0;
  
  for (const pattern of phonePatterns) {
    const matches = text.match(pattern);
    if (matches && matches[0]) {
      bestMatch = matches[0];
      break;
    }
  }
  
  if (!bestMatch) return { value: '', confidence: 0 };
  
  // Clean phone number - remove all formatting
  const cleaned = bestMatch.replace(/[^\d]/g, '');
  
  // Format the phone number properly
  let formatted = '';
  if (cleaned.length === 10) {
    // Format as XXX-XXX-XXXX
    formatted = `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    confidence = 0.9;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    // Remove country code and format
    const withoutCountry = cleaned.slice(1);
    formatted = `${withoutCountry.slice(0, 3)}-${withoutCountry.slice(3, 6)}-${withoutCountry.slice(6)}`;
    confidence = 0.8;
  } else if (cleaned.length >= 7) {
    // Just return cleaned version if it's at least 7 digits
    formatted = cleaned;
    confidence = 0.6;
  } else {
    return { value: bestMatch, confidence: 0.3 };
  }
  
  return { value: formatted, confidence };
}

/**
 * Extract email address
 */
function extractEmail(text: string): { value: string; confidence: number } {
  const matches = text.match(patterns.email);
  if (!matches) return { value: '', confidence: 0 };
  
  return { value: matches[0], confidence: 0.95 };
}

/**
 * Extract Instagram handle
 */
function extractInstagram(text: string): { value: string; confidence: number } {
  const matches = text.match(patterns.instagram);
  if (!matches) return { value: '', confidence: 0 };
  
  let handle = matches[0];
  // Clean up common typos
  handle = handle.replace(/\\$/, ''); // Remove trailing backslash
  
  return { value: handle, confidence: 0.9 };
}

/**
 * Detect if a line contains a DJ name vs full name
 */
function analyzeName(line: string): { isDJName: boolean; confidence: number } {
  const cleanLine = line.trim();
  
  // Check for DJ indicators
  if (djIndicators.some(indicator => cleanLine.includes(indicator))) {
    return { isDJName: true, confidence: 0.9 };
  }
  
  // Check for all caps (common for DJ names)
  if (patterns.allCaps.test(cleanLine) && cleanLine.length > 2) {
    return { isDJName: true, confidence: 0.7 };
  }
  
  // Check for single word (more likely DJ name)
  if (!cleanLine.includes(' ')) {
    return { isDJName: true, confidence: 0.6 };
  }
  
  // Multiple words, probably full name
  return { isDJName: false, confidence: 0.8 };
}

/**
 * Parse numbered list format with enhanced list detection
 * Standard order: 1. Full Name, 2. DJ Name, 3. Email, 4. Phone, 5. Instagram
 */
function parseNumberedList(text: string): Partial<ParsedDJData> {
  let matches = Array.from(text.matchAll(patterns.numberedList));
  
  // If no matches found on separate lines, try to extract from single line
  if (matches.length === 0) {
    // Try to split on numbered patterns in a single line
    const singleLinePattern = /(\d+)\.\s*([^0-9]+?)(?=\s*\d+\.\s*|$)/g;
    matches = Array.from(text.matchAll(singleLinePattern));
  }
  
  const result: Partial<ParsedDJData> = {
    confidence: { djName: 0, fullName: 0, phone: 0, email: 0, instagram: 0 }
  };
  
  for (const match of matches) {
    const number = parseInt(match[1]);
    let content = match[2].trim();
    
    // Remove parenthetical labels like "(DJ Full Name)"
    content = content.replace(/\s*\([^)]*\)\s*$/, '').trim();
    
    // Clean up any trailing numbers or punctuation from next item
    content = content.replace(/\s+\d+\.\s*.*$/, '').trim();
    
    switch (number) {
      case 1:
        // First item is always Full Name
        result.fullName = content;
        result.confidence!.fullName = 0.9;
        break;
      case 2:
        // Second item is always DJ Name
        result.djName = content;
        result.confidence!.djName = 0.9;
        break;
      case 3:
        // Third item could be email or phone - check patterns
        const email3 = extractEmail(content);
        const phone3 = extractPhone(content);
        const instagram3 = extractInstagram(content);
        
        if (email3.value) {
          result.email = email3.value;
          result.confidence!.email = email3.confidence;
        } else if (phone3.value) {
          result.phone = phone3.value;
          result.confidence!.phone = phone3.confidence;
        } else if (instagram3.value) {
          result.instagram = instagram3.value;
          result.confidence!.instagram = instagram3.confidence;
        } else {
          // Assume it's email if no pattern matches
          result.email = content;
          result.confidence!.email = 0.5;
        }
        break;
      case 4:
        // Fourth item could be phone or instagram
        const email4 = extractEmail(content);
        const phone4 = extractPhone(content);
        const instagram4 = extractInstagram(content);
        
        if (phone4.value) {
          result.phone = phone4.value;
          result.confidence!.phone = phone4.confidence;
        } else if (email4.value && !result.email) {
          result.email = email4.value;
          result.confidence!.email = email4.confidence;
        } else if (instagram4.value) {
          result.instagram = instagram4.value;
          result.confidence!.instagram = instagram4.confidence;
        } else {
          // Assume it's phone if no pattern matches
          result.phone = content;
          result.confidence!.phone = 0.5;
        }
        break;
      case 5:
        // Fifth item is usually Instagram
        const instagram5 = extractInstagram(content);
        if (instagram5.value) {
          result.instagram = instagram5.value;
          result.confidence!.instagram = instagram5.confidence;
        } else {
          // Clean Instagram handle if it doesn't start with @
          const handle = content.startsWith('@') ? content : `@${content}`;
          result.instagram = handle;
          result.confidence!.instagram = 0.7;
        }
        break;
    }
  }
  
  return result;
}

/**
 * Parse structured format with known order
 * Order: Full Name, DJ Name, Phone, Email, Instagram
 */
function parseStructuredFormat(lines: string[]): Partial<ParsedDJData> {
  const result: Partial<ParsedDJData> = {
    confidence: { djName: 0, fullName: 0, phone: 0, email: 0, instagram: 0 }
  };
  
  // Standard order: Full Name, DJ Name, Phone, Email, Instagram
  // Just follow the order as specified, using extraction functions for validation/formatting
  
  if (lines.length >= 1 && lines[0]) {
    result.fullName = lines[0];
    result.confidence!.fullName = 0.9;
  }
  
  if (lines.length >= 2 && lines[1]) {
    result.djName = lines[1];
    result.confidence!.djName = 0.9;
  }
  
  if (lines.length >= 3 && lines[2]) {
    // Third line should be phone, but use extraction for formatting
    const phone = extractPhone(lines[2]);
    if (phone.value) {
      result.phone = phone.value;
      result.confidence!.phone = phone.confidence;
    } else {
      // Still store the raw value even if extraction failed
      result.phone = lines[2];
      result.confidence!.phone = 0.5;
    }
  }
  
  if (lines.length >= 4 && lines[3]) {
    // Fourth line should be email
    const email = extractEmail(lines[3]);
    if (email.value) {
      result.email = email.value;
      result.confidence!.email = email.confidence;
    } else {
      result.email = lines[3];
      result.confidence!.email = 0.5;
    }
  }
  
  if (lines.length >= 5 && lines[4]) {
    // Fifth line should be Instagram
    const instagram = extractInstagram(lines[4]);
    if (instagram.value) {
      result.instagram = instagram.value;
      result.confidence!.instagram = instagram.confidence;
    } else {
      // Clean Instagram handle if it doesn't start with @
      const handle = lines[4].startsWith('@') ? lines[4] : `@${lines[4]}`;
      result.instagram = handle;
      result.confidence!.instagram = 0.7;
    }
  }
  
  return result;
}

/**
 * Parse line-by-line format
 * Attempt to detect field types from each line
 */
function parseLineByLine(text: string): Partial<ParsedDJData> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const result: Partial<ParsedDJData> = {
    confidence: { djName: 0, fullName: 0, phone: 0, email: 0, instagram: 0 }
  };
  
  let nameLines: string[] = [];
  
  for (const line of lines) {
    // Check for email
    const email = extractEmail(line);
    if (email.value && !result.email) {
      result.email = email.value;
      result.confidence!.email = email.confidence;
      continue;
    }
    
    // Check for phone
    const phone = extractPhone(line);
    if (phone.value && !result.phone) {
      result.phone = phone.value;
      result.confidence!.phone = phone.confidence;
      continue;
    }
    
    // Check for Instagram
    const instagram = extractInstagram(line);
    if (instagram.value && !result.instagram) {
      result.instagram = instagram.value;
      result.confidence!.instagram = instagram.confidence;
      continue;
    }
    
    // If it's not email, phone, or Instagram, it's likely a name
    if (!email.value && !phone.value && !instagram.value) {
      nameLines.push(line);
    }
  }
  
  // Analyze name lines
  if (nameLines.length >= 2) {
    const firstNameAnalysis = analyzeName(nameLines[0]);
    const secondNameAnalysis = analyzeName(nameLines[1]);
    
    if (firstNameAnalysis.isDJName) {
      result.djName = nameLines[0];
      result.fullName = nameLines[1];
      result.confidence!.djName = firstNameAnalysis.confidence;
      result.confidence!.fullName = secondNameAnalysis.confidence;
    } else {
      result.fullName = nameLines[0];
      result.djName = nameLines[1];
      result.confidence!.fullName = firstNameAnalysis.confidence;
      result.confidence!.djName = secondNameAnalysis.confidence;
    }
  } else if (nameLines.length === 1) {
    const nameAnalysis = analyzeName(nameLines[0]);
    if (nameAnalysis.isDJName) {
      result.djName = nameLines[0];
      result.confidence!.djName = nameAnalysis.confidence;
    } else {
      result.fullName = nameLines[0];
      result.confidence!.fullName = nameAnalysis.confidence;
    }
  }
  
  return result;
}

/**
 * Parse mixed format with labels
 * Example: "Ricardo Haynes (DJ Full Name)"
 */
function parseLabeledFormat(text: string): Partial<ParsedDJData> {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  const result: Partial<ParsedDJData> = {
    confidence: { djName: 0, fullName: 0, phone: 0, email: 0, instagram: 0 }
  };
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Check for labeled content
    if (lowerLine.includes('(dj full name)') || lowerLine.includes('(full name)')) {
      result.fullName = line.replace(/\s*\([^)]*\)\s*$/, '').trim();
      result.confidence!.fullName = 0.95;
      continue;
    }
    
    if (lowerLine.includes('(dj name)') || lowerLine.includes('(dj)')) {
      result.djName = line.replace(/\s*\([^)]*\)\s*$/, '').trim();
      result.confidence!.djName = 0.95;
      continue;
    }
    
    if (lowerLine.includes('(phone)') || lowerLine.includes('(tel)')) {
      const phone = extractPhone(line);
      if (phone.value) {
        result.phone = phone.value;
        result.confidence!.phone = 0.95;
      }
      continue;
    }
    
    if (lowerLine.includes('(email)') || lowerLine.includes('(e-mail)')) {
      const email = extractEmail(line);
      if (email.value) {
        result.email = email.value;
        result.confidence!.email = 0.95;
      }
      continue;
    }
    
    if (lowerLine.includes('(instagram)') || lowerLine.includes('(insta)')) {
      const instagram = extractInstagram(line);
      if (instagram.value) {
        result.instagram = instagram.value;
        result.confidence!.instagram = 0.95;
      }
      continue;
    }
    
    // Fallback to pattern detection for unlabeled lines
    const email = extractEmail(line);
    if (email.value && !result.email) {
      result.email = email.value;
      result.confidence!.email = email.confidence;
      continue;
    }
    
    const phone = extractPhone(line);
    if (phone.value && !result.phone) {
      result.phone = phone.value;
      result.confidence!.phone = phone.confidence;
      continue;
    }
    
    const instagram = extractInstagram(line);
    if (instagram.value && !result.instagram) {
      result.instagram = instagram.value;
      result.confidence!.instagram = instagram.confidence;
      continue;
    }
  }
  
  return result;
}

/**
 * Extract clean lines from text, removing various list formatting
 */
function extractCleanLines(text: string): string[] {
  // First split by newlines and clean up
  let lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  // If it's all on one line with numbered patterns, try to split it
  if (lines.length === 1 && lines[0].includes('1.') && lines[0].includes('2.')) {
    // Split on numbered patterns like "1. content 2. content"
    const numberedSplit = lines[0].split(/\s*\d+\.\s*/);
    if (numberedSplit.length > 1) {
      // Remove the first empty element and filter out empty strings
      lines = numberedSplit.slice(1).filter(line => line.trim());
    }
  }
  
  // Clean each line by removing various list formatting patterns
  return lines.map(line => {
    let cleaned = line.trim();
    
    // Remove numbered list patterns: "1.", "1)", "1 -", etc. 
    // But be more specific to avoid matching phone numbers
    // Only match 1-2 digits followed by specific list punctuation
    cleaned = cleaned.replace(/^[\s]*\d{1,2}[\.\)]\s+/, ''); // "1. " or "12) "
    cleaned = cleaned.replace(/^[\s]*\d{1,2}\s*-\s+/, '');   // "1 - " or "12 - " (with space after dash)
    
    // Remove bullet points: "•", "-", "*", "+", "- ", "• ", etc.
    cleaned = cleaned.replace(/^[\s]*[•\-\*\+][\s]+/, '');
    
    // Remove letter list patterns: "a.", "A)", "a-", etc.
    cleaned = cleaned.replace(/^[\s]*[a-zA-Z][\.\)\-\s]+/, '');
    
    // Remove any remaining leading/trailing whitespace
    return cleaned.trim();
  }).filter(line => line.length > 0); // Filter out any empty lines
}

/**
 * Main parsing function
 */
export function parseDJText(text: string, useStructuredFormat: boolean = false): ParseResult {
  const cleanedText = cleanText(text);
  const errors: string[] = [];
  const warnings: string[] = [];
  
  if (!cleanedText) {
    return {
      success: false,
      data: {},
      errors: ['No text provided'],
      warnings: []
    };
  }
  
  // Extract clean lines for potential manual assignment
  const cleanLines = extractCleanLines(cleanedText);
  
  let result: Partial<ParsedDJData> = {
    raw: cleanedText,
    confidence: { djName: 0, fullName: 0, phone: 0, email: 0, instagram: 0 }
  };
  
  // If using structured format, use known order
  if (useStructuredFormat && cleanLines.length >= 2) {
    const structuredResult = parseStructuredFormat(cleanLines);
    
    // Check if structured parsing was successful enough
    const structuredScore = Object.values(structuredResult.confidence || {}).reduce((sum, conf) => sum + conf, 0);
    const structuredFieldsFound = [
      structuredResult.djName,
      structuredResult.fullName,
      structuredResult.email,
      structuredResult.phone,
      structuredResult.instagram
    ].filter(Boolean).length;
    
    // If structured parsing found enough fields with good confidence, use it
    if (structuredFieldsFound >= 3 && structuredScore >= 2.5) {
      return {
        success: true,
        data: { ...result, ...structuredResult },
        errors: [],
        warnings: [],
        lines: cleanLines
      };
    }
    
    // Otherwise, fall through to try other strategies and compare
    result = { ...result, ...structuredResult };
  }
  
  // Try different parsing strategies
  const strategies = [
    { name: 'numbered', parser: parseNumberedList },
    { name: 'labeled', parser: parseLabeledFormat },
    { name: 'lineByLine', parser: parseLineByLine }
  ];
  
  let bestResult = result;
  let bestScore = 0;
  
  for (const strategy of strategies) {
    const parsed = strategy.parser(cleanedText);
    
    // Calculate confidence score
    const score = Object.values(parsed.confidence || {}).reduce((sum, conf) => sum + conf, 0);
    
    if (score > bestScore) {
      bestScore = score;
      bestResult = { ...result, ...parsed };
    }
  }
  
  // Check if we need manual assignment
  const fieldsFound = [
    bestResult.djName,
    bestResult.fullName,
    bestResult.email,
    bestResult.phone,
    bestResult.instagram
  ].filter(Boolean).length;
  
  const requiresManualAssignment = fieldsFound < 2 || bestScore < 2;
  
  // Validation and warnings
  if (!bestResult.djName && !bestResult.fullName) {
    errors.push('Could not identify any names in the text');
  }
  
  if (bestResult.email && !patterns.email.test(bestResult.email)) {
    warnings.push('Email format may be invalid');
  }
  
  if (bestResult.phone && bestResult.phone.replace(/[^\d]/g, '').length < 10) {
    warnings.push('Phone number may be incomplete');
  }
  
  // Fill in missing DJ name if we have full name
  if (!bestResult.djName && bestResult.fullName) {
    const nameAnalysis = analyzeName(bestResult.fullName);
    if (nameAnalysis.isDJName) {
      bestResult.djName = bestResult.fullName;
      bestResult.fullName = '';
      bestResult.confidence!.djName = nameAnalysis.confidence;
      bestResult.confidence!.fullName = 0;
    }
  }
  
  return {
    success: errors.length === 0,
    data: bestResult,
    errors,
    warnings,
    lines: cleanLines,
    requiresManualAssignment
  };
}

/**
 * Test the parser with example inputs
 */
export function testParser() {
  const testCases = [
    // Numbered format
    `1. Sophia ward (DJ Full Name)
2. FIA (DJ Name)
3. 512-712-2689 (phone)
4. djfiasounds@gmail.com (email)
5. @sophiaawardd (instagram)`,
    
    // User's specific format (multiline)
    `1. Kevin VanderWal
2. K3VO
3. 619k3vo@gmail.com
4. 760-5951290
5. @sd.k3vo`,
    
    // User's format if it gets concatenated into one line
    `1. Kevin VanderWal 2. K3VO 3. 619k3vo@gmail.com 4. 760-5951290 5. @sd.k3vo`,
    
    // Simple format
    `SAUL
Jonathan Weinstein
(858) 692-1601
anotefromsaul@gmail.com
@anotefromsaul`,
    
    // Labeled format
    `Ricardo Haynes (DJ Full Name)
DJ SUNŚET (DJ Name)
8054537433 (phone)
Ricardohaynesmgmt@gmail.com (email)
Djsunset.fv (instagram)`
  ];
  
  return testCases.map((text, index) => ({
    case: index + 1,
    input: text,
    result: parseDJText(text, true) // Use structured format for testing
  }));
}

// Test function specifically for user's format
export function testUserFormat() {
  const userText = `1. Kevin VanderWal
2. K3VO
3. 619k3vo@gmail.com
4. 760-5951290
5. @sd.k3vo`;
  
  console.log('Testing user format with structured parsing:');
  const result = parseDJText(userText, true);
  console.log('Result:', result);
  console.log('Clean lines:', result.lines);
  return result;
}

// Test phone extraction specifically
export function testPhoneExtraction() {
  const phoneTests = [
    '760-5951290',
    '(760) 595-1290',
    '760.595.1290',
    '7605951290',
    '760 595 1290',
    '1-760-595-1290'
  ];
  
  console.log('Testing phone extraction:');
  phoneTests.forEach(phone => {
    const result = extractPhone(phone);
    console.log(`Input: "${phone}" -> Output: "${result.value}" (${Math.round(result.confidence * 100)}%)`);
  });
}