if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}
const express = require('express');
var cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const db = process.env.NODE_ENV === 'test' ?
    require('monk')(`mongodb://testUser:${process.env.MONGO_PW}@ds018848.mlab.com:18848/to2dotest`) :
    require('monk')(`mongodb://dbreadwrite:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`);
const cors = require('cors');
const getUserEmailFromToken = require('./auth/auth');

const app = express();
app.use(cors());

const bcrypt = require('bcrypt');
const saltRounds = 10;
const crypto = require('./auth/crypt');
const mailer = require('./mailer/mailer');
app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

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
                    password: hash,
                    confirmed: false
                };
                console.log(newUser);

                users.insert(newUser).then(user => {
                    mailer.sendMail(email, req.protocol + '://' + req.get('host') + '/confirm/' + crypto.encrypt(email));
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
                    expiresIn: '3000s'
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

app.get('/confirm/:encryption', (req, res) => {
    var encryption = req.params.encryption;
    const email = crypto.decrypt(encryption);

    users.update({
        email: email
    }, {
        $set: {
            confirmed: true
        }
    }).then(() => {
        const page = process.env.NODE_ENV === 'production' ?
            'index' : 'index-dev';
        res.render(page);
    }).catch(err => res.status(403).json(err));
});

app.get('/users', (req, res) => {
    if (req.admin) {
        users.find().then(d => res.status(200).json(d));
    } else {
        res.status(403);
    }
});
app.post('/todoForUser', (req, res) => {
    if (req.admin) {
        const email = req.body.email;
        db.get(email).find().then(d => res.status(200).json(d));
    } else {
        res.status(403);
    }
});

app.delete('/users', (req, res) => {
    const email = req.body.email;
    var a = true;
    if (a) {
        users.remove({
            email: email
        }).then(() => {
            let userTodos = db.get(email);
            userTodos.remove({}).then(d => res.status(200).json(d));
        });
    } else {
        res.status(403);
    }
});
// app.post('/users', getUserEmailFromToken, (req, res) => {
//     users.insert({
//         authData,
//         email: req.body.user
//     }).then(r => res.status(200).json(r));
// });

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
    console.log('start');
    // console.log(req);

    let userTodos = db.get(req.token);
    userTodos.find().then(d => {
        console.log(d);
        res.status(200).json(d);
    });
});

app.get('/ping', (req, res) => {
    res.status(200).json({
        'message': 'pong'
    });
});

app.get('*/*', (req, res) => {
    res.status(200).json({
        'message': 'path not found...'
    });
});

app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));

module.exports = app;