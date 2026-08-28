import { supabaseAdmin } from '../config/supabase';

interface OptionDef {
  name: string;
  is_required: boolean;
  is_multi_select: boolean;
  values: { label: string; price_delta: number }[];
}

async function seedOptions() {
  console.log('--- Seeding Product Options & Option Values ---');

  // 1. Fetch all products
  const { data: products, error: pErr } = await supabaseAdmin
    .from('products')
    .select('id, name, category_id, categories(name)');

  if (pErr || !products) {
    console.error('Failed to fetch products:', pErr);
    process.exit(1);
  }

  console.log(`Found ${products.length} products in DB.`);

  // 2. Clear old options (cascade will delete values)
  console.log('Cleaning up existing product_options...');
  const { error: delValErr } = await supabaseAdmin.from('product_option_values').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delValErr) console.warn('Note deleting option values:', delValErr.message);

  const { error: delOptErr } = await supabaseAdmin.from('product_options').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (delOptErr) console.warn('Note deleting options:', delOptErr.message);

  // Common option presets
  const sizeOptionCoffee: OptionDef = {
    name: 'Boyut Seçimi',
    is_required: true,
    is_multi_select: false,
    values: [
      { label: 'Küçük Boy (250ml)', price_delta: 0 },
      { label: 'Orta Boy (350ml)', price_delta: 15 },
      { label: 'Büyük Boy (450ml)', price_delta: 25 },
    ],
  };

  const milkOption: OptionDef = {
    name: 'Süt Tercihi',
    is_required: false,
    is_multi_select: false,
    values: [
      { label: 'Tam Yağlı Süt (Standart)', price_delta: 0 },
      { label: 'Yağsız Süt', price_delta: 0 },
      { label: 'Laktozsuz Süt', price_delta: 10 },
      { label: 'Yulaf Sütü', price_delta: 15 },
      { label: 'Badem Sütü', price_delta: 15 },
      { label: 'Soya Sütü', price_delta: 12 },
    ],
  };

  const syrupOption: OptionDef = {
    name: 'Ekstra Şurup & Lezzet',
    is_required: false,
    is_multi_select: true,
    values: [
      { label: 'Ekstra Espresso Shot', price_delta: 20 },
      { label: 'Vanilya Şurubu', price_delta: 15 },
      { label: 'Karamel Şurubu', price_delta: 15 },
      { label: 'Fındık Şurubu', price_delta: 15 },
      { label: 'Çikolata Sosu', price_delta: 15 },
    ],
  };

  const blackCoffeeExtras: OptionDef = {
    name: 'Ekstralar',
    is_required: false,
    is_multi_select: true,
    values: [
      { label: 'Ekstra Espresso Shot', price_delta: 20 },
      { label: 'Yanında Sıcak Süt', price_delta: 10 },
      { label: 'Yanında Soğuk Süt', price_delta: 10 },
    ],
  };

  const espressoBeanOption: OptionDef = {
    name: 'Çekirdek Tercihi',
    is_required: false,
    is_multi_select: false,
    values: [
      { label: 'House Blend (Standart)', price_delta: 0 },
      { label: '%100 Single Origin Ethiopia', price_delta: 15 },
      { label: 'Kafeinsiz (Decaf)', price_delta: 10 },
    ],
  };

  const turkishSugarOption: OptionDef = {
    name: 'Şeker Oranı',
    is_required: true,
    is_multi_select: false,
    values: [
      { label: 'Sade', price_delta: 0 },
      { label: 'Az Şekerli', price_delta: 0 },
      { label: 'Orta', price_delta: 0 },
      { label: 'Şekerli', price_delta: 0 },
    ],
  };

  const turkishAromaOption: OptionDef = {
    name: 'Aroma & Çeşit',
    is_required: false,
    is_multi_select: false,
    values: [
      { label: 'Klasik', price_delta: 0 },
      { label: 'Damla Sakızlı', price_delta: 15 },
      { label: 'Çifte Kavrulmuş', price_delta: 10 },
    ],
  };

  const frapSizeOption: OptionDef = {
    name: 'Boyut Seçimi',
    is_required: true,
    is_multi_select: false,
    values: [
      { label: 'Orta Boy (350ml)', price_delta: 0 },
      { label: 'Büyük Boy (450ml)', price_delta: 20 },
    ],
  };

  const frapExtrasOption: OptionDef = {
    name: 'Krema & Ekstralar',
    is_required: false,
    is_multi_select: true,
    values: [
      { label: 'Ekstra Kremşanti', price_delta: 15 },
      { label: 'Ekstra Sos', price_delta: 15 },
      { label: 'Ekstra Espresso Shot', price_delta: 20 },
    ],
  };

  const dessertExtrasOption: OptionDef = {
    name: 'Ekstra Sos & Dondurma',
    is_required: false,
    is_multi_select: true,
    values: [
      { label: '1 Top Vanilyalı Dondurma', price_delta: 30 },
      { label: 'Sıcak Belçika Çikolatası', price_delta: 25 },
      { label: 'Karamel Sos', price_delta: 20 },
      { label: 'Antep Fıstığı Tozu', price_delta: 20 },
    ],
  };

  let totalOptionsInserted = 0;
  let totalValuesInserted = 0;

  for (const prod of products) {
    const name = prod.name.trim();
    const cat = (prod.categories as any)?.name || '';
    const optionsToAttach: OptionDef[] = [];

    // Turkish Coffee
    if (name.toLowerCase().includes('türk kahvesi')) {
      optionsToAttach.push(turkishSugarOption, turkishAromaOption);
    }
    // Espresso / Doppio
    else if (name.toLowerCase() === 'espresso' || name.toLowerCase() === 'doppio') {
      optionsToAttach.push(espressoBeanOption, {
        name: 'Ekstralar',
        is_required: false,
        is_multi_select: true,
        values: [{ label: '+1 Ekstra Shot', price_delta: 20 }],
      });
    }
    // Frappuccino
    else if (name.toLowerCase().includes('frappuccino')) {
      optionsToAttach.push(frapSizeOption, frapExtrasOption);
    }
    // Affogato
    else if (name.toLowerCase() === 'affogato') {
      optionsToAttach.push({
        name: 'Ekstralar',
        is_required: false,
        is_multi_select: true,
        values: [
          { label: '+1 Top Vanilyalı Dondurma', price_delta: 30 },
          { label: '+1 Ekstra Espresso Shot', price_delta: 20 },
          { label: 'Karamel Sos', price_delta: 15 },
        ],
      });
    }
    // Milky Coffees & Hot Chocolate
    else if (
      name.toLowerCase().includes('latte') ||
      name.toLowerCase().includes('cappuccino') ||
      name.toLowerCase().includes('flat white') ||
      name.toLowerCase().includes('mocha') ||
      name.toLowerCase().includes('cortado') ||
      name.toLowerCase().includes('machiato') ||
      name.toLowerCase().includes('macchiato') ||
      name.toLowerCase().includes('sıcak çikolata')
    ) {
      optionsToAttach.push(sizeOptionCoffee, milkOption, syrupOption);
    }
    // Black & Filter Coffees
    else if (
      name.toLowerCase().includes('americano') ||
      name.toLowerCase().includes('filtre') ||
      name.toLowerCase().includes('cold brew') ||
      name.toLowerCase().includes('freddo')
    ) {
      optionsToAttach.push(sizeOptionCoffee, blackCoffeeExtras);
    }
    // Desserts
    else if (cat === 'Tatlı' || name.toLowerCase().includes('cake') || name.toLowerCase().includes('brownie') || name.toLowerCase().includes('sufle') || name.toLowerCase().includes('kruvasan') || name.toLowerCase().includes('tiramisu')) {
      optionsToAttach.push(dessertExtrasOption);
    }

    // Insert for this product
    for (const opt of optionsToAttach) {
      const { data: createdOpt, error: optErr } = await supabaseAdmin
        .from('product_options')
        .insert({
          product_id: prod.id,
          name: opt.name,
          is_required: opt.is_required,
          is_multi_select: opt.is_multi_select,
        })
        .select()
        .single();

      if (optErr || !createdOpt) {
        console.error(`Error inserting option ${opt.name} for ${prod.name}:`, optErr);
        continue;
      }
      totalOptionsInserted++;

      const valuesToInsert = opt.values.map(v => ({
        option_id: createdOpt.id,
        label: v.label,
        price_delta: v.price_delta,
      }));

      const { error: valErr } = await supabaseAdmin
        .from('product_option_values')
        .insert(valuesToInsert);

      if (valErr) {
        console.error(`Error inserting values for option ${createdOpt.id}:`, valErr);
      } else {
        totalValuesInserted += valuesToInsert.length;
      }
    }
  }

  console.log(`\n🎉 SEED COMPLETED SUCCESSFULLY!`);
  console.log(`- Total Option Groups Inserted: ${totalOptionsInserted}`);
  console.log(`- Total Option Values Inserted: ${totalValuesInserted}`);
}

seedOptions().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
