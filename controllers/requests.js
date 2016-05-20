'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');
var co = require('co'); //!!!



//PUT /requests/ -> Adds new generic request
module.exports.add = function* add(next) {
    if ('PUT' != this.method) return yield next;

    var resp = {};
    resp.success = false;




    try {
        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");
        if (!body.requestTypeId) this.throw(405, "Error, no request typeId in the request body");

        switch (body.requestTypeId) { //???### Hardcoded
            case 'New savings account':
//                    {             example body content
//                        "requestTypeId": "New savings account",
//                        "typeName": "SAVINGS",
//                        "typeId": "506",
//                        "currency": "EUR"
//                    }
                console.log('Will now open the account.', body);
                resp.success = false;
                resp.text = "error";

                if (!body.typeName || !body.typeId || !body.currency) this.throw(404, JSON.stringify({
                    error: true,
                    text: 'Not enough parameters in the request body' //no account type given
                }));

                var randomAccNum = 'AE';
                var allowedChars = '1234567890';
                var allowedCharsNum = allowedChars.length;
                for (var i = 0; i < 20; i++) {
                    randomAccNum += allowedChars[parseInt(Math.random() * allowedCharsNum)];
                }

                var tempAcc = {
                    "userId": this.request.scrap.userId, //userId of the user submitting the request
                    "id": GLOBAL.GetRandomSTR(12),
                    "name": body.name || body.typeName,
                    "status": "active",
                    "isActive": true,
                    "type": body.typeName,
                    "productTypeId": body.typeId,
                    "num": body.num || randomAccNum,
                    "DTSOpened": new Date(),
                    "isMain": false,
                    "balance": {
                        "native": 0,
                        "currency": body.currency,
                        "homecurrencybalance": 0,
                        "available": 0,
                        "cleared": 0,
                        "frozen": 0,
                        "forward": 0,
                        "interestearning": 0,
                        "mincredit": 0,
                        "arrears": 0
                    }
                }
                var inserted = yield this.app.db.accounts.insert(tempAcc);
                console.log('added the new account');
                if (!inserted || inserted < 1) {
                    this.throw(405, "Error: Account could not be added.");
                }
                resp.success = true;
                resp.text = "Account opened successfully";
                break;
            case 'XXXX':
                //process the request using body
                //populate resp with the result: resp.success = true; resp.text = 'Done processing';
                break;
            default:
                //
                this.throw(405, "Error, unknown generic request type");
        }

        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};
