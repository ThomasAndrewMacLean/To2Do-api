if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const express = require('express');
var cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('monk')(`mongodb://dbreadwrite:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`);

const app = express();


app.use(cookieParser());
app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let users = db.get('users');

app.get('/users', (req, res) => {
    users.find().then(d => res.status(200).json(d));
});

app.post('/users', (req, res) => {
    users.insert({
        email: req.body.user
    }).then(r => res.status(200).json(r));
});

app.delete('/users', (req, res) => {
    users.remove({
        email: req.body.user
    }).then(r => res.status(200).json(r));
});


app.get('/test', (req, res) => {
    res.status(200).json({
        'message': 'hello world!'
    });
});

app.get('*/*', (req, res) => {
    res.status(200).json({
        'message': '!!!'
    });
});


app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));