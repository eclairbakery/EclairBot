// start.js
const { spawn } = require('child_process');

spawn('git', ['pull'], {
    stdio: 'inherit', 
    shell: true 
});

spawn('npm', ['install'], {
    stdio: 'inherit', 
    shell: true 
});

spawn('npm', ['start'], {
    stdio: 'inherit', 
    shell: true 
});
