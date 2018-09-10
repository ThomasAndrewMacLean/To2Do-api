'use strict';

var OAuth2Client = require('google-auth-library').OAuth2Client;
var CLIENT_ID = '171417293160-02sar26733jopm7hvfb6e5cgk4mq21d7.apps.googleusercontent.com';
var client = new OAuth2Client(CLIENT_ID);
var jwt = require('jsonwebtoken');
var db = process.env.NODE_ENV === 'test' ? require('./../../mocks/monkey')('mon@ds018848.mlab.com:18848/to2dotest') : require('monk')('mongodb://dbreadwrite:' + process.env.MONGO_PW + '@ds018708.mlab.com:18708/to2so');
var users = db.get('users'); //k


function getUserEmailFromToken(req, res, next) {

    console.log(process.env.NODE_ENV);

    var bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(' ');
        var bearerToken = bearer[1];
        var bearerProvider = bearer[0];
        console.log(bearerToken);

        if (bearerProvider === 'Google') {
            client.verifyIdToken({
                idToken: bearerToken,
                audience: CLIENT_ID
            }).then(function (ticket) {
                req.token = ticket.getPayload().email;
                if (ticket.getPayload().email === 'thomas.maclean@gmail.com') {
                    req.admin = true;
                }
                next();
            }).catch(function (err) {
                console.log(err);

                res.status(403).json({
                    'err': 'faulty google token'
                });
            });
        } else {
            try {

                var authData = jwt.verify(bearerToken, process.env.JWT_SECRET); //, (err, authData) => {
                console.log(authData);

                var email = authData.user.email;
                console.log('EEEEemail');
                console.log(email);

                if (email === 'thomas.maclean@gmail.com') {
                    req.admin = true;
                }
                users.findOne({
                    email: email
                }).then(function (user) {
                    if (user.confirmed) {
                        console.log('USER IS CONFIRMED');

                        req.token = email;
                        next();
                    } else {
                        console.log('CONFIRMMMMM???');

                        res.status(403).json({
                            message: 'not yet confirmed!'
                        });
                    }
                }).catch(function (err) {
                    console.log('TIS NENERREUR');

                    console.log(err);
                    res.status(403).json(err);
                });
            } catch (error) {
                console.log('eRROOOOOORRRRR');
                console.log(error);
                res.status(403).json(error);
            }
        }
    } else {
        res.status(403).json({
            err: 'no authorization token!'
        });
    }
}

var fs = require('fs');
var fetch = require('node-fetch');
var mailOptions = {
    from: 'noreply', // sender address??
    to: 'thomas.maclean@gmail.com', // list of receivers
    subject: 'Subject of your email', // Subject line
    html: '<p>Your html here test</p>' // plain text body
};

var sendMail = function sendMail(mail, linky) {
    var data = fs.readFileSync('./public/mail.html', 'utf8');
    mailOptions.html = data.replace('{{{link}}}', linky);
    mailOptions.to = mail;
    console.log('sending mail ✉️');

    var body = {
        mailBody: mailOptions.html,
        mail: mail
    };
    fetch('https://p0dmber89l.execute-api.eu-west-1.amazonaws.com/dev/mail', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (res) {
        return res.json();
    }).then(function (json) {
        return console.log(json);
    });
};

var crypto = require('crypto');
var algorithm = 'aes-256-ctr';
var password = process.env.CRYPTO;

var encrypt = function encrypt(text) {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};
var decrypt = function decrypt(text) {
    console.log('DECRYPTING 🔬');

    console.log(text);

    try {
        var decipher = crypto.createDecipher(algorithm, password);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        console.log(dec);

        return dec;
    } catch (error) {
        console.log(error);
        console.log('IT WENT BAD, RETURNING ' + text);

        return text;
    }
};

var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('volleyball');
var bodyParser = require('body-parser');
var jwt$1 = require('jsonwebtoken');

var db$1 = process.env.NODE_ENV === 'test' ? require('./../mocks/monkey')('mongodb://testUser:' + process.env.MONGO_PW + '@ds018848.mlab.com:18848/to2dotest') : require('monk')('mongodb://dbreadwrite:' + process.env.MONGO_PW + '@ds018708.mlab.com:18708/to2so');
var cors = require('cors');

var app = express();
app.use(cors());

var bcrypt = require('bcrypt');
var saltRounds = 10;

app.use(cookieParser());
app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
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
app.get('/ping', function (req, res) {
    res.status(200).json({
        message: 'pong'
    });
});

var users$1 = db$1.get('users');

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
app.post('/signup', function (req, res) {
    var _req$body = req.body,
        password = _req$body.password,
        email = _req$body.email;

    console.log(email + ' start signup');

    users$1.findOne({
        email: email
    }).then(function (user) {
        if (user) {
            res.status(403).json({
                message: 'allready a user'
            });
        } else {
            bcrypt.hash(password, saltRounds, function (err, hash) {
                var newUser = {
                    email: email,
                    password: hash,
                    confirmed: false
                };
                console.log(newUser);

                users$1.insert(newUser).then(function (user) {
                    sendMail(email, req.protocol + '://' + req.get('host') + '/confirm/' + encrypt(email));
                    jwt$1.sign({
                        user: user
                    }, process.env.JWT_SECRET, function (err, token) {
                        res.status(200).json({
                            token: token
                        });
                    });
                });
            });
        }
    }).catch(function (err) {
        res.status(200).json({
            err: err
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
app.post('/login', function (req, res) {
    var _req$body2 = req.body,
        password = _req$body2.password,
        email = _req$body2.email;


    try {
        users$1.findOne({
            email: email
        }).then(function (user) {
            if (!user.password) {
                res.status(403).json({
                    message: 'social login?'
                });
                return;
            }

            bcrypt.compare(password, user.password, function (err, resp) {
                if (resp) {
                    jwt$1.sign({
                        user: user
                    }, process.env.JWT_SECRET, function (err, token) {
                        res.status(200).json({
                            token: token
                        });
                    });
                } else {
                    res.status(403).json({
                        message: 'wrong password'
                    });
                }
            });
        }).catch(function () {
            return res.status(403).json({
                message: 'wrong user'
            });
        });
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
app.get('/confirm/:encryption', function (req, res) {
    var encryption = req.params.encryption;
    var email = decrypt(encryption);

    console.log(encryption);
    users$1.update({
        email: email
    }, {
        $set: {
            confirmed: true
        }
    }).then(function () {
        var page = process.env.NODE_ENV === 'production' ? 'index' : 'index-dev';
        res.render(page);
    }).catch(function (err) {
        return res.status(403).json(err);
    });
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
app.post('/loginGoogle', getUserEmailFromToken, function (req, res) {
    var email = req.token;
    var name = req.body.name;
    users$1.findOne({
        email: email
    }).then(function (user) {
        if (user) {
            console.log('allready a user');
        } else {
            var newUser = {
                email: email,
                confirmed: true,
                name: name,
                google: true
            };
            console.log(newUser);

            users$1.insert(newUser);
        }
    }).catch(function (err) {
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
app.get('/admin/allusers', getUserEmailFromToken, function (req, res) {
    if (req.admin) {
        users$1.find().then(function (d) {
            res.status(200).json(d.map(function (u) {
                return {
                    email: u.email,
                    id: u._id,
                    confirmed: u.confirmed,
                    todoos: [],
                    created: new Date(parseInt(u._id.toString().substring(0, 8), 16) * 1000)
                };
            }));
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
app.get('/admin/isadmin', getUserEmailFromToken, function (req, res) {
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
app.post('/admin/todoForUser', getUserEmailFromToken, function (req, res) {
    if (req.admin) {
        var email = req.body.email;
        db$1.get(email).find().then(function (d) {
            return res.status(200).json(d);
        });
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
app.delete('/admin/deleteUser', getUserEmailFromToken, function (req, res) {
    var email = req.body.email;
    if (req.admin) {
        users$1.remove({
            email: email
        }).then(function () {
            var userTodos = db$1.get(email);
            userTodos.remove({}).then(function (d) {
                return res.status(200).json(d);
            });
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
app.post('/addtodo', getUserEmailFromToken, function (req, res) {
    var userTodos = db$1.get(req.token);
    userTodos.insert({
        todo: encrypt(req.body.todo),
        timeStamp: req.body.timeStamp,
        done: false,
        encrypt: true
    }).then(function (r) {
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
app.post('/toggleDone', getUserEmailFromToken, function (req, res) {
    var userTodos = db$1.get(req.token);
    userTodos.update({
        _id: req.body.id
    }, {
        $set: {
            done: req.body.done
        }
    }).then(function (d) {
        return res.status(200).json(d);
    });
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
app.delete('/deleteTodo', getUserEmailFromToken, function (req, res) {
    var userTodos = db$1.get(req.token);
    userTodos.remove({
        _id: req.body.id
    }).then(function (d) {
        return res.status(200).json(d);
    });
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
app.get('/todoos', getUserEmailFromToken, function (req, res) {
    users$1.findOne({
        email: req.token
    }).then(function (findUser) {
        var userTodos = db$1.get(req.token);
        userTodos.find().then(function (d) {
            console.log('GETTING TODOOS');

            d.forEach(function (dd) {
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
app.get('*/*', function (req, res) {
    res.status(200).json({
        message: 'path not found...'
    });
});

app.listen(process.env.PORT || 5001, function () {
  return console.log('All is ok, sit back and relax!');
});
//# sourceMappingURL=server_production.js.map
