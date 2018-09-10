import { getUserEmailFromToken } from './auth/auth';
const express = require('express');
const cookieParser = require('cookie-parser');
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

/**
 * @api {get} /ping Test server
 * @apiName GetPing
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiSuccess {String} pong Always returns pong
 */
app.get('/ping', (req, res) => {
    res.status(200).json({
        message: 'pong'
    });
});

import { sendMail } from './mailer/mailer';

import { encrypt, decrypt } from './auth/crypt';

let users = db.get('users');

/**
 * @api {post} /signup Sign up a new user
 * @apiName PostSignup
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 * @apiParam {String} email     Mandatory email.
 * @apiParam {String} password     Mandatory password.
 *
 * @apiSuccess {String} token It returns a JWT
 * @apiError (403) {Object} message On error 403 it sets message
 */
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

/**
 * @api {post} /login Log in a user
 * @apiName PostLogin
 * @apiGroup To2Do
 *  @apiVersion 1.0.0

 * @apiParam {String} email     Mandatory email.
 * @apiParam {String} password     Mandatory password.
 *
 * @apiSuccess {String} token It returns a JWT
 * @apiError (403) {Object} message On error 403 it sets message
 */
app.post('/login', (req, res) => {
    const { password, email } = req.body;

    try {
        users
            .findOne({
                email
            })
            .then(user => {
                if (!user.password) {
                    res.status(403).json({
                        message: 'social login?'
                    });
                    return;
                }

                bcrypt.compare(password, user.password, function(err, resp) {
                    if (resp) {
                        jwt.sign(
                            {
                                user
                            },
                            process.env.JWT_SECRET,
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
    } catch (error) {
        console.log('IT WENT APESH*T 🐒');

        console.log(error);
    }
});

/**
 * @api {get} /confirm/:encryption Confirm emailaddress
 * @apiName GetConfirm
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiParam {String} encryption    .
 *
 * @apiSuccess {Page} index it returns a HTML page
 * @apiError (403) {Error} error
 */
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

/**
 * @api {post} /loginGoogle Place google login user in database
 * @apiName PostLoginGoogle
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Google Token
 *
 * @apiParam {String} name Mandatory name.
 *
 * @apiError (403) {Object} message On error 403 it sets message
 */
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

/**
 * @api {get} /admin/allusers Get all the users
 * @apiName GetAdminAllusers
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 *
 * @apiSuccess {Object} users A list of all the users
 *
 * @apiError (403) Error
 */
app.get('/admin/allusers', getUserEmailFromToken, (req, res) => {
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

/**
 * @api {get} /admin/isadmin Check if user from token is admin
 * @apiName GetAdminIsAdmin
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 *
 * @apiSuccess {Object} admin A Boolean
 *
 */
app.get('/admin/isadmin', getUserEmailFromToken, (req, res) => {
    res.status(200).json({
        admin: req.admin
    });
});

/**
 * @api {post} /admin/todoForUser Get todoos for a user
 * @apiName GetAdminTodoForUser
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 * @apiParam {String} email Mandatory email.
 *
 * @apiSuccess {Object} todoos A list of all the todoos
 * @apiError (403) Error
 *
 */
app.post('/admin/todoForUser', getUserEmailFromToken, (req, res) => {
    if (req.admin) {
        const email = req.body.email;
        db.get(email)
            .find()
            .then(d => res.status(200).json(d));
    } else {
        res.status(403);
    }
});

/**
 * @api {delete} /admin/deleteUser Delete A User
 * @apiName DeleteAdminDeleteUser
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 * @apiParam {String} email Mandatory email.
 *
 * @apiSuccess {Object} mongoResponse.
 * @apiError (403) Error
 *
 */
app.delete('/admin/deleteUser', getUserEmailFromToken, (req, res) => {
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

/**
 * @api {post} /addtodo Add a Todo
 * @apiName PostAddTodo
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 * @apiParam {String} todo Mandatory todo.
 *
 * @apiSuccess {Object} todo Returns the Todo.
 * @apiError (403) Error
 *
 */
app.post('/addtodo', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos
        .insert({
            todo: encrypt(req.body.todo),
            timeStamp: req.body.timeStamp,
            done: false,
            encrypt: true
        })
        .then(r => {
            r.todo = decrypt(r.todo);
            return res.status(200).json(r);
        });
});

/**
 * @api {post} /toggleDone Toggle status of Todo
 * @apiName PostToggleTodo
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 * @apiParam {string} id Mandatory id.
 * @apiParam {boolean} done Mandatory done.
 *
 * @apiSuccess {Object} mongo Returns mongo response.
 * @apiError (403) Error
 *
 */
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

/**
 * @api {delete} /todo Deletes a Todo
 * @apiName DeleteTodo
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 * @apiParam {string} id Mandatory id.
 *
 * @apiSuccess {Object}  mongo Returns mongo response.
 * @apiError (403) Error
 *
 */
app.delete('/deleteTodo', getUserEmailFromToken, (req, res) => {
    let userTodos = db.get(req.token);
    userTodos
        .remove({
            _id: req.body.id
        })
        .then(d => res.status(200).json(d));
});

/**
 * @api {get} /todoos Get all todoos
 * @apiName GetTodoos
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiHeader {String} Authorization Token
 *
 * @apiSuccess {Object}  todoos List of all the todoos
 * @apiSuccess {string}  user The user's name or email.
 * @apiError (403) Error
 *
 */
app.get('/todoos', getUserEmailFromToken, (req, res) => {
    users
        .findOne({
            email: req.token
        })
        .then(findUser => {
            let userTodos = db.get(req.token);
            userTodos.find().then(d => {
                console.log('GETTING TODOOS');

                d.forEach(dd => {
                    if (dd.encrypt) {
                        dd.todo = decrypt(dd.todo);
                    }
                });

                console.log(d);

                res.status(200).json({
                    todoos: d,
                    user: findUser.name || req.token
                });
            });
        });
});

/**
 * @api {get} /* Fallback
 * @apiName GetStar
 * @apiGroup To2Do
 * @apiVersion 1.0.0
 *
 * @apiSuccess {string}  message Path not found...
 *
 */
app.get('*/*', (req, res) => {
    res.status(200).json({
        message: 'path not found...'
    });
});

//app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));
export default app;
