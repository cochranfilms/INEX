import http from 'http';

const testUrls = [
  '/',
  '/index',
  '/index.html',
  '/INDEX',
  '/INDEX.HTML',
  '/status',
  '/status.html',
  '/STATUS',
  '/STATUS.HTML',
  '/inex-portal-agreement',
  '/inex-portal-agreement.html',
  '/INEX-PORTAL-AGREEMENT',
  '/INEX-PORTAL-AGREEMENT.HTML',
  '/inex-proposal',
  '/inex-proposal.html',
  '/INEX-PROPOSAL',
  '/INEX-PROPOSAL.HTML',
  '/contract-reference',
  '/contract-reference.html',
  '/CONTRACT-REFERENCE',
  '/CONTRACT-REFERENCE.HTML',
  '/nonexistent',
  '/nonexistent.html'
];

function testUrl(url) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: url,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          url,
          status: res.statusCode,
          contentType: res.headers['content-type'] || 'unknown',
          success: res.statusCode === 200
        });
      });
    });

    req.on('error', (err) => {
      resolve({
        url,
        status: 'ERROR',
        contentType: 'error',
        success: false,
        error: err.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing server routing...\n');
  
  for (const url of testUrls) {
    const result = await testUrl(url);
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${url.padEnd(30)} - Status: ${result.status} (${result.contentType})`);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('✅ = Success (200)');
  console.log('❌ = Failed or Error');
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export default { testUrl, runTests };
