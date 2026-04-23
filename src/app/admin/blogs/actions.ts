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
            content: `You are an ELITE SEO expert and content editor. Your goal is to optimize the following blog for a 100/100 SEO score.
            
            You MUST optimize both the metadata AND the full content.
            
            GUIDELINES FOR CONTENT OPTIMIZATION:
            1. Maintain the existing HTML structure exactly (headings, lists, tables, images).
            2. VERY IMPORTANT: If there are <img> tags, keep them in their exact relative positions. Do NOT remove or change the 'src' of images.
            3. Improve keyword density naturally for the focus keyword.
            4. Enhance readability and flow.
            5. Add semantic subheadings (h2, h3) if they improve the structure.
            6. Ensure the content is professional, engaging, and authoritative.
            7. Do NOT change the core message or facts of the article.
            8. Return the content as a sequence of HTML elements. Do NOT wrap everything in a single <div>.
            
            Return ONLY a valid JSON object with these fields:
            1. "title": 50-60 characters, catchy and keyword-rich.
            2. "excerpt": 130-155 characters, engaging summary.
            3. "meta_description": 140-160 characters, includes call to action.
            4. "focus_keyword": most relevant 2-3 word keyword.
            5. "slug": url-friendly version of title.
            6. "content": the full optimized HTML content.`
          },
          {
            role: 'user',
            content: `Current Title: ${blog.title}
            Current Excerpt: ${blog.excerpt}
            Current Focus Keyword: ${blog.focus_keyword}
            Current Content: ${blog.content}
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
