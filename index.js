var moment = require('moment');
var async = require('async');
var _ = require('lodash');
var MongoClient = require('mongodb').MongoClient;
var config = require('./config');
var approvers = require('./approvers')[config.approver];

function generateReport(type, status, now) {
	async.waterfall([
    function validateType(callback) {
      if (_.indexOf(config.validTypes, type) < 0) {
        console.log('Error: Invalid type ' + type);
        callback('Invalid type ' + type);
      } else {
        console.log('Generating ' + status + ' ' + type + ' report.');
        callback(null, type);
      }  
    },

    function getDate(type, callback) {
      var lastDate = now.subtract(1, type);
      var _lastDate = lastDate.clone();
      var date = {
        from: lastDate.startOf(type).toDate(),
        to: _lastDate.endOf(type).toDate()
      };
      callback(null, date);
    },

    function getData(date, callback) {
      var query = {
        'status': status,
        'updated_by.username': { $in: approvers },
        'created_at': { $gt: date.from, $lt: date.to }
      };
      MongoClient.connect(config.mongoUrl, function(err, db) {
        if (err) {
          console.log('Error: Database error ' + err);
          callback('Cannot connect to the database.' + config.mongoUrl);
        } else {
          console.log('Connected to the database.');
          console.log('Query:');
          console.log(query.created_at);
          var collection = db.collection('account');
          collection.find(query, config.fields).sort(config.sort).toArray(function(err, data) {
            if (err) {
              console.log('Error: Database error' + err);
              callback('Database error ' + err);
            } else {
              console.log('Results Total: ' + data.length);
              callback(null, date, data);
            }
            db.close();
          });
        }
      });
    },

    function generateFile(date, data, callback) {
      var delimiter = config.delimiter;
      var title = config.file_location + 'KYC_' + status + '_' + type + '_' + moment(date.from).format('YYYY-MM-DD') + config.file_extension;
      var fs = require('fs');
      var stream = fs.createWriteStream(title);
      stream.once('open', function(fd) {
        stream.write(title + '\r\n\n');
        stream.write(config.labels.join(delimiter) + '\n');
        var row, name;
        async.each(data, function(account, cb) {
          row = [];
          name = '';
          name += account.first_name + ' ';
          name += account.middle_name ? account.middle_name : ' ';
          name += ' ' + account.last_name;
          row.push(name);
          row.push(account.reference_id);
          row.push(account.birth_date);
          row.push(account.created_at);
          row.push(account.updated_by.username);
          row.push(account.remarks);
          row.push(account.status);
          stream.write(row.join(delimiter) + '\n');
          cb();
        }, function(err) {
          if (err) {
            console.log('Error writing in file ' + err);
            callback('Error writing in file.');
          } else {
            console.log('Output file:' + title);
            callback(null, 'Done');
          }
        });a
      });
    }
  ], function(err, result) {
    console.log(result);
  });
};

var argv = process.argv.slice(2);
if(argv.length < 2) {
  console.log('Usage: node index.js <type> <status> <date>');
  console.log('types: DAY, WEEK, MONTH');
  console.log('status: approved, rejected');
  console.log('date is optional. Date to consider as current date (YYYY-MM-DD).');
} else {
  var type = argv[0];
  var status = argv[1];
  var now = argv[2] ? moment(argv[2]) : moment();
  generateReport(type.toUpperCase(), status, now);
}






