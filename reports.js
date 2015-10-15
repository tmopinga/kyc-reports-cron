var config = require('./config');
var approvers = require('./approvers')[config.approver];
var moment = require('moment');
var async = require('async');
var _ = require('lodash');
var fs = require('fs');
var MongoClient = require('mongodb').MongoClient;

module.exports = {
  create: function(type, status, now, cb) {
    async.auto({
      validate: function(callback) {
        if (_.indexOf(config.validTypes, type) < 0) {
          console.log('Error: Invalid type ' + type);
          callback(true);
        } if (_.indexOf(config.status, status) < 0) {
          console.log('Error: Invalid status ' + status);
          callback(true);
        } else {
          console.log('[√] validate');
          console.log('  type: ' + type);
          console.log('  status: ' + status);
          callback(null, true);
        }
      },
      getDate: ['validate', function(callback, results) {
        var lastDate = now.subtract(1, type);
        var _lastDate = lastDate.clone();
        var date = {
          from: lastDate.startOf(type).toDate(),
          to: _lastDate.endOf(type).toDate()
        };
        console.log('[√] getDate');
        console.log('  date: ' + JSON.stringify(date));
        callback(null, date);
      }],
      getData: ['getDate', function(callback, results) {
        var query = {
          'status': status,
          'updated_by.username': { $in: approvers },
          'created_at': { $gt: results.getDate.from, $lt: results.getDate.to }
        };
        MongoClient.connect(config.mongoUrl, function(err, db) {
          if (err) {
            console.log('Error: Database error ' + err);
            callback(true);
          } else {
            var collection = db.collection(config.collection);
            collection.find(query, config.fields).sort(config.sort).toArray(function(err, data) {
              if (err) {
                console.log('Error: Database error' + err);
                callback(true);
              } else {
                console.log('[√] getData');
                console.log('  status: ' + status);
                console.log('  approvers: ' + config.approver + ' (' + approvers.length + ')');
                console.log('  total: ' + data.length);
                callback(null, data);
              }
              db.close();
            });
          }
        });
      }],
      writeToFile: ['getData', function(callback, results) {
        var delimiter = config.delimiter;
        var title = 'KYC_' + status + '_' + type + '_' +
                    moment(results.getDate.from).format('YYYY-MM-DD') + config.file_extension;

        var stream = fs.createWriteStream(config.file_location + title);
        stream.once('open', function(fd) {
          stream.write(title + '\r\n\n');
          stream.write(config.labels.join(delimiter) + '\n');
          var row, name;
          async.each(results.getData, function(account, cb) {
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
              console.log('Error: Writing in file ' + err);
              callback(true);
            } else {
              console.log('[√] writeToFile');
              console.log('  File: ' + title);
              callback(null, config.file_location + title);
            }
            stream.end();
          });
        });
      }]
    }, function(err, results) {
      if (err)
        cb(err);
      else
        cb(null, results.writeToFile);
    });
  }
};
