// Comprehensive error checking script
const fs = require('fs');
const path = require('path');

const issues = [];

// Find all TSX files
function findTsxFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules' && file !== 'dist') {
      findTsxFiles(filePath, fileList);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

// Check for potential array errors
function checkArrayErrors(content, filePath) {
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Check for .map() without array validation
    if (line.includes('.map(') && !line.includes('Array.isArray')) {
      const match = line.match(/(\w+)\.map\(/);
      if (match) {
        const varName = match[1];
        // Check if there's array validation nearby
        const contextStart = Math.max(0, index - 5);
        const contextEnd = Math.min(lines.length, index + 2);
        const context = lines.slice(contextStart, contextEnd).join('\n');
        
        if (!context.includes(`Array.isArray(${varName})`) && 
            !context.includes(`${varName} = []`) &&
            !line.includes('prev.map') && // State updates are usually safe
            !line.includes('[].map') && // Empty array literals are safe
            !line.includes('Array.from')) {
          issues.push({
            file: filePath,
            line: index + 1,
            type: 'POTENTIAL_MAP_ERROR',
            message: `Potential .map() error on '${varName}' - no array validation found`,
            code: line.trim()
          });
        }
      }
    }
    
    // Check for .filter() without array validation
    if (line.includes('.filter(') && !line.includes('Array.isArray')) {
      const match = line.match(/(\w+)\.filter\(/);
      if (match) {
        const varName = match[1];
        const contextStart = Math.max(0, index - 5);
        const contextEnd = Math.min(lines.length, index + 2);
        const context = lines.slice(contextStart, contextEnd).join('\n');
        
        if (!context.includes(`Array.isArray(${varName})`) && 
            !context.includes(`${varName} = []`) &&
            !line.includes('prev.filter') &&
            !line.includes('[].filter')) {
          issues.push({
            file: filePath,
            line: index + 1,
            type: 'POTENTIAL_FILTER_ERROR',
            message: `Potential .filter() error on '${varName}' - no array validation found`,
            code: line.trim()
          });
        }
      }
    }
    
    // Check for optional chaining issues
    if (line.includes('?.') && line.includes('.map(')) {
      issues.push({
        file: filePath,
        line: index + 1,
        type: 'OPTIONAL_CHAINING_WITH_MAP',
        message: 'Optional chaining with .map() - ensure fallback to empty array',
        code: line.trim()
      });
    }
  });
}

// Main execution
console.log('🔍 Scanning for potential runtime errors...\n');

const srcFiles = findTsxFiles('./src');
srcFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  checkArrayErrors(content, file);
});

// Group issues by type
const grouped = issues.reduce((acc, issue) => {
  if (!acc[issue.type]) acc[issue.type] = [];
  acc[issue.type].push(issue);
  return acc;
}, {});

// Print results
console.log(`📊 Found ${issues.length} potential issues:\n`);

Object.entries(grouped).forEach(([type, items]) => {
  console.log(`\n${type} (${items.length} occurrences):`);
  console.log('─'.repeat(80));
  items.slice(0, 10).forEach(issue => {
    console.log(`  ${issue.file}:${issue.line}`);
    console.log(`  ${issue.message}`);
    console.log(`  Code: ${issue.code}`);
    console.log('');
  });
  if (items.length > 10) {
    console.log(`  ... and ${items.length - 10} more\n`);
  }
});

console.log('\n✅ Scan complete!');
console.log(`\n📝 Summary: ${issues.length} potential issues found`);

process.exit(issues.length > 0 ? 1 : 0);
