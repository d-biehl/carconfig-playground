#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fetchAndSaveSpec() {
  try {
    console.log('🔄 Fetching OpenAPI specification from server...');

    const response = await fetch('http://localhost:3001/api/docs');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const spec = await response.json();

    // Write the spec to a file
    const outputPath = path.join(__dirname, '..', 'openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(spec, null, 2));

    console.log('✅ OpenAPI specification saved to openapi.json');

    // Also create a YAML version for better readability
    const yamlPath = path.join(__dirname, '..', 'openapi.yaml');
    fs.writeFileSync(yamlPath, yaml.dump(spec, {
      indent: 2,
      lineWidth: 120,
      noRefs: true
    }));

    console.log('✅ OpenAPI specification saved to openapi.yaml');

    return spec;

  } catch (error) {
    console.error('❌ Error fetching OpenAPI spec:', error.message);

    if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Make sure the development server is running on http://localhost:3001');
      console.error('   Run: npm run dev');
    }

    process.exit(1);
  }
}

fetchAndSaveSpec();
