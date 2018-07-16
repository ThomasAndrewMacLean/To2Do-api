'use strict';

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('volleyball');
var bodyParser = require('body-parser');
var jwt = require('jsonwebtoken');
var OAuth2Client = require('google-auth-library').OAuth2Client;
var CLIENT_ID = '171417293160-02sar26733jopm7hvfb6e5cgk4mq21d7.apps.googleusercontent.com';
var client = new OAuth2Client(CLIENT_ID);
var db = process.env.NODE_ENV === 'test' ? require('monk')('mongodb://testUser:' + process.env.MONGO_PW + '@ds018848.mlab.com:18848/to2dotest') : require('monk')('mongodb://dbreadwrite:' + process.env.MONGO_PW + '@ds018708.mlab.com:18708/to2so');
var cors = require('cors');
// const getUserEmailFromToken = require('./auth/auth');

var app = express();
app.use(cors());

var bcrypt = require('bcrypt');
var saltRounds = 10;
//const crypto = require('./auth/crypt');
//const mailer = require('./mailer/mailer');
app.use(cookieParser());
app.use(logger);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');
app.use(express.static('public'));

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
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};

var mailOptions = {
    from: 'noreply', // sender address??
    to: 'thomas.maclean@gmail.com', // list of receivers
    subject: 'Subject of your email', // Subject line
    html: '<p>Your html here test</p>' // plain text body
};
var fs = require('fs');
var fetch = require('node-fetch');

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

var users = db.get('users');

app.post('/signup', function (req, res) {
    var _req$body = req.body,
        password = _req$body.password,
        email = _req$body.email;

    console.log(email + ' start signup');

    users.findOne({
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

                users.insert(newUser).then(function (user) {
                    sendMail(email, req.protocol + '://' + req.get('host') + '/confirm/' + encrypt(email));
                    jwt.sign({
                        user: user
                    }, process.env.JWT_SECRET, {
                        expiresIn: '300s'
                    }, function (err, token) {
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

app.post('/login', function (req, res) {
    var _req$body2 = req.body,
        password = _req$body2.password,
        email = _req$body2.email;

    users.findOne({
        email: email
    }).then(function (user) {
        bcrypt.compare(password, user.password, function (err, resp) {
            if (resp) {
                jwt.sign({
                    user: user
                }, process.env.JWT_SECRET, {
                    expiresIn: '3000s'
                }, function (err, token) {
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
});

app.get('/confirm/:encryption', function (req, res) {
    var encryption = req.params.encryption;
    var email = decrypt(encryption);

    users.update({
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

app.get('/allusers', getUserEmailFromToken, function (req, res) {
    if (req.admin) {
        users.find().then(function (d) {

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

app.get('/isadmin', getUserEmailFromToken, function (req, res) {
    res.status(200).json({
        admin: req.admin
    });
});

app.post('/todoForUser', getUserEmailFromToken, function (req, res) {
    if (req.admin) {
        var email = req.body.email;
        db.get(email).find().then(function (d) {
            return res.status(200).json(d);
        });
    } else {
        res.status(403);
    }
});

app.delete('/deleteUser', getUserEmailFromToken, function (req, res) {
    var email = req.body.email;
    if (req.admin) {
        users.remove({
            email: email
        }).then(function () {
            var userTodos = db.get(email);
            userTodos.remove({}).then(function (d) {
                return res.status(200).json(d);
            });
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

app.post('/addtodo', getUserEmailFromToken, function (req, res) {
    var userTodos = db.get(req.token);
    userTodos.insert({
        todo: req.body.todo,
        done: false
    }).then(function (r) {
        return res.status(200).json(r);
    });
});

app.post('/toggleDone', getUserEmailFromToken, function (req, res) {
    var userTodos = db.get(req.token);
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

app.delete('/deleteTodo', getUserEmailFromToken, function (req, res) {
    var userTodos = db.get(req.token);
    userTodos.remove({
        _id: req.body.id
    }).then(function (d) {
        return res.status(200).json(d);
    });
});

app.get('/todoos', getUserEmailFromToken, function (req, res) {
    var userTodos = db.get(req.token);
    userTodos.find().then(function (d) {
        res.status(200).json(d);
    });
});

app.get('/ping', function (req, res) {
    res.status(200).json({
        'message': 'pong'
    });
});

app.get('*/*', function (req, res) {
    res.status(200).json({
        'message': 'path not found...'
    });
});

function getUserEmailFromToken(req, res, next) {
    var bearerHeader = req.headers['authorization'];
    // check blacklisted

    if (typeof bearerHeader !== 'undefined') {
        var bearer = bearerHeader.split(' ');
        var bearerToken = bearer[1];
        var bearerProvider = bearer[0];

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
                var email = authData.user.email;

                if (email === 'thomas.maclean@gmail.com') {
                    console.log('USER IS ADMIN');
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
                        console.log('CONFIRM');

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
            err: 'no authorization token!!!'
        });
    }
}

app.listen(process.env.PORT || 5001, function () {
  return console.log('All is ok, sit back and relax!');
});
//# sourceMappingURL=server_production.js.map
