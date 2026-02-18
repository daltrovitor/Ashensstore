
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function check() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('--- store_categories ---');
    const { data: store, error: storeErr } = await supabase.from('store_categories').select('*');
    console.log(storeErr || store);

    console.log('--- categories ---');
    const { data: cat, error: catErr } = await supabase.from('categories').select('*');
    console.log(catErr || cat);
}

check();
