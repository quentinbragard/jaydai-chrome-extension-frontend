// build.js - Helper script for building the extension (ES Module version)
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);

// Determine which environment we are building for. The first argument that
// doesn't start with `--` is treated as the environment name. This allows
// commands like `npm run build prod` or `npm run build develop`.
const envArg = args.find(a => !a.startsWith('--')) || 'prod';
const isWatch = args.includes('--watch');
const isZip = args.includes('--zip');

// Map the environment argument to Vite's mode and the env file to load.
let mode = 'production';
let envFile = '.env.production';
let isProd = true;

switch (envArg) {
  case 'develop':
    mode = 'develop';
    envFile = '.env.develop';
    isProd = false;
    break;
  case 'locally':
    mode = 'locally';
    envFile = '.env.local';
    isProd = true; // Local build should behave like production
    break;
  case 'prod':
  case 'production':
  default:
    mode = 'production';
    envFile = '.env.production';
    isProd = true;
    break;
}

console.log(`🚀 Building extension for "${envArg}" using ${mode} mode...`);

// Build command
let buildCommand = `vite build --mode ${mode}`;

// Add watch flag if needed
if (isWatch && !isProd) {
  buildCommand += ' --watch';
}

try {
  // Run TypeScript compilation for production builds
  //if (isProd) {
   // console.log('🔍 Running TypeScript type checking...');
   // execSync('tsc -b', { stdio: 'inherit' });
 // }
  
  // Run the build
  console.log(`🛠️ Running build: ${buildCommand}`);
  execSync(buildCommand, { stdio: 'inherit' });
  
  // Build CSS
  console.log('🎨 Building CSS...');
  execSync('node build-css.js', { stdio: 'inherit' });
  
  // Create zip file for production builds if requested
  if (isZip) {
    console.log('📦 Creating zip file for Chrome Web Store submission...');
    const zipCommand = `cd dist && zip -r ../jaydai-extension_${mode}.zip *`;
    execSync(zipCommand, { stdio: 'inherit' });
    console.log(`📦 Created jaydai-extension_${mode}.zip`);
  }
  
  console.log('✅ Build completed successfully!');
  
  // Display environment info
  const envPath = path.join(__dirname, envFile);
  let apiUrl = 'unknown';
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    console.log(`\n📝 Using environment from ${envFile}:`);
    console.log(envContent.trim());
    const match = envContent.match(/^VITE_API_URL=(.*)$/m);
    if (match) {
      apiUrl = match[1];
    }
  }

  // Display API URL
  console.log(`\n🔌 API URL: ${apiUrl}`);
  
  // Display next steps
  console.log('\n📋 Next steps:');
  console.log('1. Open Chrome Extensions page (chrome://extensions/)');
  console.log('2. Enable Developer Mode');
  console.log('3. Load unpacked extension from the "dist" folder');
  if (isZip) {
    console.log(`4. Upload jaydai-extension_${mode}.zip to Chrome Web Store`);
  }
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}