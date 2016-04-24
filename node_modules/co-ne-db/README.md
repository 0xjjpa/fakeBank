# co-ne-db [![Build Status](https://travis-ci.org/claudetech/co-nedb.svg)](https://travis-ci.org/claudetech/co-nedb)

Sorry for the crappy name, `co-nedb` was already taken but
`find()` was returning a function instead of a cursor, making
it impossible to use properly.

## Installation

```sh
$ npm install co-ne-db
```

## Usage

Just call then function provided by this module on the `nedb` datastore.

```javascript
var wrap = require('co-ne-db');
var Datastore = require('nedb');
var db = new Datastore();
db = wrap(db);

co(function *() {
  yield db.insert({foo: 'bar'});
  var records = yield db.find({}).exec();
});
```

Note that `find`, `findOne` and `count` always return a cursor, to be able
to chain `sort`, `skip`, etc, so you should always call `exec` to execute your query.
