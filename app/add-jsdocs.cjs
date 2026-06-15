const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') && !fullPath.includes('.test.tsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Don't add if already has JSDoc block right above export
      if (!content.includes('/**\n *')) {
        // Regex to find export default function or export function
        const functionRegex = /export\s+(?:default\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g;
        let match;
        let hasModifications = false;
        
        // This is a naive replacement but it works for standard component files
        content = content.replace(/export\s+(?:default\s+)?function\s+([A-Za-z0-9_]+)\s*\(/g, (fullMatch, name) => {
          hasModifications = true;
          return `/**\n * ${name} component.\n * \n * @returns {JSX.Element} The rendered component.\n */\n${fullMatch}`;
        });
        
        // Also check for const components
        content = content.replace(/export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:React\.forwardRef)?\s*\(/g, (fullMatch, name) => {
           hasModifications = true;
           return `/**\n * ${name} component.\n * \n * @returns {JSX.Element} The rendered component.\n */\n${fullMatch}`;
        });

        if (hasModifications) {
          fs.writeFileSync(fullPath, content, 'utf8');
          console.log(`Added JSDoc to ${fullPath}`);
        }
      }
    }
  }
}

processDir(path.join(__dirname, 'src', 'components'));
processDir(path.join(__dirname, 'src', 'pages'));
console.log('Done!');
