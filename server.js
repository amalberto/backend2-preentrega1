// Configurar entorno ANTES de importar otras cosas (
import './src/config/environment.js';
import { setupProcessListeners, startMemoryMonitor } from './src/config/process.js';
import mongoose from 'mongoose';
import app from './src/app.js';
import config from './src/config/environment.js';

// Configurar listeners del proceso 
setupProcessListeners();

// Opcional: monitorear memoria cada 2 minutos
if (config.DEBUG) {
    startMemoryMonitor(120);
}

const PORT = config.PORT;

(async () => {
    try {
        console.log(`[SERVER] Iniciando en modo: ${config.MODE}`);
        console.log(`[SERVER] NODE_ENV: ${config.NODE_ENV}`);
        
        await mongoose.connect(config.MONGO_URI);
        console.log('[DB] ✓ Conectado a MongoDB');
        
        const server = app.listen(PORT, () => {
            console.log(`[SERVER] ✓ API escuchando en http://localhost:${PORT}`);
            console.log(`[SERVER] Para detener: Ctrl+C\n`);
        });

        // Graceful shutdown mejorado
        const shutdown = async (signal) => {
            console.log(`\n[SERVER] ${signal} recibido, cerrando servidor...`);
            
            server.close(async () => {
                console.log('[SERVER] ✓ Servidor HTTP cerrado');
                
                await mongoose.disconnect();
                console.log('[DB] ✓ Desconectado de MongoDB');
                
                console.log('[SERVER] ✓ Apagado completo\n');
                process.exit(0);
            });
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

    } catch (err) {
        console.error('[SERVER] ❌ Error fatal:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
})();