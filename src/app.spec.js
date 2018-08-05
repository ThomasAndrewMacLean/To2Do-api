// SET babelrc preset to only 2015 to run some of the tests
// still errors because it doesn't stop after the tests have run
// plus most of the tests are failing.

const request = require('supertest');
import app from './app';
const jwt = require('jsonwebtoken');
import {
    sendMail
} from './mailer/mailer';
import {
    spy,
    stub
} from 'sinon';
const db = require('./../mocks/monkey')(`mongodb://testUser:${process.env.MONGO_PW}@ds018848.mlab.com:18848/to2dotest`);
import {
    decrypt,
    encrypt
} from './auth/crypt';
describe('app', () => {
    beforeAll(() => {
        //jest.unmock(mailer);
        // jest.unmock(crypto);
    });


    it('ping pong', (done) => {
        request(app)
            .get('/ping').expect(200).end(done);
    });
    it('fallthrouw', (done) => {
        request(app)
            .get('/Blablbaablbalbalblabababa')
            .expect(200, {
                message: 'path not found...'
            })
            .end(done);
    });

    it('should not get todoos without token', (done) => {
        request(app)
            .get('/todoos')
            .expect(403, {
                err: 'no authorization token!'
            })
            .end((err) => {
                if (err) throw done(err);
                done();
            });
    });

    it('fake JWT should error 403', (done) => {
        request(app)
            .get('/todoos')
            .set('Authorization', 'bearer blabla')
            .expect(403, {
                name: 'JsonWebTokenError',
                message: 'jwt malformed'
            })
            .end((err) => {
                if (err) throw done(err);
                done();
            });
    });

    it('fake googleToken should error 403', (done) => {
        request(app)
            .get('/todoos')
            .set('Authorization', 'Google blabla')
            .expect(403, {
                err: 'faulty google token'
            })
            .end((err) => {
                if (err) throw done(err);
                done();
            });
    });

    xit('mock', (done) => {
        let validate = jest.spyOn(jwt, 'verify');
        validate.mockReturnValue({
            user: {
                email: 'thomas.maclean@gmail.com'
            }
        });
        request(app)
            .get('/todoos')
            .set('Authorization', 'bearer blabla')
            .expect(200, [])
            .end((err) => {
                if (err) throw done(err);
                done();
            });
    });

    describe('flow', () => {
        let email;
        let users;
        const correctPassword = 'correctPassword';
        const wrongPassword = 'notCorrectPassword';
        beforeAll(() => {

            email = 'thomas.maclean@gmail.com';
            users = db.get('users');
            // users.remove({
            //     email: email
            // }).then(() => {
            //     let userTodos = db.get(email);
            //     userTodos.remove({});
            // });
        });
        afterAll(() => {
            email = 'thomas.maclean@gmail.com';
            users = db.get('users');
            // users.remove({
            //     email: email
            // }).then(() => {
            //     userTodos.remove({});
            //     let userTodos = db.get(email);
            // });
        });
        beforeEach(() => {
            let validate = jest.spyOn(jwt, 'verify');
            validate.mockReturnValue({
                user: {
                    email: 'thomas.maclean@gmail.com'
                }
            });
        });


        it('new user logs in, gets error wrong user', (done) => {
            request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(`{"password":"${correctPassword}","email":"${email}"}`)
                .expect(403, {
                    message: 'wrong user'
                })
                .end((err) => {
                    if (err) throw done(err);
                    done();
                });
        });

        fit('new user logs signs up, then gets sent a mail with encryption', (done) => {
            spy(sendMail);
            spy(encrypt);

            request(app)
                .post('/signup')
                .set('Content-Type', 'application/json')
                .send(`{"password":"${correctPassword}","email":"${email}"}`)
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(sendMail).toHaveBeenCalled();
                    expect(encrypt).toHaveBeenCalledWith(email);
                    if (err) throw done(err);
                    users.findOne({
                        email
                    }).then(u => {
                        expect(u.email).toBe(email);
                        expect(u.confirmed).toBeFalsy();
                        done();
                    });

                });
        });

        it('new user signs up twice', (done) => {
            spy(sendMail);
            spy(encrypt);
            request(app)
                .post('/signup')
                .set('Content-Type', 'application/json')
                .send(`{"password":"${correctPassword}","email":"${email}"}`)
                .expect(403, {
                    message: 'allready a user'
                })
                .end((err) => {
                    expect(sendMail).not.toHaveBeenCalled();
                    if (err) throw done(err);
                    users.findOne({
                        email
                    }).then(u => {
                        expect(u.email).toBe(email);
                        expect(u.confirmed).toBeFalsy();
                        done();
                    });
                });
        });

        it('new user logsin with correct password', (done) => {
            request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(`{"password":"${correctPassword}","email":"${email}"}`)
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user logsin with wrong password', (done) => {
            request(app)
                .post('/login')
                .set('Content-Type', 'application/json')
                .send(`{"password":"${wrongPassword}","email":"${email}"}`)
                .expect(403, {
                    message: 'wrong password'
                })
                .end((err) => {
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user posts todo before confirming', (done) => {
            request(app)
                .post('/addtodo')

                .set('Content-Type', 'application/json')
                .send('{"todo":"todoo1"}')
                .end((err, res) => {
                    expect(res.status).toBe(403);
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user clicks on confirm link, confirmed is now true', (done) => {
            //jest.mock(app, 'decrypt', () => email);
            //let decryptStub = spy(decrypt);
            //   decryptStub.returns(email);
            //  x.onFirstCall().returns(email);
            request(app)
                .get('/confirm/blablabla')
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    expect(decrypt).toHaveBeenCalled();
                    expect(decrypt).toHaveBeenCalledWith('blablabla');
                    if (err) throw done(err);
                    users.findOne({
                        email
                    }).then(u => {
                        expect(u.email).toBe(email);
                        expect(u.confirmed).toBeTruthy();
                        done();
                    });

                });
        });

        it('new user gets his todoos', (done) => {
            request(app)
                .get('/todoos')
                .set('Authorization', 'bearer blabla')
                .end((err, res) => {
                    expect(res.body).toHaveLength(0);
                    expect(res.status).toBe(200);
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user posts todo after confirming', (done) => {
            request(app)
                .post('/addtodo')
                .set('Authorization', 'bearer blabla')

                .set('Content-Type', 'application/json')
                .send('{"todo":"todoo1"}')
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user gets his todoos d', (done) => {
            request(app)
                .get('/todoos')
                .set('Authorization', 'bearer blabla')
                .end((err, res) => {
                    expect(res.body).toHaveLength(1);
                    expect(res.status).toBe(200);
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user posts a second todo after confirming', (done) => {
            request(app)
                .post('/addtodo')
                .set('Authorization', 'bearer blabla')

                .set('Content-Type', 'application/json')
                .send('{"todo":"todoo2"}')
                .end((err, res) => {
                    expect(res.status).toBe(200);
                    if (err) throw done(err);
                    done();
                });
        });

        it('new user gets his todoos after 2 posts', (done) => {
            request(app)
                .get('/todoos')
                .set('Authorization', 'bearer blabla')
                .end((err, res) => {
                    expect(res.body).toHaveLength(2);
                    expect(res.status).toBe(200);
                    if (err) throw done(err);
                    done();
                });
        });
    });
});