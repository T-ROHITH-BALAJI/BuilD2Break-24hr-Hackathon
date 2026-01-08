// Simple test script to check admin dashboard API
// Run this with: node test_admin_api.js

import fetch from 'node-fetch'; // You might need to install: npm install node-fetch

const API_BASE = 'http://localhost:5000'; // Adjust port if needed

async function testAdminAPI() {
  try {
    console.log('Testing Admin Dashboard API...\n');
    
    // Test 1: Check if users exist
    console.log('1. Testing users endpoint:');
    const usersResponse = await fetch(`${API_BASE}/api/admin/users?limit=5`);
    
    if (usersResponse.ok) {
      const usersData = await usersResponse.json();
      console.log('✅ Users API works');
      console.log(`   Found ${usersData.pagination?.total || 0} users`);
    } else {
      console.log('❌ Users API failed:', usersResponse.status);
    }
    
    // Test 2: Check if jobs exist
    console.log('\n2. Testing jobs endpoint:');
    const jobsResponse = await fetch(`${API_BASE}/api/admin/jobs?limit=5`);
    
    if (jobsResponse.ok) {
      const jobsData = await jobsResponse.json();
      console.log('✅ Jobs API works');
      console.log(`   Found ${jobsData.pagination?.total || 0} jobs`);
    } else {
      console.log('❌ Jobs API failed:', jobsResponse.status);
    }
    
    // Test 3: Check if applications exist
    console.log('\n3. Testing applications endpoint:');
    const appsResponse = await fetch(`${API_BASE}/api/admin/applications?limit=5`);
    
    if (appsResponse.ok) {
      const appsData = await appsResponse.json();
      console.log('✅ Applications API works');
      console.log(`   Found ${appsData.pagination?.total || 0} applications`);
    } else {
      console.log('❌ Applications API failed:', appsResponse.status);
    }
    
    // Test 4: Test dashboard stats (this is what we're trying to fix)
    console.log('\n4. Testing dashboard stats (without auth - will likely fail):');
    const statsResponse = await fetch(`${API_BASE}/api/admin/dashboard/stats`);
    
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('✅ Dashboard stats API works');
      console.log('   Stats:', JSON.stringify(statsData.stats, null, 2));
    } else {
      const errorText = await statsResponse.text();
      console.log('❌ Dashboard stats API failed:', statsResponse.status);
      console.log('   Error:', errorText);
      console.log('   (This is expected without authentication)');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Simple database query test (if you want to run this separately)
export async function testDatabaseDirectly() {
  // You would need to import your pool here
  // This is just a structure for direct DB testing
  console.log('Direct database test (implement if needed):');
  console.log('1. SELECT COUNT(*) FROM users;');
  console.log('2. SELECT COUNT(*) FROM jobs;');
  console.log('3. SELECT COUNT(*) FROM applications;');
}

testAdminAPI();