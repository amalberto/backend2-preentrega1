// src/routes/process.routes.js
// Router para demostrar process y child_process 

import { Router } from 'express';
import { fork } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Contador de visitas
let visitCount = 0;

/**
 * GET / - Contador simple de visitas
 */
router.get('/', (req, res) => {
    visitCount++;
    res.json({
        message: 'Contador de visitas',
        visits: visitCount
    });
});

/**
 * GET /info - Información del proceso
 */
router.get('/info', (req, res) => {
    res.json({
        pid: process.pid,
        version: process.version,
        platform: process.platform,
        arch: process.arch,
        cwd: process.cwd(),
        memory: process.memoryUsage(),
        uptime: process.uptime()
    });
});

/**
 * GET /calculo-bloq - Cálculo BLOQUEANTE (bloquea el event loop)
 * ⚠️ Mientras este endpoint está procesando, el servidor no puede atender otras requests
 */
router.get('/calculo-bloq', (req, res) => {
    const limit = parseInt(req.query.limit) || 5000000000;
    
    console.log(`[BLOQUEANTE] Iniciando cálculo hasta ${limit}...`);
    const startTime = Date.now();
    
    let sum = 0;
    for (let i = 0; i <= limit; i++) {
        sum += i;
    }
    
    const duration = Date.now() - startTime;
    
    res.json({
        type: 'bloqueante',
        result: sum,
        limit,
        duration: `${duration}ms`,
        warning: 'Este cálculo bloqueó el servidor durante su ejecución'
    });
});

/**
 * GET /calculo-nobloq - Cálculo NO BLOQUEANTE (usa child_process)
 * ✓ El servidor puede seguir atendiendo otras requests mientras calcula
 */
router.get('/calculo-nobloq', (req, res) => {
    const limit = parseInt(req.query.limit) || 5000000000;
    
    console.log(`[NO BLOQUEANTE] Iniciando cálculo con fork() hasta ${limit}...`);
    const startTime = Date.now();
    
    // Crear proceso hijo
    const calculatePath = path.join(__dirname, '../utils/calculate.js');
    const child = fork(calculatePath);
    
    // Enviar mensaje al hijo
    child.send({
        type: 'calculate',
        limit
    });
    
    // Escuchar respuesta del hijo
    child.on('message', (message) => {
        if (message.type === 'result') {
            const duration = Date.now() - startTime;
            
            res.json({
                type: 'no-bloqueante',
                result: message.value,
                limit,
                duration: `${duration}ms`,
                info: 'Este cálculo se ejecutó en un proceso separado sin bloquear el servidor'
            });
            
            child.kill(); // Terminar proceso hijo
        }
    });
    
    // Manejar errores del hijo
    child.on('error', (error) => {
        console.error('[CHILD ERROR]', error);
        res.status(500).json({
            error: 'Error en el proceso hijo',
            message: error.message
        });
    });
});

export default router;
