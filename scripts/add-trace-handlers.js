#!/usr/bin/env node

/**
 * Script to add TRACE method handlers to all API routes
 * This ensures all API endpoints return 405 for TRACE requests instead of 500
 */

const fs = require('fs');
const path = require('path');

const API_DIR = path.join(__dirname, '..', 'src', 'app', 'api');

function getAllRouteFiles(dir) {
  const files = [];

  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);

    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        traverse(fullPath);
      } else if (item === 'route.ts') {
        files.push(fullPath);
      }
    }
  }

  traverse(dir);
  return files;
}

function addTraceHandler(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Skip if already has TRACE import
  if (content.includes('import { TRACE }') || content.includes('export { TRACE }')) {
    console.log(`Skipping ${filePath} - already has TRACE handler`);
    return;
  }

  // Add import for TRACE
  const importRegex = /^(import.*?['"]@\/lib\/.*?['"])$/gm;
  const lastImportMatch = [...content.matchAll(importRegex)].pop();

  if (lastImportMatch) {
    const importPosition = lastImportMatch.index + lastImportMatch[0].length;
    content = content.slice(0, importPosition) +
              "\nimport { TRACE } from '@/lib/httpMethodSecurity'" +
              content.slice(importPosition);
  } else {
    // Add at the beginning if no @/lib imports found
    const firstImportMatch = content.match(/^import.*$/m);
    if (firstImportMatch) {
      const insertPosition = firstImportMatch.index + firstImportMatch[0].length;
      content = content.slice(0, insertPosition) +
                "\nimport { TRACE } from '@/lib/httpMethodSecurity'" +
                content.slice(insertPosition);
    }
  }

  // Add export at the end
  if (!content.endsWith('\n')) {
    content += '\n';
  }
  content += '\n// Export TRACE handler for 405 Method Not Allowed\nexport { TRACE }\n';

  fs.writeFileSync(filePath, content);
  console.log(`✅ Added TRACE handler to ${filePath}`);
}

function main() {
  console.log('🔧 Adding TRACE handlers to all API routes...\n');

  const routeFiles = getAllRouteFiles(API_DIR);

  if (routeFiles.length === 0) {
    console.log('❌ No route.ts files found');
    return;
  }

  console.log(`Found ${routeFiles.length} route files:\n`);

  for (const file of routeFiles) {
    const relativePath = path.relative(process.cwd(), file);
    try {
      addTraceHandler(file);
    } catch (error) {
      console.error(`❌ Error processing ${relativePath}: ${error.message}`);
    }
  }

  console.log(`\n✅ Processed ${routeFiles.length} API route files`);
  console.log('🚀 TRACE handlers added successfully!');
}

if (require.main === module) {
  main();
}

module.exports = { getAllRouteFiles, addTraceHandler };
