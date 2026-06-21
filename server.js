// server.js
// Działa na Render. Robi dwie rzeczy:
// 1) Przyjmuje telemetrię z client.js (Twojego komputera z ACC) po WebSocket
//    i rozsyła ją do wszystkich podłączonych przeglądarek (dashboardów).
// 2) Serwuje plik public/index.html pod tym samym adresem.

const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = process.env.PORT || 10000;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

let lastMessage = null; // ostatnia telemetria - nowy widz dostaje ją od razu, bez czekania na kolejny tick

const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = path.join(PUBLIC_DIR, filePath);

    // proste zabezpieczenie przed wyjściem poza PUBLIC_DIR
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not found');
            return;
        }
        const ext = path.extname(filePath);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(content);
    });
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
    console.log(`[SERVER] Klient połączony. Razem: ${wss.clients.size}`);

    if (lastMessage) {
        try { ws.send(lastMessage); } catch (e) {}
    }

    ws.on('message', (raw) => {
        const str = raw.toString();
        lastMessage = str;
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(str);
            }
        });
    });

    ws.on('close', () => {
        console.log(`[SERVER] Klient rozłączony. Razem: ${wss.clients.size}`);
    });

    ws.on('error', () => {});
});

server.listen(PORT, () => {
    console.log(`[SERVER] Nasłuch na porcie ${PORT}`);
});
