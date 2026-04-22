'use server';

export async function generateBlogContent(title: string, category: string, keyword: string) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API Key not found');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an ELITE content creator and SEO expert. Generate a high-quality blog article in HTML format.
            
            MANDATORY STRUCTURE:
            1. Use <h1> for the main title.
            2. Use exactly 2-3 <h2> headings for sub-topics.
            3. Include at least one <ul> or <ol> list.
            4. Include one <table> with professional data related to the topic.
            5. Use <strong> and <em> for emphasis.
            6. Wrap everything in a <div>.
            7. Do NOT include <html> or <body> tags. Just the content.
            8. Content should be approximately 600-800 words.
            9. Optimize for the keyword: ${keyword}.`
          },
          {
            role: 'user',
            content: `Write a blog post about: "${title}". 
            Category: ${category}. 
            Primary Keyword: ${keyword}.`
          }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    let content = data.choices[0].message.content;
    
    // Clean up code blocks if AI wrapped them
    content = content.replace(/```html|```/g, '').trim();
    
    return { success: true, content };
  } catch (error: any) {
    console.error('AI Blog Generation error:', error);
    return { success: false, error: error.message };
  }
}

export async function enhanceBlogSEO(blog: any) {
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) throw new Error('OpenAI API Key not found');

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an ELITE SEO expert. Optimize the following blog metadata for a 100/100 score.
            Return ONLY a valid JSON object with these fields:
            1. "title": 50-60 characters, catchy and keyword-rich.
            2. "excerpt": 130-155 characters, engaging summary.
            3. "meta_description": 140-160 characters, includes call to action.
            4. "focus_keyword": most relevant 2-3 word keyword.
            5. "slug": url-friendly version of title.`
          },
          {
            role: 'user',
            content: `Current Title: ${blog.title}
            Current Excerpt: ${blog.excerpt}
            Content Snippet: ${blog.content.substring(0, 500)}
            Category: ${blog.category}`
          }
        ]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const optimized = JSON.parse(data.choices[0].message.content);
    return { success: true, optimized };
  } catch (error: any) {
    console.error('AI SEO Enhancement error:', error);
    return { success: false, error: error.message };
  }
}
