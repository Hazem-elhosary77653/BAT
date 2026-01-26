const http = require('http');

const url = 'http://localhost:3001/uploads/test.txt';

http.get(url, (res) => {
    console.log(`StatusCode: ${res.statusCode}`);
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => console.log(`Body: ${data}`));
}).on('error', (err) => {
    console.error(`Error: ${err.message}`);
});
