// build-css.js - ES Module version
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function buildCss(input, output) {
  const inputPath = path.resolve(__dirname, input);
  const outputPath = path.resolve(__dirname, output);
  
  console.log(`Processing: ${inputPath} -> ${outputPath}`);
  
  try {
    const css = fs.readFileSync(inputPath, 'utf8');
    const result = await postcss([tailwindcss, autoprefixer]).process(css, { 
      from: inputPath, 
      to: outputPath 
    });
    
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    
    // Write CSS file
    fs.writeFileSync(outputPath, result.css);
    console.log(`✅ Built CSS: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error building CSS for ${inputPath}:`, error);
  }
}

// Build popup and welcome CSS
await Promise.all([
  buildCss('src/extension/popup/popup.css', 'dist/assets/popup-styles.css'),
  buildCss('src/extension/welcome/welcome.css', 'dist/assets/welcome-styles.css'),
  buildCss('src/extension/content/content.css', 'dist/assets/content-styles.css')
]);

console.log('🎉 CSS build complete!');