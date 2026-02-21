const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey, {
    db: { schema: 'remote_visual' },
    global: { headers: { 'Accept-Profile': 'remote_visual', 'Content-Profile': 'remote_visual' } }
});

async function findTradingDay() {
    const today = new Date();
    for (let i = 0; i < 10; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        console.log(`Trying ${dStr}...`);
        const start = Date.now();
        const { data, error } = await supabase
            .from('vsl_anly_stocks_price_subindex01')
            .select('date')
            .eq('date', dStr)
            .limit(1);
        console.log(`Result in ${Date.now() - start}ms:`, data ? data.length : error);
        if (data && data.length > 0) {
            console.log(`Found recent trading day: ${dStr}`);
            return dStr;
        }
    }
}

findTradingDay();
