if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const express = require('express');
var cookieParser = require('cookie-parser')
const morgan = require('morgan');
const bodyParser = require('body-parser');
const db = require('monk')(`mongodb://dbreadwright:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`)

const app = express();


app.use(cookieParser())
app.use(morgan('tiny'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.get('/test', (req, res) => {
    res.status(200).json({
        'message': 'hello world!'
    })
})

app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));
