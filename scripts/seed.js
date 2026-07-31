/**
 * Optional local test-data seeder.
 *
 * Populates a handful of sample prizes and one extra salesman profile so you
 * can click around the directory and the roulette wheel without typing SQL
 * by hand. Safe to run multiple times against a fresh dev project.
 *
 * Usage:
 *   1. Make sure .env.local has NEXT_PUBLIC_SUPABASE_URL and
 *      SUPABASE_SERVICE_ROLE_KEY set.
 *   2. node scripts/seed.js
 *
 * This does NOT create an admin login for you — see README.md step 5 for
 * that (it needs an email/password you choose yourself).
 */
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey || url.includes('YOUR-PROJECT-REF')) {
  console.error(
    '\nSet NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local first.\n'
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PRIZES = [
  { prize_name: 'Merquellantas Cap', day1_stock: 30, day2_stock: 30, day3_stock: 30, probability_weight: 10 },
  { prize_name: 'Tire Pressure Gauge', day1_stock: 20, day2_stock: 20, day3_stock: 20, probability_weight: 8 },
  { prize_name: 'Free Tire Rotation', day1_stock: 15, day2_stock: 15, day3_stock: 15, probability_weight: 6 },
  { prize_name: '$50 Gift Card', day1_stock: 5, day2_stock: 5, day3_stock: 5, probability_weight: 2 },
  { prize_name: 'Grand Prize Tire Set', day1_stock: 1, day2_stock: 1, day3_stock: 1, probability_weight: 1 },
];

const SAMPLE_SALESMEN = [
  {
    name: 'Ana Torres',
    email: 'ana.torres@merquellantas.example',
    phone: '+1 555 010 1111',
    location: 'Booth A1',
    whatsapp_link: 'https://wa.me/15550101111',
    role: 'salesman',
  },
  {
    name: 'Luis Herrera',
    email: 'luis.herrera@merquellantas.example',
    phone: '+1 555 010 2222',
    location: 'Booth A2',
    whatsapp_link: 'https://wa.me/15550102222',
    role: 'salesman',
  },
  {
    name: 'Sofia Reyes',
    email: 'sofia.reyes@merquellantas.example',
    phone: '+1 555 010 3333',
    location: 'Booth B1',
    whatsapp_link: 'https://wa.me/15550103333',
    role: 'salesman',
  },
];

async function seed() {
  console.log('Seeding prizes…');
  for (const prize of PRIZES) {
    const { data: existing } = await supabase
      .from('prizes')
      .select('id')
      .eq('prize_name', prize.prize_name)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from('prizes').insert(prize);
      if (error) {
        console.error(`  ✗ ${prize.prize_name}: ${error.message}`);
      } else {
        console.log(`  ✓ ${prize.prize_name}`);
      }
    } else {
      console.log(`  – ${prize.prize_name} already exists, skipped`);
    }
  }

  console.log('\nSeeding sample salesmen (directory profiles only, no login)…');
  for (const s of SAMPLE_SALESMEN) {
    const { data: existing } = await supabase
      .from('salesmen')
      .select('id')
      .eq('email', s.email)
      .maybeSingle();
    if (!existing) {
      const { error } = await supabase.from('salesmen').insert(s);
      if (error) {
        console.error(`  ✗ ${s.name}: ${error.message}`);
      } else {
        console.log(`  ✓ ${s.name}`);
      }
    } else {
      console.log(`  – ${s.name} already exists, skipped`);
    }
  }

  console.log('\nDone. Refresh your app to see the sample data.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
