// src/config/commander.js
// Configuración de Commander para argumentos CLI 

import { Command } from 'commander';

const program = new Command();

program
    .option('-m, --mode <mode>', 'Modo de ejecución (development/production)', 'development')
    .option('-p, --port <port>', 'Puerto del servidor', '3000')
    .option('-d, --debug', 'Activar modo debug', false)
    .option('--env <environment>', 'Archivo de entorno a usar', 'development');

program.parse();

const options = program.opts();

export default options;
