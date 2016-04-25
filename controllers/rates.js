'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');


//GET /rates/ -> List all the currency exchange rates in JSON.
module.exports.all = function* list(next) {
    if ('GET' != this.method) return yield next;

    var rates = yield this.app.db.cards.find({}).exec();

    //return them all
    this.body = yield rates;
};

//POST /rates/:src/:dst/ -> Adds or modifies a rate.
//requires "rate" in the request body
//accepts "buy", "sell", "isCommon" as well
//   {"src": "EUR",
//    "dst": "USD",
//    "rate": 0.82,
//    "buy": 0.8118,
//    "sell": 0.8282,
//    "DTSRefreshed": "2016-02-26T11:52:06.399Z",
//    "isCommon": true}
module.exports.modify = function* modify(src, dst, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        var body = yield parse.json(this);
        if (!body || !body.rate) this.throw(405, "Error, request body is empty");

        var numChanged = yield this.app.db.rates.update({
            "src": src,
            "dst": dst
        }, {
            "src": src,
            "dst": dst,
            "rate": body.rate,
            "buy": body.buy || body.rate,
            "sell": body.sell || body.rate,
            "DTSRefreshed": new Date(),
            "isCommon": body.isCommon || true
        }, {
            upsert: true
        });

        resp.success = true;
        resp.text = 'Card details have been changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};




