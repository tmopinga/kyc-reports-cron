var nodemailer = require('nodemailer');
var sendmail = require('nodemailer-sendmail-transport');
var smtp = require('nodemailer-smtp-transport');
var config = require('./config');

module.exports = {

  sendMail: function(sender, recipient, subject, content, callback) {
    var ACTION = '[send]';

    var transport = (config.email.transport === 'sendmail')
      ? nodemailer.createTransport(sendmail())
      : nodemailer.createTransport(smtp({
          host: config.email.host,
          port: config.email.port,
          tls:config.email.tls
        }));

    var mail_options = {
      from: sender,
      to: recipient,
      subject: subject,
      html: content.message,
      text: content.message,
      attachments: content.attachments
    };

    transport.sendMail(mail_options, function (error, response) {
      if (error) {
        console.log('Error: Message sending failed ' + error);
        return callback(error);
      } else {
        console.log('Message sending successful');
        return callback(null, mail_options);
      }
    });
  }
}