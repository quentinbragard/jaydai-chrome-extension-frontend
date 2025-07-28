// scripts/check-build.js
// Script to verify that the built extension doesn't contain remote CDN references

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BANNED_URLS = [
  'cdn.amplitude.com',
  'sr-client-cfg.amplitude.com',
  'https://cdn.amplitude.com',
  'https://sr-client-cfg.amplitude.com'
];

const BANNED_PATTERNS = [
  /https:\/\/cdn\.amplitude\.com/g,
  /https:\/\/sr-client-cfg\.amplitude\.com/g,
  /cdn\.amplitude\.com/g,
  /sr-client-cfg\.amplitude\.com/g
];

function checkFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const violations = [];
    
    // Check for banned URLs
    BANNED_URLS.forEach(url => {
      if (content.includes(url)) {
        violations.push(`Found banned URL: ${url}`);
      }
    });
    
    // Check for banned patterns
    BANNED_PATTERNS.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        violations.push(`Found banned pattern ${index + 1}: ${matches.join(', ')}`);
      }
    });
    
    return violations;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return [`Error reading file: ${error.message}`];
  }
}

function checkDirectory(dirPath) {
  const allViolations = [];
  
  function walkDir(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.html') || item.endsWith('.css'))) {
        const violations = checkFile(fullPath);
        if (violations.length > 0) {
          allViolations.push({
            file: fullPath,
            violations: violations
          });
        }
      }
    });
  }
  
  walkDir(dirPath);
  return allViolations;
}

function main() {
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Dist directory not found. Please run build first.');
    process.exit(1);
  }
  
  console.log('🔍 Checking built extension for Chrome Web Store compliance...');
  console.log(`📁 Scanning: ${distPath}`);
  
  const violations = checkDirectory(distPath);
  
  if (violations.length === 0) {
    console.log('✅ Build is clean! No banned CDN references found.');
    console.log('🎉 Extension should pass Chrome Web Store review.');
    process.exit(0);
  } else {
    console.log('❌ Found violations:');
    violations.forEach(({ file, violations: fileViolations }) => {
      console.log(`\n📄 File: ${file}`);
      fileViolations.forEach(violation => {
        console.log(`   ⚠️  ${violation}`);
      });
    });
    
    console.log('\n💡 To fix:');
    console.log('1. Update vite.config.ts replace plugin with more comprehensive patterns');
    console.log('2. Configure Amplitude to disable visual tagging');
    console.log('3. Consider removing Amplitude entirely if issues persist');
    console.log('4. Re-run build and check again');
    
    process.exit(1);
  }
}

// Run the main function if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { checkFile, checkDirectory };