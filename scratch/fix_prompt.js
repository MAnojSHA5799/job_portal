const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../src/app/(user)/ats-score/page.tsx');
let content = fs.readFileSync(filePath, 'utf-8');

// 1. Rewrite the systemPrompt JSON schema
const oldPrompt = `"parsedResume": {
          "name": "string",
          "title": "string",
          "contact": { "phone": "string", "email": "string", "location": "string" },
          "summary": "string",
          "experience": [
            { "role": "string", "company": "string", "dates": "string", "location": "string", "bulletPoints": ["string"] }
          ],
          "education": [
            { "degree": "string", "school": "string", "dates": "string", "location": "string" }
          ],
          "skills": ["string"]
        },
        "optimizedResume": {
          "summary": "string",
          "experience": [
            { "role": "string", "company": "string", "dates": "string", "location": "string", "bulletPoints": ["string"] }
          ],
          "education": [
            { "degree": "string", "school": "string", "dates": "string", "location": "string" }
          ],
          "skills": ["string"]
        }`;

const newPrompt = `"resumeData": {
          "name": "string",
          "title": "string",
          "contact": { "phone": "string", "email": "string", "location": "string" },
          "originalSummary": "string",
          "optimizedSummary": "string",
          "experience": [
            { 
              "role": "string", 
              "company": "string", 
              "dates": "string", 
              "location": "string", 
              "originalBulletPoints": ["string"],
              "optimizedBulletPoints": ["string"]
            }
          ],
          "education": [
            { "degree": "string", "school": "string", "dates": "string", "location": "string" }
          ],
          "skills": ["string"]
        }`;

content = content.replace(oldPrompt, newPrompt);

// 2. Update the resume mapping logic
const oldMappingStart = `const originalResume = {
                      name: analysis?.parsedResume?.name || (file?.name ? file.name.split('.')[0] : defaultResumeData.name),`;

const oldMappingEnd = `education: analysis?.optimizedResume?.education?.length ? analysis?.optimizedResume?.education : originalResume.education,
                      skills: analysis?.optimizedResume?.skills?.length ? analysis?.optimizedResume?.skills : originalResume.skills,
                    };`;

const startIndex = content.indexOf(oldMappingStart);
const endIndex = content.indexOf(oldMappingEnd) + oldMappingEnd.length;

if (startIndex === -1 || endIndex === -1) {
    console.error("Mapping block not found");
    process.exit(1);
}

const newMapping = `const isDemo = !analysis?.resumeData?.name && !file?.name;
                    
                    const extractedData = analysis?.resumeData;

                    const mapExperience = (expArray, type) => {
                      if (!expArray || !expArray.length) return isDemo ? defaultResumeData.experience : [];
                      return expArray.map(exp => ({
                        ...exp,
                        bulletPoints: type === 'optimized' ? (exp.optimizedBulletPoints || exp.originalBulletPoints) : exp.originalBulletPoints
                      }));
                    };

                    const originalResume = {
                      name: extractedData?.name || (file?.name ? file.name.split('.')[0] : defaultResumeData.name),
                      title: extractedData?.title || (isDemo ? defaultResumeData.title : "Professional"),
                      contact: {
                        phone: extractedData?.contact?.phone || (isDemo ? defaultResumeData.contact.phone : ""),
                        email: extractedData?.contact?.email || (isDemo ? defaultResumeData.contact.email : ""),
                        location: extractedData?.contact?.location || (isDemo ? defaultResumeData.contact.location : ""),
                      },
                      summary: extractedData?.originalSummary || (isDemo ? defaultResumeData.summary : ""),
                      experience: mapExperience(extractedData?.experience, 'original'),
                      education: extractedData?.education?.length ? extractedData?.education : (isDemo ? defaultResumeData.education : []),
                      skills: extractedData?.skills?.length ? extractedData?.skills : (isDemo ? defaultResumeData.skills : []),
                      strengths: isDemo ? defaultResumeData.strengths : [],
                      achievements: isDemo ? defaultResumeData.achievements : [],
                      interests: isDemo ? defaultResumeData.interests : [],
                      languages: isDemo ? defaultResumeData.languages : []
                    };

                    const enhancedResume = {
                      ...originalResume,
                      summary: extractedData?.optimizedSummary || originalResume.summary,
                      experience: mapExperience(extractedData?.experience, 'optimized'),
                    };`;

content = content.substring(0, startIndex) + newMapping + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Successfully updated AI prompt and mapping logic!');
