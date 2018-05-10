const http = require('http');
let express = require('express');

let app = express();
const hostname = '127.0.0.1';
const port = process.env.PORT || 3000;

// const app = http.createServer((req, res) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'text/plain');
//     res.end('Hello World\n');
// });

app.get('/', function (req, res) {
   res.send('Hello Ro!');
});

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});