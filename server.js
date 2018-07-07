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
app.use(cors());
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const OAuth2Client = require('google-auth-library').OAuth2Client;
const CLIENT_ID = '171417293160-02sar26733jopm7hvfb6e5cgk4mq21d7.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);

let users = db.get('users');
//app.delete('/drop', (req, res) => {
//   db.get('thomas.maclean@marlon.be').remove(r => res.status(200).json(r))
//})
app.post('/signup', (req, res) => {
    const {
        password,
        email
    } = req.body;

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
                    }, process.env.JWT_SECRET, {
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
                }, process.env.JWT_SECRET, {
                    expiresIn: '10s'
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
    users.find().then(d => res.status(200).json(d));
});

app.post('/users', getUserEmailFromToken, (req, res) => {
    users.insert({
        authData,
        email: req.body.user
    }).then(r => res.status(200).json(r));
});

app.post('/addtodo', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos.insert({
        todo: req.body.todo,
        done: false
    }).then(r => res.status(200).json(r));
});

app.post('/toggleDone', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos.update({
        _id: req.body.id
    }, {
        $set: {
            done: req.body.done
        }
    }).then(d => res.status(200).json(d));
});

app.delete('/deleteTodo', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos.remove({
        _id: req.body.id
    }).then(d => res.status(200).json(d));
});

app.get('/todoos', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos.find().then(d => res.status(200).json(d));
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

function getUserEmailFromToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        const bearerProvider = bearer[0];
        if (bearerProvider === "Google") {
            client.verifyIdToken({
                idToken: bearerToken,
                audience: CLIENT_ID,
            }).then(ticket => {
                req.token = ticket.getPayload().email;
                if (ticket.getPayload().email === "thomas.maclean@gmail.com") {
                    req.admin = true;
                }
                next();
            }).catch(err => {
                res.status(403).json(err);
            })
        } else {
            jwt.verify(bearerToken, process.env.JWT_SECRET, (err, authData) => {
                if (err) {
                    console.log(err);
                    res.status(403).json(err);
                } else {
                    req.token = authData.user.email;
                    if (authData.user.email === "thomas.maclean@gmail.com") {
                        req.admin = true;
                    }
                    next();
                }
            });
        }
    } else {
        res.sendStatus(403);
    }
}

app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));