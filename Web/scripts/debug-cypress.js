const fs = require('fs');
const path = require('path');

// Simple debug script to find Cypress stats
const cypressPath = path.join(__dirname, '../Resultados/Cypress/index.html');
const html = fs.readFileSync(cypressPath, 'utf8');

// Try multiple patterns
console.log('Searching for Cypress stats...\n');

// Pattern 1: Look for stats object
const statsMatch = html.match(/"stats"\s*:\s*{[^}]*"passes"\s*:\s*(\d+)[^}]*"failures"\s*:\s*(\d+)/);
if (statsMatch) {
    console.log('Found stats object:', 'passes:', statsMatch[1], 'failures:', statsMatch[2]);
}

// Pattern 2: Look for passes/failures properties
const passesMatch = html.match(/"passes"\s*:\s*(\d+)/);
const failuresMatch = html.match(/"failures"\s*:\s*(\d+)/);
if (passesMatch) console.log('Found passes:', passesMatch[1]);
if (failuresMatch) console.log('Found failures:', failuresMatch[1]);

// Pattern 3: Look for visual indicators
const numbers = html.match(/(\d{2,})/g);
if (numbers) {
    console.log('\nNumbers found (20+):', numbers.slice(0, 20).join(', '));
}

// Pattern 4: Look for text content near "passing" or "failing"
const contextMatch = html.match(/.{0,100}(\d+).{0,20}passing/i);
if (contextMatch) {
    console.log('\nContext around passing:', contextMatch[0]);
}
