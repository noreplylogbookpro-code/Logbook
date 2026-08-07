// Script to extract dictionary from useLanguage.js to dictionary.json
const fs = require('fs');
const path = require('path');

const srcFile = path.join(__dirname, '..', 'src', 'useLanguage.js');
const content = fs.readFileSync(srcFile, 'utf8');

// Extract the dictionary object using regex
const dictMatch = content.match(/export const dictionary = (\{[\s\S]*?\n\};)/);
if (!dictMatch) {
    console.error('Could not find dictionary in useLanguage.js');
    process.exit(1);
}

// Evaluate the object (it's valid JS object literal)
let dictStr = dictMatch[1];
// Remove trailing semicolon
dictStr = dictStr.replace(/;\s*$/, '');

// Use Function constructor to safely evaluate the JS object literal
const dict = new Function(`return ${dictStr}`)();

const outFile = path.join(__dirname, '..', 'src', 'dictionary.json');
fs.writeFileSync(outFile, JSON.stringify(dict, null, 2), 'utf8');

const originalSize = Buffer.byteLength(dictMatch[0], 'utf8');
const jsonSize = fs.statSync(outFile).size;

console.log(`Extracted dictionary to src/dictionary.json`);
console.log(`Original JS dictionary block: ${(originalSize / 1024).toFixed(1)} KB`);
console.log(`Exported JSON file: ${(jsonSize / 1024).toFixed(1)} KB`);
