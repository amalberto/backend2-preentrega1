// src/config/process.js
// Configuración del proceso principal con listeners

export function setupProcessListeners() {
    // Listener: exit - se ejecuta cuando el proceso va a terminar
    process.on('exit', (code) => {
        if (code !== 0) {
            console.error(`[PROCESS] Proceso terminando con código: ${code}`);
        }
    });

    // Listener: SIGINT - Ctrl+C
    process.on('SIGINT', () => {
        process.exit(0);
    });

    // Listener: SIGTERM - kill
    process.on('SIGTERM', () => {
        process.exit(0);
    });

    // Listener: uncaughtException - errores no capturados
    process.on('uncaughtException', (error) => {
        console.error('[PROCESS] Excepción no capturada:', error.message);
        console.error(error.stack);
    });

    // Listener: unhandledRejection - promesas rechazadas sin .catch
    process.on('unhandledRejection', (reason, promise) => {
        console.error('[PROCESS] Promise rechazada sin manejar:', reason);
    });

    // Listener: warning - advertencias de Node (solo en desarrollo)
    if (process.env.NODE_ENV !== 'production') {
        process.on('warning', (warning) => {
            console.warn('[PROCESS] Warning:', warning.message);
        });
    }
}

/**
 * Función helper para mostrar info de memoria periódicamente (solo desarrollo/debug)
 */
export function startMemoryMonitor(intervalSeconds = 60) {
    if (process.env.NODE_ENV === 'production') return; // No ejecutar en producción
    
    setInterval(() => {
        const usage = process.memoryUsage();
        const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
        console.log(`[MEMORY] RSS: ${mb(usage.rss)}MB | Heap: ${mb(usage.heapUsed)}/${mb(usage.heapTotal)}MB`);
    }, intervalSeconds * 1000);
}
