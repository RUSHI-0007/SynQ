const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 4000,
  path: '/api/projects/status',
  method: 'GET'
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, data));
});
req.end();
