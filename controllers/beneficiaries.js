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
//{"name":"nick name", "txnType": "2", "accountNumber":"110001111", "defaultSourceAccountId":"111222", "amount":100. "currency":"EUR"}
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
        tempBen.defaultAmount = body.defaultAmount || 0;
        tempBen.defaultCurrency = body.defaultCurrency || GLOBAL.homeCurrency;
        tempBen.defaultSourceAccountId = body.defaultSourceAccountId || account.id;

        switch (tempBen.txnType) { //??? Hardcoded
            case '2':
                tempBen.typeName = "Intrabank";
                break;
            case '10':
                tempBen.typeName = "PayPal";
                break;
            case '30':
                tempBen.typeName = "Cheque";
                break;
            default:
                //
                this.throw(405, "Error, unknown transaction type");
        }

        //detect if given value is account number or a user ID
        console.log('will detect account number now');
        if (body.accountNumberOrUserId) {
            console.log('will now detect', body.accountNumberOrUserId);
            var temp = body.accountNumberOrUserId;
            body.accountNumberOrUserId = undefined;
            var beneficiaryAccount = yield this.app.db.accounts.findOne({
                "num": temp
            }).exec();
            if (beneficiaryAccount) {
                console.lof('account found', beneficiaryAccount);
                //account found.
                tempBen.accountNumber = beneficiaryAccount.num;
            } else {
                //temp is not an account number. May be it is user Id?
                var beneficiaryUser = yield this.app.db.users.findOne({
                    "userName": temp
                }).exec();
                if (beneficiaryUser) {
                    //user Id found. Now find his account id
                    var beneficiaryAccounts = yield this.app.db.accounts.find({
                        "userId": beneficiaryUser.userId
                    }).exec();
                    if (beneficiaryAccounts.length < 1) this.throw(405, "Error: Beneficiary has no accounts");
                    //find the main account
                    var found = false;
                    for (var i = 0; i < beneficiaryAccounts.length; i++) {
                        if (beneficiaryAccounts[i].isMain) tempBen.accountNumber = beneficiaryAccounts[i].num;
                    }
                    if (!found) tempBen.accountNumber = beneficiaryAccounts[0].num; //simply use the first one if no accounts with isMain flag.

                    //beneficiary's account was detected.
                    console.log(tempBen.accountNumber);
                } else {
                    //temp is not a user id, not an account number. Throw up
                    this.throw(405, "Error: Beneficiary account can not be found");
                }
            }
        }

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
module.exports.modifyBeneficiary = function* modifyBeneficiary(id, next) {
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
        console.log('bidddyyyyyyy', body);
        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                beneficiary[property] = body[property];
                console.log('111111111111111', body[property]);
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
