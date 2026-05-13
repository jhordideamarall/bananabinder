/**
 * Script untuk simulasi Webhook Midtrans secara local menggunakan bawaan Node.js
 */
const http = require('http');

const LOCAL_WEBHOOK_URL = 'http://localhost:3000/api/payment/webhook';
const ORDER_NUMBER = 'ORD-1714902195325'; // Pastikan ini ada di DB

console.log('🚀 Memulai simulasi webhook untuk Order:', ORDER_NUMBER);

const payload = JSON.stringify({
  external_id: ORDER_NUMBER,
  status: 'SETTLED',
  payment_method: 'BANK_TRANSFER',
  amount: 50000
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/payment/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload)
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('✅ Response dari Webhook Status:', res.statusCode);
    console.log('✅ Response Data:', data);
    console.log('\n💡 CEK TERMINAL SERVER (pnpm dev) Anda untuk melihat "Biteship Payload"!');
  });
});

req.on('error', (e) => {
  console.error('❌ Gagal simulasi:', e.message);
});

req.write(payload);
req.end();
