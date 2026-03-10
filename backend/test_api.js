const http = require('http');
const fs = require('fs');

http.get('http://localhost:5000/estoque/test', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('api_result.json', data);
    console.log('Done writing api_result.json');
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
