require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: reports, error } = await supabase.from('raw_reports').select('*').limit(3);
  console.log("Reports:", reports);
  
  const { data: topics } = await supabase.from('report_topic_observations').select('*').limit(3);
  console.log("Topics:", topics);
}
check();
