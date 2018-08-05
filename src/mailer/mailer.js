let fs = require('fs');
const fetch = require('node-fetch');
const mailOptions = {
    from: 'noreply', // sender address??
    to: 'thomas.maclean@gmail.com', // list of receivers
    subject: 'Subject of your email', // Subject line
    html: '<p>Your html here test</p>' // plain text body
};

export let sendMail = (mail, linky) => {
    let data = fs.readFileSync('./public/mail.html', 'utf8');
    mailOptions.html = data.replace('{{{link}}}', linky);
    mailOptions.to = mail;
    console.log('sending mail ✉️');

    var body = {
        mailBody: mailOptions.html,
        mail
    };
    fetch('https://p0dmber89l.execute-api.eu-west-1.amazonaws.com/dev/mail', {
        method: 'POST',
        body: JSON.stringify(body),
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(res => res.json())
        .then(json => console.log(json));
};