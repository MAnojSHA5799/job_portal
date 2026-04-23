
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jwmjqlgoettrifzskrtw.supabase.co';
const supabaseKey = 'sb_publishable_TsvJQ_BFV2z_8ka9KPBvCw_kccW-bJi';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestBlog() {
  const content = `
<h2>Introduction</h2>
<p>Writing a great blog post isn't just about words; it's about the visual flow. Now you can easily add images between your text sections to keep your readers engaged!</p>
<img src="https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60" alt="Workspace" />
<h2>Why Visuals Matter</h2>
<p>Images break the monotony of long text blocks and help explain complex concepts visually. Our new block-based editor allows you to position these assets exactly where they belong in the narrative.</p>
<img src="https://images.unsplash.com/photo-1432821596592-e2c18b78144f?w=800&auto=format&fit=crop&q=60" alt="Blogging" />
<h2>Better Engagement</h2>
<p>Interleaving images and text is a proven way to increase reading time and improve the overall user experience of your blog. Try it out now!</p>
<p>This test post demonstrates how multiple sections and images can be combined seamlessly.</p>
  `.trim();

  const blogData = {
    title: "Test: Multi-Section Blog with Interleaved Images",
    excerpt: "Discover how our new block-based editor allows you to create dynamic layouts with multiple images and text sections.",
    content: content,
    author: "Antigravity AI",
    category: "Product Update",
    image_url: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=60",
    is_published: true,
    focus_keyword: "blog editor",
    slug: "test-multi-section-blog-" + Date.now(),
    tags: "test, editor, feature",
    meta_description: "A test post showcasing the new multi-image blog layout feature."
  };

  const { data, error } = await supabase
    .from('blogs')
    .insert([blogData])
    .select();

  if (error) {
    console.error('Error creating test blog:', error);
  } else {
    console.log('Test blog created successfully:', data);
  }
}

createTestBlog();
