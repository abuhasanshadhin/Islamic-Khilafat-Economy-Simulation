#!/usr/bin/env node
const net = require('net');

const host = process.argv[2] || 'db';
const port = Number(process.argv[3] || 3306);
const maxAttempts = Number(process.argv[4] || 30);

let attempt = 0;

function check() {
    attempt++;
    const socket = net.createConnection(port, host);
    socket.setTimeout(3000);
    socket.on('connect', () => {
        console.log(`db reachable: ${host}:${port}`);
        socket.end();
        process.exit(0);
    });
    socket.on('error', () => {
        socket.destroy();
        if (attempt >= maxAttempts) {
            console.error(`timeout waiting for ${host}:${port}`);
            process.exit(1);
        }
        console.log(`waiting for ${host}:${port} (${attempt}/${maxAttempts})`);
        setTimeout(check, 1000);
    });
    socket.on('timeout', () => {
        socket.destroy();
        if (attempt >= maxAttempts) {
            console.error(`timeout waiting for ${host}:${port}`);
            process.exit(1);
        }
        console.log(`waiting for ${host}:${port} (${attempt}/${maxAttempts})`);
        setTimeout(check, 1000);
    });
}

check();
