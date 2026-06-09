// scripts/fix_names.mjs
import https from 'https';

const HOST = 'wlehkvsxftyxmxelcaps.supabase.co';
const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsZWhrdnN4ZnR5eG14ZWxjYXBzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTQ4MjY2OSwiZXhwIjoyMDk1MDU4NjY5fQ.70L4MTVMbPYj8u1SzVrCZ7426MONlzkEbcFUsv2pWI4';

function update(id, name) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ name });
    const req = https.request({
      hostname: HOST,
      path: `/rest/v1/member_types?id=eq.${id}`,
      method: 'PATCH',
      headers: {
        'apikey': KEY,
        'Authorization': `Bearer ${KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`✅ ${id} → ${name}`);
          resolve();
        } else {
          console.error(`❌ ${id} (${res.statusCode}):`, d);
          resolve();
        }
      });
    });
    req.on('error', e => { console.error(`❌ ${id}:`, e.message); resolve(); });
    req.write(body);
    req.end();
  });
}

console.log('Fixing Chinese names in member_types...');
await update('free', '免费用户');
await update('vip_monthly', '月度会员');
await update('vip_yearly', '年度会员');
console.log('Done.');
