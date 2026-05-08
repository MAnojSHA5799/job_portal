const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

// Update this with your actual frontend Vercel URL
const allowedOrigins = [
  // 'http://localhost:3000',
    'http://87.76.191.93:3000',
  'http://www.hiringstores.com',
  'https://www.hiringstores.com'
  // 'https://job-portal-seven-rosy.vercel.app' 
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Job Scraper Service is Running 🚀');
});

app.get('/scrape', (req, res) => {
  res.send('Use POST to trigger scraper, or wait... I will trigger it for you now! 🚀');
  triggerScraper();
});

app.post('/scrape', (req, res) => {
  const { filters } = req.body;
  triggerScraper(filters);
  res.json({
    success: true,
    message: 'Scraper started successfully in the background.',
    filters_applied: !!filters
  });
});

function triggerScraper(filters = null) {
  console.log('📡 Scrape request received with filters:', filters);
  
  const args = ['scraper.js'];
  if (filters) {
    // Pass filters as a base64 string to avoid shell escaping issues
    const filtersBase64 = Buffer.from(JSON.stringify(filters)).toString('base64');
    args.push(filtersBase64);
  }

  const scraper = spawn('node', args, {
    detached: true,
    stdio: 'inherit'
  });
  scraper.unref();
}

app.listen(PORT, () => {
  console.log(`🚀 Scraper service listening on port ${PORT}`);
});
