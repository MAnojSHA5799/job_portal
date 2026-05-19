const fs = require('fs');

const filePath = './src/app/(user)/ats-score/page.tsx';
let content = fs.readFileSync(filePath, 'utf-8');

// Fix all map callbacks that TypeScript is complaining about
const fixes = [
  // Line 751: originalResume.strengths.map
  ['originalResume.strengths.map((s, i) =>', 'originalResume.strengths.map((s: any, i: number) =>'],
  // Line 857: enhancedResume.strengths.map
  ['enhancedResume.strengths.map((s, i) =>', 'enhancedResume.strengths.map((s: any, i: number) =>'],
  // Line 872: enhancedResume.achievements.map
  ['enhancedResume.achievements.map((a, i) =>', 'enhancedResume.achievements.map((a: any, i: number) =>'],
  // Line 898: enhancedResume.interests.map
  ['enhancedResume.interests.map((s, i) =>', 'enhancedResume.interests.map((s: any, i: number) =>'],
  // Line 913: enhancedResume.languages.map
  ['enhancedResume.languages.map((l, i) =>', 'enhancedResume.languages.map((l: any, i: number) =>'],
];

fixes.forEach(([from, to]) => {
  if (content.includes(from)) {
    content = content.replace(from, to);
    console.log(`✅ Fixed: ${from.slice(0, 50)}...`);
  } else {
    console.warn(`⚠️ Not found: ${from.slice(0, 50)}...`);
  }
});

fs.writeFileSync(filePath, content, 'utf-8');
console.log('\n✅ All TypeScript fixes applied!');
