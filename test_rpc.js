require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data, error } = await supabaseAdmin.rpc('refund_balance', {
    p_user_id: '123',
    p_amount: 10,
    p_order_id: '123'
  });
  console.log("Error:", error);
}
run();
