// src/config/handlebars.js
// Configuración de Handlebars con helpers personalizados

import { engine } from 'express-handlebars';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function configureHandlebars(app) {
    // Configurar motor de plantillas
    app.engine('handlebars', engine({
        layoutsDir: path.join(__dirname, '../views/layouts'),
        defaultLayout: 'main',
        extname: '.handlebars',
        helpers: {
            // Helper para comparar valores
            eq: (a, b) => a === b,
            
            // Helper para formatear fechas
            formatDate: (date) => {
                if (!date) return 'N/A';
                return new Date(date).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            },
            
            // Helper para JSON stringify
            json: (obj) => JSON.stringify(obj, null, 2)
        }
    }));
    
    app.set('view engine', 'handlebars');
    app.set('views', path.join(__dirname, '../views'));
    
    console.log('[HANDLEBARS] ✓ Motor de plantillas configurado');
}
