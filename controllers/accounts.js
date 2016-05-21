'use strict';
var parse = require('co-body');
//var co = require('co');

require('../utils.js');

GLOBAL.homeCurrency = "EUR"; //###




//GET /accounts/ -> List all the accounts in JSON.
module.exports.all = function* list(next) {
    if ('GET' != this.method) return yield next;

    //this.request.scrap.userId should have the user id which corresponds to the token 
    console.log("userId", this.request.scrap.userId);
    //find accounts which correspond to the userId
    var allaccounts = yield this.app.db.accounts.find({
        "userId": this.request.scrap.userId
    }).sort({
        isMain: -1,
        DTSOpened: 1
    }).exec(); //sort the accounts
    console.log(allaccounts[0].id);
    //return them all
    this.body = yield allaccounts;
};




//GET /accounts/:id -> Returns the account for the given ID
module.exports.fetch = function* fetch(id, next) {
    if ('GET' != this.method) return yield next;
    //find accounts which correspond to the userId
    console.log('hey', this.request.scrap.userId);
    var account = yield this.app.db.accounts.findOne({
        "userId": this.request.scrap.userId,
        "id": id
    }).exec();
    console.log('hey2');
    if (!account || account.id !== id) this.throw(404, JSON.stringify({
        error: true,
        text: "Error: can't find the account"
    }));
    this.body = yield account;
};




//
//module.exports.fetch2 = function* fetch(id, id2, next) {
//    if ('GET' != this.method) return yield next;
//    var found1 = false;
//    var found2 = false;
//    console.log(id, id2);
//    this.body = yield accounts;
//};

module.exports.add = function* add(data, next) {
    //adds a new account 
    if ('PUT' != this.method) return yield next;

    var resp = {
        success: false
    };

    try {
        var body = yield parse.json(this);
        if (!body || !body.type) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));
        body.balance = body.balance || {};

        //generates a string of random numbers (something which would look like an account number)
        var randomAccNum = 'AE';
        var allowedChars = '1234567890';
        var allowedCharsNum = allowedChars.length;
        for (var i = 0; i < 20; i++) {
            randomAccNum += allowedChars[parseInt(Math.random() * allowedCharsNum)];
        }

        var tempAcc = {
            "userId": body.userId || this.request.scrap.userId,
            "id": GLOBAL.GetRandomSTR(12),
            "name": body.name || body.type,
            "status": body.status || "active",
            "isActive": body.isActive || true,
            "type": body.type,
            "productTypeId": body.typeId,
            "num": body.num || randomAccNum,
            "DTSOpened": body.DTSOpened || new Date(),
            "isMain": body.isMain || false,
            "balance": {
                "native": body.balance.native || 0,
                "currency": body.balance.currency || GLOBAL.homeCurrency,
                "homecurrencybalance": body.balance.homecurrencybalance || 0,
                "available": body.balance.available || 0,
                "cleared": body.balance.cleared || 0,
                "frozen": body.balance.frozen || 0,
                "forward": body.balance.forward || 0,
                "interestearning": body.balance.interestearning || 0,
                "mincredit": body.balance.mincredit || 0,
                "arrears": body.balance.arrears || 0
            }
        }
        var inserted = yield this.app.db.accounts.insert(tempAcc);
        console.log('added the new account');
        if (!inserted || inserted < 1) {
            this.throw(405, "Error: Account could not be added.");
        }

    } catch (e) {
        console.log('error', e);
        this.throw(500, "Error: Account could not be added!");
    }

    resp.success = true;
    resp.text = 'Account has been added';
    this.body = JSON.stringify(resp);
};



//DELETE /accounts/:id -> Closes the given account. Remaining balance gets credited to other account if dstAcc is given, otherwise gets discarded
module.exports.close = function* close(id, next) {
    if ('DELETE' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");

        //make sure source account does exist.
        var srcAccount = yield this.app.db.accounts.findOne({
            "userId": this.request.scrap.userId,
            "id": id
        }).exec();

        if (!srcAccount || srcAccount.id !== id) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: can't find the account"
        }));
        if (srcAccount.balance.native < 0) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: can't close accounts with negative balance"
        }));


        if (!body.dstAcc) {
            var mainAccount = yield this.app.db.accounts.findOne({
                "userId": this.request.scrap.userId,
                "isMain": true
            }).exec();
            if (mainAccount) body.dstAcc = mainAccount.id;
        }

        //if account balance is positive, try to transfer it.
        if (body.dstAcc && srcAccount.balance.native > 0) {
            var dstAccount = yield this.app.db.accounts.findOne({
                "userId": this.request.scrap.userId,
                "id": body.dstAcc
            }).exec();
            if (!dstAccount) this.throw(404, JSON.stringify({
                error: true,
                text: "Error: can't find the destination account"
            }));

            var toBeTransferedAmount = srcAccount.balance.native;
            var toBeTransferedCurrency = srcAccount.balance.currency;
            var toBeCreditedCurrency = dstAccount.balance.currency;

            var toBeCreditedAmount = GLOBAL.fxrates.convertCurrency(
                toBeCreditedCurrency,
                toBeTransferedAmount,
                toBeTransferedCurrency); //convert transaction currency into the currency of the account

            //calculate the new balance
            dstAccount.balance.native += toBeCreditedAmount;

            //post the new balance

            var numChanged = yield this.app.db.accounts.update({
                "id": dstAccount.id
            }, dstAccount, {});
            if (!numChanged || numChanged !== 1) this.throw(404, JSON.stringify({
                error: true,
                text: "Error: failed updating balance of the destination account"
            }));

            srcAccount.name = srcAccount.name || "";
            var tempTran = {
                "accountId": dstAccount.id,
                "transactionId": GLOBAL.GetRandomSTR(12),
                "txnType": '0', //???### hardcoded internal maintenance tranasction
                "typeName": 'Balance transfer',
                "narrative": 'Balance transfer from closed ' + srcAccount.name + ' account',
                "debit": 0,
                "credit": toBeCreditedAmount,
                "amount": toBeTransferedAmount,
                "currency": toBeTransferedCurrency,
                "DTSValue": new Date(),
                "DTSBooked": new Date(),
                "stateId": "100",
                "transactionState": "RECONCILED",
                "reference": GLOBAL.GetRandomSTR(15),
                "labels": body.labels || []
            };
            var inserted = yield this.app.db.transactions.insert(tempTran);
            console.log('added the new transaction');
            if (!inserted || inserted < 1) {
                this.throw(405, "Error: Failed adding new transaction.");
            }

        }

        var numRemoved = yield this.app.db.accounts.remove({
            "id": id
        }, {});
        if (!numRemoved || numRemoved !== 1) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: failed closing the account"
        }));

        console.log('closed account', id);
        resp.success = true;
        resp.text = 'Account was successfully closed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};




//POST /accounts/:id -> Changes properties of a given account.
//send status, name, isMain parameters in the body
module.exports.modify = function* modify(id, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        var body = yield parse.json(this);
        if (!body || ((body.status) && (body.status !== "on") && (body.status !== "off"))) this.throw(405, "Error, status parameter missing ot has wrong value");


        var account = yield this.app.db.accounts.findOne({
            "userId": this.request.scrap.userId,
            "id": id
        }).exec();

        if (!account || account.id !== id) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: can't find the account"
        }));

        if (body.status === "on") {account.isActive = true; account.status = 'active'};
        if (body.status === "off") {account.isActive = false; account.status = 'blocked'};
        if (body.name) account.name = body.name; //TODO: sanitize input
        if (body.isMain === true || body.isMain === false) account.isMain = body.isMain;

        var numChanged = yield this.app.db.accounts.update({
            "id": id
        }, account, {});
        console.log('modified details of account', id);
        resp.success = true;
        resp.text = 'Account details have been changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};



//GET /accounts/:id/transactions -> List all the transactions of the account for the given ID
module.exports.transactions = function* fetch(id, dateStart, dateEnd, next) {
    if ('GET' != this.method) return yield next;
    dateStart = new Date(parseInt(dateStart)); //TODO: potentially problematic, redo
    dateEnd = new Date(parseInt(dateEnd));
    if (!isDate(dateStart)) this.throw(405, "Error start date.");
    if (!isDate(dateEnd)) this.throw(405, "Error end date.");

    var transactions = [];
    transactions = yield this.app.db.transactions.find({
        "accountId": id,
        DTSValue: {
            $gt: dateStart,
            $lt: dateEnd
        }
    }).exec();
    this.body = yield transactions;
};



//POST /accounts/transactions/:id -> Changes properties of a given transaction
module.exports.transactionModify = function* fetch(id, next) {

    //takes a labels array from request body, adds it into transaction details
    if ('POST' != this.method) return yield next;
    var resp = {};
    resp.success = false;
    try {
        var body = yield parse.json(this);
        if (!body || !body.labels || !isArray(body.labels)) this.throw(405, "Error: Not enough parameters in the request body.");

        var transaction = yield this.app.db.transactions.findOne({
            "transactionId": id
        }).exec();
        if (!transaction) this.throw(405, "Error: Can not find the transaction.");
        transaction.labels = body.labels;
        var numChanged = yield this.app.db.transactions.update({
            "transactionId": id
        }, transaction, {});

        resp.success = true;
        this.body = JSON.stringify(resp);
    } catch (e) {
        console.log(e);
        resp.text = "Error parsing JSON";
        this.throw(405, "Error parsing JSON.");
    }
};





module.exports.transactionAdd = function* add(id, next) {
    console.log('new transaction request');
    //adds a new transaction. Use only to import transactions generated outside. 
    if ('PUT' != this.method) return yield next;

    var resp = {
        success: false
    };


    try {
        //fetch all the accounts first
        var accounts = yield fetchAccounts(this.request.scrap.userId);

        //check if such account does exist
        var account = yield this.app.db.accounts.findOne({
            "userId": this.request.scrap.userId,
            "id": id
        }).exec();

        if (!account || account.id !== id) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: can't find the account"
        }));

        var body = yield parse.json(this); //parse request body
        if (!body || !body.txnType || !body.amount) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));

        var tempTran = {
            "accountId": id,
            "transactionId": GLOBAL.GetRandomSTR(12),
            "txnType": body.txnType,
            "typeName": body.typeName || body.txnType,
            "narrative": body.narrative || body.txnType,
            "debit": body.debit || (body.amount < 0 ? Math.abs(body.amount) : 0),
            "credit": body.credit || (body.amount > 0 ? body.amount : 0),
            "amount": body.amount,
            "currency": body.currency || GLOBAL.homeCurrency,
            "DTSValue": body.DTSValue || new Date(),
            "DTSBooked": body.DTSBooked || new Date(),
            "stateId": body.stateId || "100",
            "transactionState": body.transactionState || "RECONCILED",
            "reference": body.reference || GLOBAL.GetRandomSTR(15),
            "labels": body.labels || []
        };
        var inserted = yield this.app.db.transactions.insert(tempTran);
        console.log('added the new transaction', body.txnType);
        if (!inserted || inserted < 1) {
            this.throw(405, "Error: Transaction could not be added.");
        }

    } catch (e) {
        console.log('ERROR adding a new transaction', e);
        this.throw(500, "Error: Account could not be added!");
    }

    resp.success = true;
    resp.text = 'Account has been added';
    this.body = JSON.stringify(resp);
};







module.exports.head = function* () {
    return;
};

module.exports.options = function* () {
    this.body = "Allow: HEAD,GET,PUT,DELETE,OPTIONS";
};

module.exports.trace = function* () {
    this.body = "Smart! But you can't trace.";
};
