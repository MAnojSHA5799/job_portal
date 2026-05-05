const fs = require('fs');
const content = fs.readFileSync('scraper-service/scraper.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  let balance = 0;
  for (let char of line) {
    if (char === '(') balance++;
    if (char === ')') balance--;
  }
  if (balance !== 0) {
    console.log(`Line ${i + 1}: Balance ${balance}`);
    console.log(line);
  }
});
