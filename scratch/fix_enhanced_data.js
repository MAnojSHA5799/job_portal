const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(user)/ats-score/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Update the AI Prompt to generate optimized experience, education, and skills
const oldPromptEnd = `"optimizedResume": {
          "summary": "string",
          "highlights": ["string"],
          "suggestedKeywords": ["string"]
        }
      }\`;`;

const newPromptEnd = `"optimizedResume": {
          "summary": "string",
          "experience": [
            { "role": "string", "company": "string", "dates": "string", "location": "string", "bulletPoints": ["string"] }
          ],
          "education": [
            { "degree": "string", "school": "string", "dates": "string", "location": "string" }
          ],
          "skills": ["string"]
        }
      }\`;`;

content = content.replace(oldPromptEnd, newPromptEnd);


// 2. Update the resume object definition to create originalResume and enhancedResume
const oldResumeDefStart = `const resume = {`;
const oldResumeDefEnd = `languages: defaultResumeData.languages
                    };`;

// Find where to replace
const resumeDefStartIndex = content.indexOf(oldResumeDefStart);
if (resumeDefStartIndex === -1) {
    console.error("Could not find resume definition");
    process.exit(1);
}

const resumeDefEndIndex = content.indexOf(oldResumeDefEnd) + oldResumeDefEnd.length;

const newResumeDef = `const originalResume = {
                      name: analysis?.parsedResume?.name || (file?.name ? file.name.split('.')[0] : defaultResumeData.name),
                      title: analysis?.parsedResume?.title || defaultResumeData.title,
                      contact: {
                        phone: analysis?.parsedResume?.contact?.phone || defaultResumeData.contact.phone,
                        email: analysis?.parsedResume?.contact?.email || defaultResumeData.contact.email,
                        location: analysis?.parsedResume?.contact?.location || defaultResumeData.contact.location,
                      },
                      summary: analysis?.parsedResume?.summary || defaultResumeData.summary,
                      experience: analysis?.parsedResume?.experience?.length ? analysis?.parsedResume?.experience : defaultResumeData.experience,
                      education: analysis?.parsedResume?.education?.length ? analysis?.parsedResume?.education : defaultResumeData.education,
                      skills: analysis?.parsedResume?.skills?.length ? analysis?.parsedResume?.skills : defaultResumeData.skills,
                      strengths: defaultResumeData.strengths,
                      achievements: defaultResumeData.achievements,
                      interests: defaultResumeData.interests,
                      languages: defaultResumeData.languages
                    };

                    const enhancedResume = {
                      ...originalResume,
                      summary: analysis?.optimizedResume?.summary || originalResume.summary,
                      experience: analysis?.optimizedResume?.experience?.length ? analysis?.optimizedResume?.experience : originalResume.experience,
                      education: analysis?.optimizedResume?.education?.length ? analysis?.optimizedResume?.education : originalResume.education,
                      skills: analysis?.optimizedResume?.skills?.length ? analysis?.optimizedResume?.skills : originalResume.skills,
                    };`;

content = content.substring(0, resumeDefStartIndex) + newResumeDef + content.substring(resumeDefEndIndex);

// 3. Replace all "resume." with "originalResume." in the Original layout block, and "enhancedResume." in the Enhanced layout block!
// Wait, to be safe, I'll replace it conditionally by targeting the two blocks.

const originalBlockStart = `/* ORIGINAL TEXT RESUME */`;
const enhancedBlockStart = `/* ENHANCED RESUME */`;
const enhancedBlockEnd = `})()}`;

const originalIdx = content.indexOf(originalBlockStart);
const enhancedIdx = content.indexOf(enhancedBlockStart);
const endIdx = content.indexOf(enhancedBlockEnd, enhancedIdx);

if (originalIdx !== -1 && enhancedIdx !== -1 && endIdx !== -1) {
    let originalBlock = content.substring(originalIdx, enhancedIdx);
    originalBlock = originalBlock.replace(/resume\./g, 'originalResume.');

    let enhancedBlock = content.substring(enhancedIdx, endIdx);
    enhancedBlock = enhancedBlock.replace(/resume\./g, 'enhancedResume.');

    content = content.substring(0, originalIdx) + originalBlock + enhancedBlock + content.substring(endIdx);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated the resume data handling!');
