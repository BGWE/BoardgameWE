const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
let cors = require('cors')

let app = express();
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.get('/', function (req, res) {
   res.send('Hello Ro!');
});

let routes = require('./api/routes');
routes(app);

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});