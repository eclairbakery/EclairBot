// start.js
const { spawn } = require('child_process');


spawn('npm', ['install'], {
    stdio: 'inherit', 
    shell: true 
});

spawn('npm', ['start'], {
    stdio: 'inherit', 
    shell: true 
});
