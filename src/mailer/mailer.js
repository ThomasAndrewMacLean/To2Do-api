const nodemailer = require('nodemailer');
let htmlMail = require('./../to2doSignUpMail/mail.html');

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
module.exports = {
    sendMail: (mail, linky) => {
        mailOptions.html = htmlMail.replace('{{{link}}}', linky);
        mailOptions.to = mail;
        console.log('sending mail ✉️');

        transporter.sendMail(mailOptions, function (err, info) {
            if (err)
                console.log(err);
            else
                console.log(info);
        });
    }
};