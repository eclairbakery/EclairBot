// start.js
const { spawn } = require('child_process');

spawn('npm', ['start'], {
    stdio: 'inherit', 
    shell: true 
});
