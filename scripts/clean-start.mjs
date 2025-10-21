import { execSync } from 'node:child_process';

console.log('🧹 Cleaning up all Node.js processes...');

try {
  // Kill all node.exe processes
  console.log('Killing all Node.js processes...');
  execSync('taskkill /F /IM node.exe', { stdio: 'pipe' });
  console.log('✅ All Node.js processes killed');
} catch (error) {
  // taskkill returns non-zero exit code if no processes found, which is fine
  console.log('ℹ️ No Node.js processes found to kill');
}

// Wait a moment for processes to fully terminate
console.log('Waiting 3 seconds for cleanup...');
await new Promise(resolve => setTimeout(resolve, 3000));

// Check if port 3000 is still in use
try {
  const result = execSync('netstat -ano | findstr ":3000"', { stdio: 'pipe' }).toString();
  if (result.trim()) {
    console.log('⚠️ Port 3000 still in use after cleanup:');
    console.log(result);
  } else {
    console.log('✅ Port 3000 is now free');
  }
} catch (error) {
  console.log('✅ Port 3000 is now free');
}

console.log('🚀 Ready to start development server');






