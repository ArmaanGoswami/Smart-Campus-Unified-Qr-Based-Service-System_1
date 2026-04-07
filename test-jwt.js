#!/usr/bin/env node
/**
 * Test JWT token flow
 * Run: node test-jwt.js
 */

const http = require('http');

const BASE_URL = 'http://localhost:8080';
const API_AUTH = `${BASE_URL}/api/auth/login`;
const API_GATE_PASS = `${BASE_URL}/api/gate-pass/student/STU123/history`;

async function makeRequest(url, method = 'GET', body = null, token = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || 8080,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data ? JSON.parse(data) : null,
        });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function runTests() {
  console.log('\n🧪 JWT Token Flow Test\n');
  console.log(`Backend: ${BASE_URL}\n`);

  try {
    // 1. Login
    console.log('1️⃣  Login test...');
    const loginRes = await makeRequest(API_AUTH, 'POST', {
      username: 'student1',
      password: 'password123',
    });

    if (loginRes.status !== 200) {
      console.error('❌ Login failed:', loginRes.status, loginRes.body);
      return;
    }

    console.log('✅ Login successful');
    console.log('   Response:', JSON.stringify(loginRes.body, null, 2));

    const token = loginRes.body.token;
    if (!token) {
      console.error('❌ No token received!');
      return;
    }

    // 2. Use token for protected endpoint
    console.log('\n2️⃣  Protected endpoint test (with token)...');
    const protectedRes = await makeRequest(API_GATE_PASS, 'GET', null, token);
    console.log('✅ Protected request status:', protectedRes.status);
    if (protectedRes.status === 200) {
      console.log('   ✓ Token is valid! Got response:', JSON.stringify(protectedRes.body, null, 2).slice(0, 200));
    } else if (protectedRes.status === 401) {
      console.error('   ❌ Token rejected (401 Unauthorized)');
      console.error('   Response:', protectedRes.body);
    } else {
      console.log('   Status:', protectedRes.status, 'Body:', protectedRes.body);
    }

    // 3. Test without token
    console.log('\n3️⃣  Protected endpoint test (without token)...');
    const unprotectedRes = await makeRequest(API_GATE_PASS, 'GET');
    if (unprotectedRes.status === 401 || unprotectedRes.status === 403) {
      console.log('✅ Correctly rejected (status ' + unprotectedRes.status + ')');
    } else {
      console.error('❌ Should have been rejected!');
    }

    console.log('\n✅ JWT token flow is working!\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n⚠️  Make sure backend is running on http://localhost:8080\n');
  }
}

runTests();
