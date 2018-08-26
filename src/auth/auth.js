const OAuth2Client = require('google-auth-library').OAuth2Client;
const CLIENT_ID = '171417293160-02sar26733jopm7hvfb6e5cgk4mq21d7.apps.googleusercontent.com';
const client = new OAuth2Client(CLIENT_ID);
const jwt = require('jsonwebtoken');
const db = process.env.NODE_ENV === 'test' ?
    require('./../../mocks/monkey')('mon@ds018848.mlab.com:18848/to2dotest') :
    require('monk')(`mongodb://dbreadwrite:${process.env.MONGO_PW}@ds018708.mlab.com:18708/to2so`);
let users = db.get('users'); //k



export function getUserEmailFromToken(req, res, next) {

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
                console.log(authData);

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