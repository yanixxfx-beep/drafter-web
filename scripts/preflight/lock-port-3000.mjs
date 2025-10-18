import net from 'node:net';
import { execSync } from 'node:child_process';

const port = 3000;

function getOwner(port) {
  try {
    const cmd = `powershell -NoProfile -Command "$c=Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue; if($c){$op=$c.OwningProcess; $p=Get-CimInstance Win32_Process -Filter \\"ProcessId=$op\\"; Write-Output ($p.ProcessId.tostring() + '|'+ $p.Name + '|' + $p.ExecutablePath + '|' + $p.CommandLine)}"`;
    const out = execSync(cmd, { stdio: 'pipe' }).toString().trim();
    if (!out) return null;
    const [pid, name, exe, cmdline] = out.split('|');
    return { pid: Number(pid), name, exe, cmdline };
  } catch { 
    return null; 
  }
}

function tryBind(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '127.0.0.1');
  });
}

function tryBindIPv6(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.once('listening', () => server.close(() => resolve(true)));
    server.listen(port, '::1');
  });
}

(async () => {
  try {
    // Check both IPv4 and IPv6
    await tryBind(port);
    await tryBindIPv6(port);
    console.log(`✓ Port ${port} is available (IPv4 and IPv6)`);
    process.exit(0);
  } catch (e) {
    const owner = getOwner(port);
    console.error(`❌ Port ${port} is already in use.`);
    console.error(`Error: ${e.message}`);
    if (owner) {
      console.error(`Owner PID: ${owner.pid}`);
      console.error(`Name: ${owner.name}`);
      console.error(`Executable: ${owner.exe || 'N/A'}`);
      console.error(`Command: ${owner.cmdline || 'N/A'}`);
    } else {
      console.error('Owner could not be determined.');
    }
    console.error('');
    console.error('To fix this:');
    console.error('1. Kill the process: taskkill /F /PID ' + (owner?.pid || 'UNKNOWN'));
    console.error('2. Or use: npm run dev:try');
    process.exit(1);
  }
})();
