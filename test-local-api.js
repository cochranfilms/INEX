import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🧪 Testing INEX API Functions Locally...\n');

// Test 1: Check if data files exist
console.log('📁 Test 1: Data Files');
try {
  const liveDataPath = path.join(__dirname, 'inex-live-data.json');
  const messagesPath = path.join(__dirname, 'inex-messages.json');
  
  if (fs.existsSync(liveDataPath)) {
    const liveData = JSON.parse(fs.readFileSync(liveDataPath, 'utf8'));
    console.log(`✅ inex-live-data.json: Found (${liveData.progress}% progress, Phase: ${liveData.phase})`);
  } else {
    console.log('❌ inex-live-data.json: Not found');
  }
  
  if (fs.existsSync(messagesPath)) {
    const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));
    console.log(`✅ inex-messages.json: Found (${messages.length} messages)`);
  } else {
    console.log('❌ inex-messages.json: Not found');
  }
} catch (error) {
  console.log(`❌ Error reading data files: ${error.message}`);
}

// Test 2: Check API function structure
console.log('\n🔗 Test 2: API Function Structure');
const apiDir = path.join(__dirname, 'api');
const apiFiles = fs.readdirSync(apiDir).filter(file => file.endsWith('.js'));

apiFiles.forEach(file => {
  const filePath = path.join(apiDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  if (content.includes('export default function handler') || content.includes('export default async function handler')) {
    console.log(`✅ ${file}: Proper Vercel function structure`);
  } else {
    console.log(`❌ ${file}: Missing proper export structure`);
  }
});

// Test 3: Check Vercel configuration
console.log('\n🚀 Test 3: Vercel Configuration');
try {
  const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  
  if (vercelConfig.functions && vercelConfig.functions['api/**/*.js']) {
    console.log('✅ Vercel functions configuration: Proper');
  } else {
    console.log('❌ Vercel functions configuration: Missing or incorrect');
  }
  
  if (vercelConfig.buildCommand) {
    console.log('✅ Build command: Configured');
  } else {
    console.log('❌ Build command: Missing');
  }
} catch (error) {
  console.log(`❌ Error reading vercel.json: ${error.message}`);
}

console.log('\n🎯 Summary:');
console.log('- If all tests pass ✅, the issue is likely in Vercel deployment');
console.log('- If any tests fail ❌, fix those issues first');
console.log('- Deploy to Vercel after fixing any local issues');
