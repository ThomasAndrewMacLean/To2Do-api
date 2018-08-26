// if (process.env.NODE_ENV !== 'development') {
//     require('dotenv').load();
// }
import { getUserEmailFromToken } from './auth/auth';
const express = require('express');
var cookieParser = require('cookie-parser');
const logger = require('volleyball');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');

const db =
  process.env.NODE_ENV === 'test'
      ? require('./../mocks/monkey')(
          `mongodb://testUser:${
              process.env.MONGO_PW
          }@ds018848.mlab.com:18848/to2dotest`
      )
      : require('monk')(
          `mongodb://dbreadwrite:${
              process.env.MONGO_PW
          }@ds018708.mlab.com:18708/to2so`
      );
const cors = require('cors');

const app = express();
app.use(cors());

const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(cookieParser());
app.use(logger);
app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true
    })
);
//const path = require('path');
app.set('views', './src/views');
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/ping', (req, res) => {
    res.status(200).json({
        message: 'pong'
    });
});

import { sendMail } from './mailer/mailer';

import { encrypt, decrypt } from './auth/crypt';

let users = db.get('users');

app.post('/signup', (req, res) => {
    const { password, email } = req.body;
    console.log(email + ' start signup');

    users
        .findOne({
            email
        })
        .then(user => {
            if (user) {
                res.status(403).json({
                    message: 'allready a user'
                });
            } else {
                bcrypt.hash(password, saltRounds, function(err, hash) {
                    const newUser = {
                        email,
                        password: hash,
                        confirmed: false
                    };
                    console.log(newUser);

                    users.insert(newUser).then(user => {
                        sendMail(
                            email,
                            req.protocol +
                '://' +
                req.get('host') +
                '/confirm/' +
                encrypt(email)
                        );
                        jwt.sign(
                            {
                                user
                            },
                            process.env.JWT_SECRET,
                            {
                                expiresIn: '300000s'
                            },
                            (err, token) => {
                                res.status(200).json({
                                    token
                                });
                            }
                        );
                    });
                });
            }
        })
        .catch(err => {
            res.status(200).json({
                err
            });
        });
});

app.post('/login', (req, res) => {
    const { password, email } = req.body;
    users
        .findOne({
            email
        })
        .then(user => {
            if (!user.password) {
                res.status(403).json({
                    message: 'social login?'
                });
            }

            bcrypt.compare(password, user.password, function(err, resp) {
                if (resp) {
                    jwt.sign(
                        {
                            user
                        },
                        process.env.JWT_SECRET,
                        {
                            expiresIn: '3000000s'
                        },
                        (err, token) => {
                            res.status(200).json({
                                token
                            });
                        }
                    );
                } else {
                    res.status(403).json({
                        message: 'wrong password'
                    });
                }
            });
        })
        .catch(() =>
            res.status(403).json({
                message: 'wrong user'
            })
        );
});

app.get('/confirm/:encryption', (req, res) => {
    var encryption = req.params.encryption;
    const email = decrypt(encryption);

    console.log(encryption);
    users
        .update(
            {
                email: email
            },
            {
                $set: {
                    confirmed: true
                }
            }
        )
        .then(() => {
            const page =
        process.env.NODE_ENV === 'production' ? 'index' : 'index-dev';
            res.render(page);
        })
        .catch(err => res.status(403).json(err));
});

app.get('/test', (req, res) => {
    res.render('test');
});

app.post('/loginGoogle', getUserEmailFromToken, (req, res) => {
    const email = req.token;
    const name = req.body.name;
    users
        .findOne({
            email
        })
        .then(user => {
            if (user) {
                console.log('allready a user');
            } else {
                const newUser = {
                    email,
                    confirmed: true,
                    name,
                    google: true
                };
                console.log(newUser);

                users.insert(newUser);
            }
        })
        .catch(err => {
            res.status(403).json(err);
        });
});
app.get('/allusers', getUserEmailFromToken, (req, res) => {
    if (req.admin) {
        users.find().then(d => {
            res.status(200).json(
                d.map(u => {
                    return {
                        email: u.email,
                        id: u._id,
                        confirmed: u.confirmed,
                        todoos: [],
                        created: new Date(
                            parseInt(u._id.toString().substring(0, 8), 16) * 1000
                        )
                    };
                })
            );
        });
    } else {
        res.status(403);
    }
});

app.get('/isadmin', getUserEmailFromToken, (req, res) => {
    res.status(200).json({
        admin: req.admin
    });
});

app.post('/todoForUser', getUserEmailFromToken, (req, res) => {
    if (req.admin) {
        const email = req.body.email;
        db.get(email)
            .find()
            .then(d => res.status(200).json(d));
    } else {
        res.status(403);
    }
});

app.delete('/deleteUser', getUserEmailFromToken, (req, res) => {
    const email = req.body.email;
    if (req.admin) {
        users
            .remove({
                email: email
            })
            .then(() => {
                let userTodos = db.get(email);
                userTodos.remove({}).then(d => res.status(200).json(d));
            });
    } else {
        res.status(403);
    }
});

app.post('/addtodo', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos
        .insert({
            todo: encrypt(req.body.todo),
            timeStamp: req.body.timeStamp,
            done: false
        })
        .then(r => res.status(200).json(r));
});

app.post('/toggleDone', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos
        .update(
            {
                _id: req.body.id
            },
            {
                $set: {
                    done: req.body.done
                }
            }
        )
        .then(d => res.status(200).json(d));
});

app.delete('/deleteTodo', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos
        .remove({
            _id: req.body.id
        })
        .then(d => res.status(200).json(d));
});

app.get('/todoos', getUserEmailFromToken, (req, res) => {
    users
        .findOne({
            email: req.token
        })
        .then(findUser => {
            let userTodos = db.get(req.token);
            userTodos.find().then(d => {
                console.log('GETTING TODOOS');

                let td = d.forEach(dd => (dd.todo = decrypt(dd.todo)));

                console.log(d);

                console.log(td);

                res.status(200).json({
                    todoos: d,
                    user: findUser.name || req.token
                });
            });
        });
});

app.get('*/*', (req, res) => {
    res.status(200).json({
        message: 'path not found...'
    });
});

//app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));
export default app;
