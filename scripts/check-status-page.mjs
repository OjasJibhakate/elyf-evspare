import { readFileSync } from 'node:fs';
import pathlib from 'node:path';

const res = await fetch('http://localhost:3200/order/b5ca9495-3094-42f7-bd5c-ad29d30c4baa');
const html = await res.text();

const idx = html.indexOf('Status:');
console.log('around the status badge:');
console.log(JSON.stringify(html.slice(idx - 60, idx + 120)));

console.log('\ncontains "Shipped":', html.includes('Shipped'));
console.log('contains "Received":', html.includes('Received'));
