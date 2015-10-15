var moment = require('moment');
var async = require('async');
var schedule = require('node-schedule');
var MongoClient = require('mongodb').MongoClient;
var _ = require('lodash');
var config = require('./config');
var reports = require('./reports');
var utils = require('./utils');

function generateReport(type, now) {
  var files = [];
  async.each(config.status, function(status, cb) {
    reports.create(type.toUpperCase(), status, now.clone(), function(err, filename) {
      if (err) {
        cb(err);
      } else {
        files.push({ path: filename});
        cb();
      }
    });
  }, function(err) {
    if (err) {
      console.log(err);
    } else {
      var subject = 'Paymaya ' + config.approver + ' KYC Operations Reports';
      var content = {
        message: now.toString(),
        attachments: files
      }
      utils.sendMail(config.email.sender, config.email.receipient, subject, content, function(err, options) {
        if (err) {
          console.log(err);
        } else {
          console.log('[√] Send Email');
          console.log(options);
        }
      });
    }
  });
}

function printUsage() {
  console.log('Usage: node index.js <mode> <type> <date>');
  console.log('mode: cron, command');
  console.log('types: ' + config.validTypes);
  console.log('date is optional. Specify which date is to consider as current date (YYYY-MM-DD).');
}

var argv = process.argv.slice(2);
if (argv.length < 1) {
  printUsage();
} else {
  var mode = argv[0];

  if (mode === 'cron') {
    var job = {};
    _.forEach(config.job, function(value, key) {
      console.log('Creating job:' + key + ' - ' +  value);
      job[key] = schedule.scheduleJob(value, function() {
        console.log('----' + key + '----' + moment().toDate() + '-------');
        generateReport(key, moment());
      }
      );
    });
  } else if (mode === 'command') {
    var type = argv[1];
    var now = argv[3] ? moment(argv[3]) : moment();
    if (!type)
      printUsage();
    else
      generateReport(type, now);
  } else {
    printUsage();
  }
}






