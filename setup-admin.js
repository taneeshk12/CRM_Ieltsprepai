#!/usr/bin/env node

const bcrypt = require('bcryptjs');

/**
 * Admin User Setup Script
 * 
 * This script generates a bcrypt hash for the default admin password.
 * Run this script and then use the output to update your database.
 * 
 * Default credentials:
 * Username: admin
 * Password: adminielts123
 */

async function generatePasswordHash() {
  const password = 'adminielts123';
  const saltRounds = 10;
  
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n==============================================');
    console.log('Admin User Setup - Password Hash Generated');
    console.log('==============================================\n');
    console.log('Default Credentials:');
    console.log('  Username: admin');
    console.log('  Password: adminielts123\n');
    console.log('Generated Password Hash:');
    console.log(`  ${hash}\n`);
    console.log('==============================================');
    console.log('Setup Instructions:');
    console.log('==============================================\n');
    console.log('1. Go to your Supabase SQL Editor');
    console.log('2. Run the following SQL command:\n');
    console.log('INSERT INTO admin_users (username, password_hash, email, full_name)');
    console.log('VALUES (');
    console.log("  'admin',");
    console.log(`  '${hash}',`);
    console.log("  'admin@ieltsprepai.com',");
    console.log("  'System Administrator'");
    console.log(') ON CONFLICT (username) DO UPDATE');
    console.log('SET password_hash = EXCLUDED.password_hash,');
    console.log('    updated_at = now();');
    console.log('\n==============================================\n');
    console.log('Or use this API endpoint to create the user:');
    console.log('\nPOST /api/auth/register');
    console.log('Content-Type: application/json\n');
    console.log(JSON.stringify({
      username: 'admin',
      password: 'adminielts123',
      email: 'admin@ieltsprepai.com',
      full_name: 'System Administrator'
    }, null, 2));
    console.log('\n==============================================\n');
    
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

generatePasswordHash();
