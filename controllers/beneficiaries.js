'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');


//GET /beneficiaries/ -> List all the beneficiaries in JSON.
module.exports.all = function* list(next) {
    if ('GET' != this.method) return yield next;

    //this.request.scrap.userId should have the user id which corresponds to the token 

    //find accounts which correspond to the userId
    var beneficiaries = yield this.app.db.beneficiaries.find({
        "userId": this.request.scrap.userId
    }).exec();

    //return them all
    this.body = yield beneficiaries;
};


//GET /beneficiaries/:id -> Returns the beneficiary of the given ID
module.exports.fetch = function* fetch(id, next) {
    if ('GET' != this.method) return yield next;

    var beneficiary = yield this.app.db.beneficiaries.findOne({
        "userId": this.request.scrap.userId,
        "beneficiaryId": id
    }).exec();

    if (!beneficiary || beneficiary.beneficiaryId !== id) this.throw(404, JSON.stringify({
        error: true,
        text: "Error: can't find the beneficiary"
    }));
    this.body = yield beneficiary;
};

//PUT
module.exports.add = function* add(data, next) {
    //adds a new beneficiary 
    if ('PUT' != this.method) return yield next;

    var resp = {
        success: false
    };

    try {
        var body = yield parse.json(this);
        if (!body || !body.name || !body.txnType) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));

        var account = yield this.app.db.accounts.findOne({
            "userId": this.request.scrap.userId,
            "isMain": true //default account
        }).exec();

        if (!account.id) {
            var accounts = yield this.app.db.accounts.find({
                "userId": this.request.scrap.userId // get all accounts ...
            }).exec();
            account = account[0]; // ... and take first one. 
        }

        var tempBen = {};
        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                tempBen[property] = body[property];
            }
        }

        tempBen.userId = body.userId || this.request.scrap.userId;
        tempBen.beneficiaryId = GLOBAL.GetRandomSTR(12);
        tempBen.status = body.status || "active";
        tempBen.isActive = body.isActive || true;
        tempBen.typeName = body.typeName || "Local transfer";
        tempBen.txnType = body.txnType || "2";
        tempBen.accountNumber = body.accountNumber || 'AE' + GetRandomNumbers(20);
        tempBen.DTSCreated = body.DTSCreated || new Date();
        tempBen.DTSModified = body.DTSModified || new Date();
        tempBen.defaultAmount = body.amount || 0;
        tempBen.defaultCurrency = body.currency || GLOBAL.homeCurrency;
        tempBen.defaultSourceAccountId = body.defaultSourceAccountId || account.id;

        var inserted = yield this.app.db.beneficiaries.insert(tempBen);
        console.log('added the new beneficiary');
        if (!inserted || inserted < 1) {
            this.throw(405, "Error: Beneficiary could not be added.");
        }
    } catch (e) {
        console.log('error', e);
        this.throw(500, "Error: beneficiary could not be added!");
    }

    resp.success = true;
    resp.text = 'Beneficiary has been added';
    this.body = JSON.stringify(resp);
};



//POST /beneficiaries/:id -> Changes properties of a given beneficiary. 
module.exports.modify = function* modify(id, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        //find beneficiaries which correspond to the userId
        var beneficiary = yield this.app.db.beneficiaries.findOne({
            "userId": this.request.scrap.userId,
            "beneficiaryId": id
        }).exec();

        if (!beneficiary.beneficiaryId) this.throw(404, JSON.stringify({
            error: true,
            text: 'Beneficiary not found'
        }));

        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");
        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                beneficiary[property] = body[property];
            }
        }

        var numChanged = yield this.app.db.beneficiaries.update({
            "beneficiaryId": id
        }, beneficiary, {});

        resp.success = true;
        resp.text = 'Beneficiary details have been changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};


//DELETE /beneficiaries/:id -> Deletes given beneficiary. 
module.exports.deleteBeneficiary = function* deleteBeneficiary(id, next) {
    if ('DELETE' != this.method) return yield next;
    var resp = {};
    try {
        var beneficiary = yield this.app.db.beneficiaries.findOne({
            "userId": this.request.scrap.userId,
            "beneficiaryId": id
        }).exec();

        if (!beneficiary.beneficiaryId) this.throw(404, JSON.stringify({
            error: true,
            text: 'Beneficiary not found'
        }));

        var numChanged = yield this.app.db.beneficiaries.remove({
            "beneficiaryId": id
        }, {});

        resp.success = true;
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error deleting beneficiary";
        console.log(e);
        this.throw(405, "Error deleting beneficiary.");
    }
}
