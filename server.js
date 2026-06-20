const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 8080;
const wss = new WebSocketServer({ port: PORT });

console.log(`[SERWER ONLINE] Główna aplikacja telemetryczna działa na porcie ${PORT}`);

const connectedDevices = new Set();

wss.on('connection', (ws) => {
    console.log('[SERWER] Nowe urządzenie połączyło się.');
    connectedDevices.add(ws);

    ws.on('message', (message) => {
        // TA LINIEWKA POKAŻE NAM W LOGACH RENDERA CZY COŚ TU WPADA:
        console.log(`[SERWER] Otrzymano pakiet: ${message.toString().substring(0, 60)}...`);
        
        const rawData = message.toString();
        for (let device of connectedDevices) {
            if (device !== ws && device.readyState === 1) {
                device.send(rawData);
            }
        }
    });

    ws.on('close', () => {
        console.log('[SERWER] Urządzenie rozłączone.');
        connectedDevices.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('[SERWER BLAD]:', error.message);
    });
});
