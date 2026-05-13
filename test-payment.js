
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Load env dari root project
dotenv.config({ path: path.resolve(__dirname, './.env') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const XENDIT_SECRET_KEY = process.env.XENDIT_SECRET_KEY;

const orderId = '2554b403-0f00-4faf-99f7-1f15fcff7788';

async function testPaymentCreate() {
  console.log('--- STARTING PAYMENT CREATE TEST ---');
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !XENDIT_SECRET_KEY) {
    console.error('MISSING ENV VARS:', { SUPABASE_URL: !!SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY: !!SUPABASE_SERVICE_ROLE_KEY, XENDIT_SECRET_KEY: !!XENDIT_SECRET_KEY });
    return;
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // 1. Fetch Order
  console.log('Fetching order...');
  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError) {
    console.error('ORDER_FETCH_ERROR:', orderError);
    return;
  }
  console.log('Order Found:', order.order_number);

  // 2. Fetch Profile
  console.log('Fetching profile...');
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', order.user_id)
    .single();
  
  if (profileError) {
    console.error('PROFILE_FETCH_ERROR:', profileError);
  } else {
    console.log('Profile Found:', profile.email);
  }

  // 3. Fetch Items
  console.log('Fetching items...');
  const { data: orderItems, error: itemsError } = await supabaseAdmin
    .from('order_items')
    .select('*, products(name)')
    .eq('order_id', order.id);

  if (itemsError) {
    console.error('ITEMS_FETCH_ERROR:', itemsError);
    return;
  }
  console.log('Items Found:', orderItems.length);

  // 4. Prepare Xendit Payload
  const authString = Buffer.from(`${XENDIT_SECRET_KEY}:`).toString('base64');
  const items = orderItems.map((item) => ({
    name: (item.products?.name || item.product_name || 'Produk').slice(0, 255),
    quantity: item.quantity,
    price: Math.round(Number(item.price)),
  }));

  const customerEmail = profile?.email || 'customer@pawvels.com';

  const xenditPayload = {
    external_id: order.order_number,
    amount: Math.round(Number(order.total)),
    payer_email: customerEmail,
    description: `TEST_MANUAL: Pesanan ${order.order_number}`,
    customer: {
      given_names: profile?.name || 'Customer Test',
      email: customerEmail,
      mobile_number: profile?.phone || '',
    },
    items: items,
    currency: 'IDR',
  };

  console.log('Xendit Payload prepared.');

  // 5. Call Xendit
  console.log('Calling Xendit API...');
  try {
    const response = await fetch('https://api.xendit.co/v2/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(xenditPayload),
    });

    const xenditData = await response.json();
    
    if (!response.ok) {
      console.error('XENDIT_API_ERROR:', JSON.stringify(xenditData, null, 2));
    } else {
      console.log('✅ SUCCESS! Invoice Created.');
      console.log('🔗 URL:', xenditData.invoice_url);
    }
  } catch (err) {
    console.error('FETCH_ERROR:', err);
  }
}

testPaymentCreate();
