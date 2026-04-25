-- Insert a comprehensive test blog with all features enabled
INSERT INTO blogs (
    title, 
    excerpt, 
    content, 
    author, 
    category, 
    image_url, 
    is_published, 
    focus_keyword, 
    slug, 
    tags, 
    meta_description, 
    faqs
) VALUES (
    'Ultimate Guide to Modern Web Development 2026', 
    'A comprehensive look at the latest trends, tools, and best practices for building high-performance web applications in 2026.', 
    '<h2>Welcome to the Future</h2>
    <p>Web development has evolved rapidly. Today, we focus on <strong>performance</strong>, <strong>accessibility</strong>, and <u>user experience</u> above all else.</p>
    
    <h3>Key Technologies to Watch</h3>
    <ul>
        <li>Next.js 16 with AI integration</li>
        <li>Tailwind CSS v4 Engine</li>
        <li>WebAssembly for Heavy Computing</li>
    </ul>

    <h3>Market Comparison Table</h3>
    <table>
        <thead>
            <tr>
                <th>Technology</th>
                <th>Performance</th>
                <th>Complexity</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>React 19</td>
                <td>High</td>
                <td>Medium</td>
            </tr>
            <tr>
                <td>Svelte 5</td>
                <td>Ultra-High</td>
                <td>Low</td>
            </tr>
            <tr>
                <td>Angular 18</td>
                <td>High</td>
                <td>High</td>
            </tr>
        </tbody>
    </table>

    <p>Check out our <a href="https://google.com">official documentation</a> for more details on these technologies.</p>
    
    <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80" alt="Coding on Laptop" />
    
    <h3>Conclusion</h3>
    <p>Staying ahead in 2026 requires continuous learning and adopting modern frameworks early.</p>', 
    'Antigravity AI', 
    'Technology', 
    'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80', 
    true, 
    'Modern Web Development 2026', 
    'ultimate-guide-web-dev-2026', 
    'webdev, tech, 2026, tutorial', 
    'Learn about the future of web development in 2026. Top frameworks, performance tips, and modern architecture explained.', 
    '[
        {"question": "What is the best framework in 2026?", "answer": "Next.js 16 continues to lead the market with its seamless integration of AI and edge computing capabilities."},
        {"question": "How important is SEO for modern apps?", "answer": "SEO is more critical than ever, especially with AI search engines crawling web content differently than traditional ones."},
        {"question": "Should I learn TypeScript?", "answer": "Yes, TypeScript is the industry standard and almost all modern enterprise projects require it."}
    ]'::jsonb
);
