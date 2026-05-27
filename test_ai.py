import urllib.request
import json

test_cases = [
    {
        "name": "Valid Resume Text",
        "text": "John Doe\nSoftware Engineer\nExperience:\n- 5 years at Google building scalable web applications using React and Node.js.\n- Developed internal tools for data analysis.\nEducation: B.S. Computer Science\nSkills: JavaScript, TypeScript, React, Node.js"
    },
    {
        "name": "Random Garbage / Image Text",
        "text": "          \n\n\n  a   b   123   \n\n  @@@  "
    },
    {
        "name": "Invoice Document",
        "text": "INVOICE #12345\nDate: 2026-05-27\nBilled To: Acme Corp\nTotal: $500.00\nServices: Web design and hosting."
    }
]

for tc in test_cases:
    print(f"\nTesting: {tc['name']}")
    
    if len(tc['text'].strip()) < 50:
        print(f"❌ Result: Failed length check (length={len(tc['text'].strip())})")
        continue

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {
                "role": "system",
                "content": 'You are a document classifier. Analyze the given document text and determine if it is a resume or CV.\nA resume/CV contains sections like: personal info, work experience, education, skills, certifications, summary/objective.\nReply with ONLY a JSON object: { "isResume": true/false, "reason": "short reason" }. No extra text.'
            },
            {
                "role": "user",
                "content": f"Classify this document (first 1500 chars):\n\n{tc['text'][:1500]}"
            }
        ]
    }
    
    req = urllib.request.Request(
        'http://localhost:3000/api/openai',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
        method='POST'
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode())
            raw = res_data.get('choices', [{}])[0].get('message', {}).get('content', '').strip()
            
            raw = raw.replace('```json', '').replace('```', '').strip()
            parsed = json.loads(raw)
            
            if not parsed.get('isResume'):
                print(f"❌ Result: Rejected -> Reason: {parsed.get('reason')}")
            else:
                print(f"✅ Result: Accepted -> Reason: {parsed.get('reason', 'None')}")
    except Exception as e:
        print(f"Error: {e}")

