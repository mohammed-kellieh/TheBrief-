const express = require('express');
const https = require('https');
const path = require('path');
const app = express();
const PORT = 3000;

// Serve static files
app.use(express.static(__dirname));

// RSS Proxy Endpoint
app.get('/api/news', (req, res) => {
    // Default to Google News DE if no url provided, but allow overrides
    const RSS_URL = req.query.url || 'https://news.google.com/rss?hl=de&gl=DE&ceid=DE:de';

    https.get(RSS_URL, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            // Handle redirect if needed (Google News sometimes redirects)
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                // Simple redirect following
                https.get(response.headers.location, (redirResponse) => {
                    let redirData = '';
                    redirResponse.on('data', c => redirData += c);
                    redirResponse.on('end', () => {
                        res.set('Access-Control-Allow-Origin', '*');
                        res.set('Content-Type', 'text/xml');
                        res.send(redirData);
                    });
                }).on('error', (err) => {
                    res.status(500).send('Error following redirect: ' + err.message);
                });
                return;
            }

            res.set('Access-Control-Allow-Origin', '*');
            res.set('Content-Type', 'text/xml');
            res.send(data);
        });

    }).on('error', (err) => {
        res.status(500).send('Error fetching RSS: ' + err.message);
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
