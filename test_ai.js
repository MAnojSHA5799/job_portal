const testCases = [
  {
    name: "Valid Resume Text",
    text: "John Doe\nSoftware Engineer\nExperience:\n- 5 years at Google building scalable web applications using React and Node.js.\n- Developed internal tools for data analysis.\nEducation: B.S. Computer Science\nSkills: JavaScript, TypeScript, React, Node.js"
  },
  {
    name: "Random Garbage / Image Text",
    text: "          \n\n\n  a   b   123   \n\n  @@@  "
  },
  {
    name: "Invoice Document",
    text: "INVOICE #12345\nDate: 2026-05-27\nBilled To: Acme Corp\nTotal: $500.00\nServices: Web design and hosting."
  }
];

async function runTests() {
  for (const tc of testCases) {
    console.log(`\nTesting: ${tc.name}`);
    
    if (tc.text.trim().length < 50) {
      console.log(`❌ Result: Failed length check (length=${tc.text.trim().length})`);
      continue;
    }

    try {
      const res = await fetch('http://localhost:3000/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a document classifier. Analyze the given document text and determine if it is a resume or CV.\nA resume/CV contains sections like: personal info, work experience, education, skills, certifications, summary/objective.\nReply with ONLY a JSON object: { "isResume": true/false, "reason": "short reason" }. No extra text.`
            },
            {
              role: 'user',
              content: `Classify this document (first 1500 chars):\n\n${tc.text.slice(0, 1500)}`
            }
          ]
        })
      });
      const data = await res.json();
      const raw = data?.choices?.[0]?.message?.content?.trim() || '{"isResume":true}';
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
      
      if (!parsed.isResume) {
        console.log(`❌ Result: Rejected -> Reason: ${parsed.reason}`);
      } else {
        console.log(`✅ Result: Accepted -> Reason: ${parsed.reason || 'None'}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
}

runTests();
