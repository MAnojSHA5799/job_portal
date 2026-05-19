const main = async () => {
  try {
    const res = await fetch('http://localhost:3000/api/openai', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Return JSON only.' },
          { role: 'user', content: '{"hello": "world"}' }
        ]
      })
    });
    
    console.log('Status:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    const text = await res.text();
    console.log('Body snippet:', text.slice(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
};

main();
