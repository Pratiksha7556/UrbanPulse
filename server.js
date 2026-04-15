const express = require('express');
const cors = require('cors');

// Native fetch check for Node 18+ support, fallback to require if needed
const fetch = globalThis.fetch || require('node-fetch');

// --- Configuration ---
const app = express();
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0'; // Bind to all interfaces
const OPENAQ_BASE_URL = 'https://api.openaq.org/v3/locations'; // Cleaned URL
const API_KEY = process.env.OPENAQ_API_KEY || 'ed994f85030164e81bf1d8c713955e325d33daf022ec3853818cc5373d53d162';

// --- Middleware ---
app.use(cors({
    origin: '*', // Enable CORS for all origins (dev mode)
    methods: ['GET', 'POST', 'OPTIONS']
})); 
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
    next();
});

// --- Routes ---

// Root
app.get('/', (req, res) => {
    res.send('<h1>UrbanPulse Backend Online 🟢</h1><p>Status: Ready. Listening on all interfaces.</p>');
});

// Health Check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'online',
        timestamp: new Date().toISOString(),
        service: 'UrbanPulse Proxy',
        uptime: process.uptime()
    });
});

// Proxy to OpenAQ
app.get('/api/air', async (req, res) => {
    try {
        const { lat, lng, radius = 25000 } = req.query;
        
        if (!lat || !lng) {
            return res.status(400).json({ error: 'Missing lat/lng parameters', results: [] });
        }

        const params = new URLSearchParams({
            coordinates: `${lat},${lng}`,
            radius: radius.toString(),
            limit: '8',
            content: 'sensors'
        });

        const url = `${OPENAQ_BASE_URL}?${params.toString()}`;
        console.log(`Forwarding to OpenAQ: ${url}`);

        // Fetch with 5s timeout
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(url, {
            method: 'GET',
            headers: { 
                'X-API-Key': API_KEY, 
                'Accept': 'application/json' 
            },
            signal: controller.signal
        });
        
        clearTimeout(timeout);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('OpenAQ API Error:', response.status, errorText);
            // Return empty results instead of error code to keep frontend stable
            return res.status(200).json({ results: [] }); 
        }

        const data = await response.json();
        return res.json(data);

    } catch (error) {
        console.error('Proxy Error:', error);
        // Fail-safe: always return JSON structure
        return res.status(200).json({ results: [] }); 
    }
});

// --- Start Server ---
app.listen(PORT, HOST, () => {
    console.log('==================================================');
    console.log(`✅ SERVER STARTED SUCCESSFULLY`);
    console.log(`   ➜ Network: http://127.0.0.1:${PORT}`);
    console.log(`   ➜ Health:  http://127.0.0.1:${PORT}/api/health`);
    console.log(`   ➜ All Interfaces: http://${HOST}:${PORT}`);
    console.log('==================================================');
});