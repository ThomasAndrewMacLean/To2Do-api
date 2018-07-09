if (process.env.NODE_ENV !== 'production') {
    require('dotenv').load();
}
const express = require('express');
var cookieParser = require('cookie-parser');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const OAuth2Client = require('google-auth-library').OAuth2Client;
const CLIENT_ID = '171417293160-02sar26733jopm7hvfb6e5cgk4mq21d7.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);
const db = process.env.NODE_ENV === 'test' ?
    require('monk')(`mongodb://testUser:${process.env.MONGO_PW}@ds018848.mlab.com:18848/to2dotest`) :
    require('monk')(`mongodb://dbreadwrite:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`);
const cors = require('cors');
// const getUserEmailFromToken = require('./auth/auth');

const app = express();
app.use(cors());

const bcrypt = require('bcrypt');
const saltRounds = 10;
//const crypto = require('./auth/crypt');
//const mailer = require('./mailer/mailer');
app.use(cookieParser());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.set('view engine', 'ejs');

const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const password = process.env.CRYPTO;
const encrypt = (text) => {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;

};
const decrypt = (text) => {
    var decipher = crypto.createDecipher(algorithm, password);
    var dec = decipher.update(text, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
};

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'thomas.maclean.mailer@gmail.com',
        pass: 'eynk2g>v'
    }
});
const mailOptions = {
    from: 'noreply', // sender address??
    to: 'thomas.maclean@gmail.com', // list of receivers
    subject: 'Subject of your email', // Subject line
    html: '<p>Your html here test</p>' // plain text body
};

const sendMail = (mail, linky) => {
    mailOptions.html = linky;
    mailOptions.to = mail;
    console.log('sending mail ✉️');

    transporter.sendMail(mailOptions, function (err, info) {
        if (err)
            console.log(err);
        else
            console.log(info);
    });
}

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
                    sendMail(email, req.protocol + '://' + req.get('host') + '/confirm/' + encrypt(email));
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
    const email = decrypt(encryption);

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

function getUserEmailFromToken(req, res, next) {

    console.log(process.env.NODE_ENV);


    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        const bearerToken = bearer[1];
        const bearerProvider = bearer[0];
        console.log(bearerToken);

        if (bearerProvider === 'Google') {
            client.verifyIdToken({
                idToken: bearerToken,
                audience: CLIENT_ID
            }).then(ticket => {
                req.token = ticket.getPayload().email;
                if (ticket.getPayload().email === 'thomas.maclean@gmail.com') {
                    req.admin = true;
                }
                next();
            }).catch(err => {
                console.log(err);

                res.status(403).json({
                    'err': 'faulty google token'
                });
            });
        } else {
            try {
                let authData = jwt.verify(bearerToken, process.env.JWT_SECRET); //, (err, authData) => {

                const email = authData.user.email;
                console.log('EEEEemail');
                console.log(email);

                if (email === 'thomas.maclean@gmail.com') {
                    req.admin = true;
                }
                users.findOne({
                    email
                }).then(user => {
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
                }).catch(err => {
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

app.listen(process.env.PORT || 5001, () => console.log('All is ok, sit back and relax!'));
//module.exports = app;