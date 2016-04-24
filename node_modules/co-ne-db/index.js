'use strict';

var thunkify = require('thunkify');

var thunkifyCursor = function (db, funcName) {
  var original = db[funcName];
  db[funcName] = function () {
    var cursor = original.apply(db, arguments);
    cursor.exec = thunkify(cursor.exec);
    return cursor;
  };
};

var cursorFunctions = ['find', 'findOne', 'count'];

var functions = [
  'update',
  'insert',
  'remove',
  'ensureIndex',
  'removeIndex'
];

module.exports = function (db) {
  cursorFunctions.forEach(function (funcName) {
    thunkifyCursor(db, funcName);
  });

  functions.forEach(function (funcName) {
    db[funcName] = thunkify(db[funcName]);
  });

  return db;
};
