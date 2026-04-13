const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const supabaseAnonKey = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addTestBlog() {
  const testBlog = {
    title: 'Testing the New Blog Management System',
    excerpt: 'A deep dive into how we built a modern, dynamic blog system using Next.js and Supabase for real-time updates.',
    content: 'This is a test blog post created to verify the functionality of our new admin dashboard. \n\nWe have implemented: \n- Full CRUD operations \n- Image uploads to Supabase Storage \n- Responsive UI with Tailwind and Framer Motion \n- Real-time updates on the public feed.',
    author: 'Admin Tester',
    category: 'Engineering',
    image_url: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=2070',
    is_published: true
  };

  console.log('Inserting test blog...');
  const { data, error } = await supabase
    .from('blogs')
    .insert([testBlog])
    .select();

  if (error) {
    console.error('Error inserting blog:', error.message);
    console.log('Make sure you have run the SQL script in Supabase Editor to create the blogs table!');
  } else {
    console.log('Success! Test blog inserted:', data[0].id);
  }
}

addTestBlog();
