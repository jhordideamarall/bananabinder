// Versi Node 24 sudah ada fetch bawaan
const fs = require('fs');
const path = require('path');

// Manual parse .env karena kita tidak mau install dotenv di scratch
const envPath = path.join(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length === 2) env[parts[0].trim()] = parts[1].trim();
});

const API_KEY = env.BITESHIP_API_KEY;
const ORIGIN_AREA_ID = 'IDNP6M3K2W1'; // Kelapa Dua, Tangerang

async function testBiteship() {
  console.log('🚀 Memulai Simulasi Cek Ongkir Biteship...');
  console.log('🔑 API Key:', API_KEY.substring(0, 20) + '...');

  // 1. Resolve Area ID (Palembang 30135)
  console.log('🔍 Mencari Area ID untuk Palembang 30135...');
  const areaRes = await fetch(`https://api.biteship.com/v1/maps/areas?countries=ID&input=30135`, {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
  });
  const areaData = await areaRes.json();
  
  if (!areaData.success) {
    console.error('❌ Gagal mencari Area ID:', areaData.message);
    return;
  }

  const destinationAreaId = areaData.areas[0].id;
  console.log('✅ Area ID Ditemukan:', destinationAreaId);

  // 2. Cek Ongkir
  console.log('📦 Menghitung Ongkir (Tangerang -> Palembang, 2kg)...');
  const payload = {
    origin_area_id: ORIGIN_AREA_ID,
    destination_area_id: destinationAreaId,
    couriers: 'jne,jnt,sicepat',
    items: [{
      name: 'Royal Canin Indoor 27 - 2kg',
      quantity: 1,
      value: 245000,
      weight: 2000
    }]
  };

  const ratesRes = await fetch('https://api.biteship.com/v1/rates/couriers', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const ratesData = await ratesRes.json();

  if (!ratesData.success) {
    console.error('❌ Gagal mengambil ongkir:', ratesData.message);
    return;
  }

  console.log('\n✨ HASIL CEK ONGKIR:');
  ratesData.pricing.forEach(p => {
    console.log(`- ${p.courier_name} (${p.courier_service_name}): Rp ${p.price.toLocaleString()} - Estimasi: ${p.duration}`);
  });
  
  console.log('\n✅ TEST BERHASIL! Saldo Biteship Anda berfungsi dengan baik.');
}

testBiteship();
