const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const OLD = 'hiringstores.com.in';
const NEW = 'hiringstores.com';

// Tables and their text columns to fix
const targets = [
  { table: 'jobs',      columns: ['description', 'content_html', 'seo_title', 'meta_description', 'apply_link', 'source_url'] },
  { table: 'companies', columns: ['description', 'website'] },
  { table: 'blogs',     columns: ['content', 'meta_description', 'title'] },
  { table: 'static_pages', columns: ['content', 'meta_description', 'title'] },
  { table: 'city_content',  columns: ['content', 'meta_description'] },
];

async function fixTable(table, columns) {
  console.log(`\n📋 Processing table: ${table}`);

  for (const col of columns) {
    // Fetch rows where column contains the old domain
    const { data, error } = await supabase
      .from(table)
      .select(`id, ${col}`)
      .like(col, `%${OLD}%`);

    if (error) {
      if (error.code === '42P01') {
        console.log(`  ⚠️  Table "${table}" does not exist — skipping.`);
        return; // skip whole table
      }
      console.error(`  ❌ Error fetching ${table}.${col}:`, error.message);
      continue;
    }

    if (!data || data.length === 0) {
      console.log(`  ✅ ${col}: no occurrences found.`);
      continue;
    }

    console.log(`  🔄 ${col}: found ${data.length} row(s) to update…`);

    for (const row of data) {
      const original = row[col];
      if (!original) continue;
      const updated = original.split(OLD).join(NEW);

      const { error: updateError } = await supabase
        .from(table)
        .update({ [col]: updated })
        .eq('id', row.id);

      if (updateError) {
        console.error(`    ❌ Failed to update id=${row.id}:`, updateError.message);
      } else {
        console.log(`    ✓ Updated id=${row.id}`);
      }
    }
  }
}

(async () => {
  console.log(`🚀 Starting DB domain fix: "${OLD}" → "${NEW}"\n`);

  for (const { table, columns } of targets) {
    await fixTable(table, columns);
  }

  console.log('\n✅ Done! All tables processed.');
})();
