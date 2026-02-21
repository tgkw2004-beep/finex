const { createClient } = require('@supabase/supabase-js');

const remoteMarketUrl = process.env.NEXT_PUBLIC_REMOTE_SUPABASE_URL_MARKET;
const remoteMarketServiceKey = process.env.REMOTE_SUPABASE_SERVICE_ROLE_KEY_MARKET;

const supabase = createClient(remoteMarketUrl, remoteMarketServiceKey);

async function run() {
  const { data: allDatesData } = await supabase
    .from('ecos_currency_all')
    .select('date')
    .eq('item_name1', '원/미국달러(매매기준율)')
    .order('date', { ascending: false });
  
  const allDates = allDatesData.map(d => d.date);
  
  const latestDateStr = allDates[0];
  const latestDate = new Date(latestDateStr);
  
  console.log("Latest:", latestDateStr);
  console.log("Prev:", allDates[1]);
  
  function getClosest(targetDate) {
    const targetStr = targetDate.toISOString().split('T')[0];
    const match = allDates.find(d => d <= targetStr);
    return match || null;
  }
  
  const d1w = new Date(latestDate); d1w.setDate(d1w.getDate() - 7);
  console.log("1W:", getClosest(d1w));

  const d1m = new Date(latestDate); d1m.setMonth(d1m.getMonth() - 1);
  console.log("1M:", getClosest(d1m));

  const d6m = new Date(latestDate); d6m.setMonth(d6m.getMonth() - 6);
  console.log("6M:", getClosest(d6m));

  const d1y = new Date(latestDate); d1y.setFullYear(d1y.getFullYear() - 1);
  console.log("1Y:", getClosest(d1y));

  const d5y = new Date(latestDate); d5y.setFullYear(d5y.getFullYear() - 5);
  console.log("5Y:", getClosest(d5y));
}
run();
