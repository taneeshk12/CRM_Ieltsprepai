/**
 * SMTP Connection Tester for Hostinger
 * 
 * This script helps diagnose authentication issues
 * 
 * Usage: node smtp-connection-test.js
 * 
 * Make sure your .env.local has the correct credentials first!
 */

require('dotenv').config({ path: '.env.local' });
const nodemailer = require('nodemailer');

console.log('\n═══════════════════════════════════════════');
console.log('  🔍 Hostinger SMTP Connection Tester');
console.log('═══════════════════════════════════════════\n');

// Get credentials from .env.local
const smtpConfig = {
  host: process.env.HOSTINGER_SMTP_HOST,
  port: parseInt(process.env.HOSTINGER_SMTP_PORT || '587'),
  secure: process.env.HOSTINGER_SMTP_SECURE === 'true',
  auth: {
    user: process.env.HOSTINGER_EMAIL,
    pass: process.env.HOSTINGER_PASSWORD,
  },
};

// Validate configuration
console.log('📋 Configuration loaded from .env.local:');
console.log('   Host:', smtpConfig.host);
console.log('   Port:', smtpConfig.port);
console.log('   Secure (TLS):', smtpConfig.secure);
console.log('   Email:', smtpConfig.auth.user);
console.log('   Password: [HIDDEN]');
console.log('');

// Check for missing values
if (!smtpConfig.host) {
  console.error('❌ Error: HOSTINGER_SMTP_HOST not set in .env.local');
  process.exit(1);
}

if (!smtpConfig.auth.user || smtpConfig.auth.user === 'your-email@yourdomain.com') {
  console.error('❌ Error: HOSTINGER_EMAIL not set correctly in .env.local');
  console.error('   Found:', smtpConfig.auth.user);
  process.exit(1);
}

if (!smtpConfig.auth.pass || smtpConfig.auth.pass === 'your-hostinger-password') {
  console.error('❌ Error: HOSTINGER_PASSWORD not set correctly in .env.local');
  process.exit(1);
}

// Create transporter
console.log('🔄 Testing connection...\n');

const transporter = nodemailer.createTransport(smtpConfig);

// Test verification
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ CONNECTION FAILED\n');
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('');

    // Provide specific guidance based on error
    if (error.message.includes('535') || error.message.includes('authentication failed')) {
      console.error('💡 Suggestions:');
      console.error('   1. Double-check credentials in Hostinger control panel');
      console.error('   2. Make sure email account is ACTIVE (not suspended)');
      console.error('   3. Copy credentials directly from Hostinger (no spaces/typos)');
      console.error('   4. Try port 465 with secure=true if 587 fails');
      console.error('   5. Wait 5 minutes if you just created the email account');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 Suggestions:');
      console.error('   1. Check internet connection');
      console.error('   2. Verify SMTP host is correct: ' + smtpConfig.host);
      console.error('   3. Check if port ' + smtpConfig.port + ' is not blocked by firewall');
      console.error('   4. Try different port (587 or 465)');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.error('💡 Suggestions:');
      console.error('   1. Check internet connection');
      console.error('   2. Verify SMTP host: ' + smtpConfig.host);
      console.error('   3. Your firewall might be blocking SMTP');
      console.error('   4. Try from a different network');
    }

    console.error('');
    console.error('🆘 Still failing? Contact Hostinger support with this info:');
    console.error('   - SMTP Host: ' + smtpConfig.host);
    console.error('   - Port: ' + smtpConfig.port);
    console.error('   - Secure: ' + smtpConfig.secure);
    console.error('   - Email: ' + smtpConfig.auth.user);
    console.error('');

    process.exit(1);
  } else {
    console.log('✅ SUCCESS! SMTP Connection Works!\n');
    console.log('✓ Host:', smtpConfig.host);
    console.log('✓ Port:', smtpConfig.port);
    console.log('✓ Email:', smtpConfig.auth.user);
    console.log('✓ Authentication: Verified');
    console.log('');
    console.log('🎉 You can now send emails from your admin dashboard!');
    console.log('');
    console.log('Next steps:');
    console.log('   1. Go to http://localhost:3000/send-email');
    console.log('   2. Select users');
    console.log('   3. Compose email');
    console.log('   4. Click "Send Emails"');
    console.log('');

    process.exit(0);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  console.error('⏱️  Connection test timed out after 10 seconds');
  console.error('   This might indicate a network or firewall issue');
  process.exit(1);
}, 10000);
