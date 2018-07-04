if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}

const express = require('express');
var cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const db = require('monk')(`mongodb://dbreadwrite:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`);
const cors = require('cors');
const app = express();
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(cors());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

let users = db.get('users');

app.post('/signup', (req, res) => {
    const {
        password,
        email
    } = req.body;

    //TODO: check if email exists
    users.findOne({
        email
    }).then(user => {
        if (user) {
            res.status(403).json({
                message: 'allready a user'
            });
        } else {
            bcrypt.hash(password, saltRounds, function (err, hash) {
                const newUser = {
                    email,
                    password: hash
                };
                users.insert(newUser).then(user => {
                    console.log(user);

                    jwt.sign({
                        user
                    }, 'secretkey', {
                        expiresIn: '300s'
                    }, (err, token) => {
                        res.status(200).json({
                            token
                        });
                    });
                });
            });
        }
    }).catch(err => {
        res.status(200).json({
            err
        });
    });
});

app.post('/login', (req, res) => {
    const {
        password,
        email
    } = req.body;
    users.findOne({
        email
    }).then(user => {
        bcrypt.compare(password, user.password, function (err, resp) {
            if (resp) {
                jwt.sign({
                    user
                }, 'secretkey', {
                    expiresIn: '30000s'
                }, (err, token) => {
                    res.status(200).json({
                        token
                    });
                });
            } else {
                res.status(403).json({
                    message: 'wrong password'
                });
            }
        });
    }).catch(() => res.status(403).json({
        message: 'wrong user'
    }));


});

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
            console.log(err);

            res.status(403).json(err);
        } else {
            let userTodos = db.get(authData.user.email);
            userTodos.find().then(d => res.status(200).json(d));
        }
    });
});

app.delete('/users', (req, res) => {
    users.remove({
        email: req.body.email
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

function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        req.token = bearerToken;
        next();
    } else {
        res.sendStatus(403);
    }
}

app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));