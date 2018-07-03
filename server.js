if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const express = require('express');
var cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('monk')(`mongodb://dbreadwrite:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`);

const app = express();
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let users = db.get('users');

app.get('/users', (req, res) => {
    console.log(req);

    users.find().then(d => res.status(200).json(d));
});

app.post('/users', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            users.insert({
                authData,
                email: req.body.user
            }).then(r => res.status(200).json(r));
        }
    });
});

app.post('/addToDo', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            let userTodos = db.get(authData.user.email);
            userTodos.insert({
                todo: req.body.todo,
                done: false
            }).then(r => res.status(200).json(r));
        }
    });
});

app.post('/toggleDone', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            let userTodos = db.get(authData.user.email);
            userTodos.update({
                _id: req.body.id
            }, {
                $set: {
                    done: req.body.done
                }
            }).then(d => res.status(200).json(d));
        }
    });
});

app.delete('/deleteTodo', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            let userTodos = db.get(authData.user.email);
            userTodos.remove({
                _id: req.body.id
            }).then(d => res.status(200).json(d));
        }
    });
});

app.get('/toDoos', verifyToken, (req, res) => {
    jwt.verify(req.token, 'secretkey', (err, authData) => {
        if (err) {
            res.sendStatus(403);
        } else {
            let userTodos = db.get(authData.user.email);
            userTodos.find().then(d => res.status(200).json(d));
        }
    });
});

app.delete('/users', (req, res) => {
    users.remove({
        email: req.body.user
    }).then(r => res.status(200).json(r));
});


app.post('/login', (req, res) => {
    // Mock user
    const user = {
        id: 1,
        username: 'Thomas',
        email: 'thomas.maclean@gmail.com'
    };

    jwt.sign({
        user
    }, 'secretkey', {
        expiresIn: '30000s'
    }, (err, token) => {
        res.json({
            token
        });
    });
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


// FORMAT OF TOKEN
// Authorization: Bearer <access_token>

// Verify Token
function verifyToken(req, res, next) {
    // Get auth header value
    const bearerHeader = req.headers['authorization'];
    // Check if bearer is undefined
    if (typeof bearerHeader !== 'undefined') {
        // Split at the space
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        next();
    } else {
        // Forbidden
        res.sendStatus(403);
    }

}

app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));