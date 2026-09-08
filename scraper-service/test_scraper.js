const { execSync } = require('child_process');
execSync('node scraper.js', { stdio: 'inherit' });
