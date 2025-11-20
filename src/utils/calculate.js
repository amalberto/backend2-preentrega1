// src/utils/calculate.js
// Proceso hijo para cálculos pesados 

/**
 * Función que realiza un cálculo intensivo
 * Se usa desde un child_process para no bloquear el event loop
 */
function calculateSum(limit) {
    console.log(`[CHILD] Iniciando cálculo hasta ${limit}...`);
    let sum = 0;
    
    for (let i = 0; i <= limit; i++) {
        sum += i;
    }
    
    console.log(`[CHILD] Cálculo completado: ${sum}`);
    return sum;
}

// Escuchar mensajes del proceso padre
process.on('message', (message) => {
    console.log('[CHILD] Mensaje recibido del padre:', message);
    
    if (message.type === 'calculate') {
        const result = calculateSum(message.limit);
        
        // Enviar resultado al padre
        process.send({
            type: 'result',
            value: result
        });
    }
});

console.log('[CHILD] Proceso hijo iniciado, esperando mensajes...');
