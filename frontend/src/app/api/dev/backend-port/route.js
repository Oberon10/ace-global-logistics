import fs from 'fs';
import path from 'path';
import http from 'http';
import { NextResponse } from 'next/server';

function checkHealth(port, timeoutMs = 300) {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/health`, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed && (parsed.service === 'ACE Logistics API' || parsed.status === 'UP')) {
            return resolve(true);
          }
        } catch {}
        resolve(false);
      });
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

export async function GET() {
  // Only bypass discovery if explicitly deployed in production (e.g., on Vercel)
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    return NextResponse.json({
      port: null,
      url: (process.env.NEXT_PUBLIC_API_URL || 'https://ace-global-logistics.onrender.com').replace(/\/+$/, ''),
      mode: 'production'
    });
  }

  // 1. Check .active-port.json in candidate locations
  const candidates = [
    path.resolve(process.cwd(), 'public/.active-port.json'),
    path.resolve(process.cwd(), '.active-port.json'),
    path.resolve(process.cwd(), '../backend/.active-port.json'),
    path.resolve(process.cwd(), '../.active-port.json')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      try {
        const raw = fs.readFileSync(candidate, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && parsed.port) {
          const isAlive = await checkHealth(parsed.port, 300);
          if (isAlive) {
            return NextResponse.json({
              port: parsed.port,
              url: `http://localhost:${parsed.port}`,
              source: 'descriptor',
              updatedAt: parsed.updatedAt
            });
          }
        }
      } catch {}
    }
  }

  // 2. Scan ports 5000 to 5020 in parallel
  const probePromises = [];
  for (let port = 5000; port <= 5020; port++) {
    probePromises.push(
      checkHealth(port, 300).then(isAlive => isAlive ? port : null)
    );
  }

  const results = await Promise.all(probePromises);
  const foundPort = results.find(p => p !== null);

  if (foundPort) {
    try {
      const descriptorPath = path.resolve(process.cwd(), 'public/.active-port.json');
      fs.writeFileSync(descriptorPath, JSON.stringify({
        port: foundPort,
        url: `http://localhost:${foundPort}`,
        service: 'ace-logistics-backend',
        source: 'scanner',
        updatedAt: new Date().toISOString()
      }, null, 2), 'utf8');
    } catch {}

    return NextResponse.json({
      port: foundPort,
      url: `http://localhost:${foundPort}`,
      source: 'scanner'
    });
  }

  // 3. Fallback: check if NEXT_PUBLIC_API_URL explicitly specifies localhost port
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl && (envUrl.includes('localhost') || envUrl.includes('127.0.0.1'))) {
    const match = envUrl.match(/:(\d+)/);
    const port = match ? Number(match[1]) : 5000;
    return NextResponse.json({
      port,
      url: envUrl.replace(/\/+$/, ''),
      source: 'env'
    });
  }

  const defaultPort = 5000;
  return NextResponse.json({
    port: defaultPort,
    url: `http://localhost:${defaultPort}`,
    source: 'fallback'
  });
}
