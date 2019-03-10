const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const boolParser = require('express-query-boolean');

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

let cors = require('cors');

let app = express();
const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(boolParser());
app.use(cors());
app.options('*', cors());

app.get('/', function (req, res) {
   res.send('Hello Ro!');
});

let routes = require('./api/routes');
routes(app);

app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});