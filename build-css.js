// build-css.js - ES Module version with watch support
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import chokidar from 'chokidar'; // You'll need to install this: pnpm add -D chokidar

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const isWatch = args.includes('--watch');

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

// Define CSS files to build
const cssFiles = [
  { input: 'src/extension/popup/popup.css', output: 'dist/assets/popup.css' },
  { input: 'src/extension/welcome/welcome.css', output: 'dist/assets/welcome.css' },
  { input: 'src/extension/content/content.css', output: 'dist/assets/content.css' }
];

// Build all CSS files
async function buildAllCss() {
  console.log('🎨 Building all CSS files...');
  await Promise.all(cssFiles.map(file => buildCss(file.input, file.output)));
  console.log('🎉 CSS build complete!');
}

// Initial build
buildAllCss();

// Watch mode
if (isWatch) {
  console.log('👀 Watching CSS files for changes...');
  
  // Create a watcher for CSS files
  const watcher = chokidar.watch([
    'src/**/*.css',
    'tailwind.config.js' // Also watch Tailwind config for changes
  ], {
    persistent: true
  });
  
  // Set up event handlers
  watcher
    .on('change', async (filePath) => {
      console.log(`📄 File changed: ${filePath}`);
      await buildAllCss();
    })
    .on('error', error => console.error(`Watcher error: ${error}`));
  
  console.log('Watching for CSS changes. Press Ctrl+C to stop.');
}