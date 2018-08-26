const crypto = require('crypto');
const algorithm = 'aes-256-ctr';
const password = process.env.CRYPTO;

export let encrypt = text => {
    var cipher = crypto.createCipher(algorithm, password);
    var crypted = cipher.update(text, 'utf8', 'hex');
    crypted += cipher.final('hex');
    return crypted;
};
export let decrypt = text => {
    console.log('DECRYPTING 🔬');

    console.log(text);

    try {
        var decipher = crypto.createDecipher(algorithm, password);
        var dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    } catch (error) {
        console.log(error);
        return text;
    }
};

export default crypto;
