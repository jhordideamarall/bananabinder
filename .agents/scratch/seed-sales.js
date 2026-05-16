/* eslint-disable */
const { createClient } = require('@supabase/supabase-js');

// Ambil URL dan KEY dari .env di root project
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedSalesData() {
  console.log('Fetching active products...');
  const { data: products, error: fetchError } = await supabase.from('products').select('id, name');

  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }

  console.log(`Found ${products.length} products. Updating with random sales data...`);

  for (const product of products) {
    // Generate random data
    const randomSold = Math.floor(Math.random() * (1543 - 534 + 1)) + 534;

    // Generate review count roughly proportional to sold count (e.g., 5% to 15% of buyers leave a review)
    const reviewRatio = Math.random() * (0.15 - 0.05) + 0.05;
    const randomReview = Math.max(1, Math.floor(randomSold * reviewRatio));

    // Generate high average rating (between 4.5 and 5.0)
    const randomRating = (Math.random() * (5.0 - 4.5) + 4.5).toFixed(1);

    const { error: updateError } = await supabase
      .from('products')
      .update({
        sold_count: randomSold,
        review_count: randomReview,
        avg_rating: parseFloat(randomRating),
      })
      .eq('id', product.id);

    if (updateError) {
      console.error(`Failed to update ${product.name}:`, updateError);
    } else {
      console.log(
        `✅ Updated ${product.name} -> Sold: ${randomSold}, Reviews: ${randomReview}, Rating: ${randomRating}`,
      );
    }
  }

  console.log('Seeding complete!');
}

seedSalesData();
