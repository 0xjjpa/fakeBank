'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');


//GET /rates/ -> List all the currency exchange rates in JSON.
module.exports.all = function* list(next) {
    if ('GET' != this.method) return yield next;

    var rates = yield this.app.db.rates.find({}).exec();

    //return them all
    this.body = yield rates;
};

//POST /rates/:src/:dst/ -> Adds or modifies a rate.
//Requires "rate" in the request body
//Accepts "buy", "sell", "isCommon" as well
//   {"src": "EUR",
//    "dst": "USD",
//    "rate": 0.82,
//    "buy": 0.8118,
//    "sell": 0.8282,
//    "DTSRefreshed": "2016-02-26T11:52:06.399Z",
//    "isCommon": true}
module.exports.upsert = function* upsert(next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        var body = yield parse.json(this);
        if (!body || !body.rate || !body.src || !body.dst) this.throw(405, "Error, request body is empty");

        var numChanged = yield this.app.db.rates.update({
            "src": body.src,
            "dst": body.dst
        }, {
            "src": body.src,
            "dst": body.dst,
            "rate": body.rate,
            "buy": body.buy || body.rate,
            "sell": body.sell || body.rate,
            "DTSRefreshed": new Date(),
            "isCommon": body.isCommon || true
        }, {
            upsert: true
        });

        resp.success = true;
        resp.text = 'Rate has been successfully changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};


var co = require('co'); //!!!


module.exports.doImportRates = function* (app) {

    yield co(function* () {
        console.log('will try importing fx rates');
        GLOBAL.fxrates = GLOBAL.fxrates || {};

        var tempfxrates = yield app.db.rates.find({}).exec();

        while (GLOBAL.fxrates.pop()) {};
        for (var i = 0; i < tempfxrates.length; i++) {
            GLOBAL.fxrates.push(tempfxrates[i]);
        }

        return true;
    }).then(function (value) {
        console.log('done importing fx rates');
    }, function (err) {
        console.error(err.stack);
    });
}



GLOBAL.fxrates = GLOBAL.fxrates || [];
GLOBAL.fxrates.homecurrency = "EUR"; //???### hardcoded

GLOBAL.fxrates.convertCurrency = function (GivenCur1, GivenAmount, GivenCur2) {
    //returns how much is GivenAmount of GivenCur2 in GivenCur1
    function checkIfCurrencyIsKnown(GivenCurrency) {
        //returns false if given currency code is not present in the fxrates array
        for (var i = 0; i < GLOBAL.fxrates.length; i++) {
            if (GLOBAL.fxrates[i].src === GivenCurrency || GLOBAL.fxrates[i].dst === GivenCurrency) return true;
        }
        return false;
    }
    if (GivenCur1 === GivenCur2) return GivenAmount;
    if (GLOBAL.fxrates.length < 1) return 0;
    if (!checkIfCurrencyIsKnown(GivenCur1) || !checkIfCurrencyIsKnown(GivenCur2)) return -1;
    var Found = false,
        Result = 0;
    for (var i = 0; i < GLOBAL.fxrates.length; i++) {
        if ((GLOBAL.fxrates[i].src === GivenCur1) && (GLOBAL.fxrates[i].dst === GivenCur2)) {
            Result = GivenAmount * GLOBAL.fxrates[i].sell;
            Found = true;
        }
        if ((GLOBAL.fxrates[i].dst === GivenCur1) && (GLOBAL.fxrates[i].src === GivenCur2)) {
            Result = GivenAmount / GLOBAL.fxrates[i].buy;
            Found = true;
        }
    }
    if (Found) return Result;
    //No direct rate, so will need to do double conversion via fxrates.homecurrency
    var temp1 = GLOBAL.fxrates.convertCurrency(GLOBAL.fxrates.homecurrency, GivenAmount, GivenCur2);
    var temp2 = GLOBAL.fxrates.convertCurrency(GivenCur1, temp1, GLOBAL.fxrates.homecurrency);
    return temp2;
};



