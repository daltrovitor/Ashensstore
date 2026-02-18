
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const url = 'https://liiusfsckequkbkcealh.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpaXVzZnNja2VxdWtia2NlYWxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTM4MTEyMywiZXhwIjoyMDg0OTU3MTIzfQ._Wv1ISHK5n46-2-IuEg32_aToHLzfuBbAPScq3uK5K4';

const supabase = createClient(url, key);

async function check() {
    const { data, error } = await supabase.from('store_categories').select('*');
    fs.writeFileSync('db_check.json', JSON.stringify({ data, error }, null, 2));
}

check();
