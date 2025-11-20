// src/config/process.js
// Configuración del proceso principal con listeners

export function setupProcessListeners() {
    // Información del proceso al iniciar
    console.log('\n========== INFORMACIÓN DEL PROCESO ==========');
    console.log('PID:', process.pid);
    console.log('Versión de Node:', process.version);
    console.log('Directorio actual:', process.cwd());
    console.log('Plataforma:', process.platform);
    console.log('Arquitectura:', process.arch);
    console.log('Uso de memoria:', JSON.stringify(process.memoryUsage(), null, 2));
    console.log('Argumentos:', process.argv);
    console.log('===========================================\n');

    // Listener: exit - se ejecuta cuando el proceso va a terminar
    process.on('exit', (code) => {
        console.log(`\n[PROCESS] Proceso terminando con código: ${code}`);
    });

    // Listener: SIGINT - Ctrl+C
    process.on('SIGINT', () => {
        console.log('\n[PROCESS] SIGINT recibido (Ctrl+C)');
        console.log('[PROCESS] Cerrando aplicación de forma ordenada...');
        process.exit(0);
    });

    // Listener: SIGTERM - kill
    process.on('SIGTERM', () => {
        console.log('\n[PROCESS] SIGTERM recibido');
        console.log('[PROCESS] Cerrando aplicación...');
        process.exit(0);
    });

    // Listener: uncaughtException - errores no capturados
    process.on('uncaughtException', (error) => {
        console.error('\n[PROCESS] ⚠️  Excepción no capturada:');
        console.error(error);
        console.error('Stack:', error.stack);
        // En producción, podrías querer terminar el proceso
        // process.exit(1);
    });

    // Listener: unhandledRejection - promesas rechazadas sin .catch
    process.on('unhandledRejection', (reason, promise) => {
        console.error('\n[PROCESS] ⚠️  Promise rechazada sin manejar:');
        console.error('Razón:', reason);
        console.error('Promise:', promise);
    });

    // Listener: warning - advertencias de Node
    process.on('warning', (warning) => {
        console.warn('\n[PROCESS] ⚠️  Warning:');
        console.warn(warning.name);
        console.warn(warning.message);
        console.warn(warning.stack);
    });

    console.log('[PROCESS] ✓ Listeners configurados correctamente\n');
}

/**
 * Función helper para mostrar info de memoria periódicamente
 */
export function startMemoryMonitor(intervalSeconds = 60) {
    setInterval(() => {
        const usage = process.memoryUsage();
        console.log('\n[MEMORY] Uso actual:');
        console.log(`  RSS: ${(usage.rss / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Heap Total: ${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  Heap Used: ${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`  External: ${(usage.external / 1024 / 1024).toFixed(2)} MB`);
    }, intervalSeconds * 1000);
}
