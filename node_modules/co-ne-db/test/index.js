'use strict';

var Db     = require('nedb');
var co     = require('co');
var expect = require('chai').expect;

var wrap   = require('..');

describe('wrap', function () {
  var db;
  beforeEach(function () {
    db = wrap(new Db());
  });

  describe('functions returning cursor', function () {
    it('should return wrapped cursor', function () {
      expect(db.find().exec()).to.be.a('function');
      expect(db.count().exec()).to.be.a('function');
      expect(db.findOne().exec()).to.be.a('function');
    });
  });

  describe('other functions', function () {
    it('should be thunkified', function () {
      expect(db.insert({a: 1})).to.be.a('function');
      expect(db.remove({a: 1})).to.be.a('function');
    });
  });

  it('should work', function () {
    return co(function *() {
      yield db.ensureIndex({fieldName: 'a'});

      var res = yield db.insert([{a: 1}, {a: 2}]);
      expect(res._id).not.be.null;

      var count = yield db.count().exec();
      expect(count).to.eq(2);

      var record = yield db.findOne({a: 1}).exec();
      expect(record._id).to.eq(res[0]._id);

      var records = yield db.find({a: 1}).exec();
      expect(records.length).to.eq(1);

      records = yield db.find().exec();
      expect(records.length).to.eq(2);

      yield db.removeIndex('a');
    });
  });
});
