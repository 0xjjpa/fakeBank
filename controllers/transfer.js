'use strict';
var parse = require('co-body');

require('../utils.js');



//POST /transfer/acc2acc -> Makes a funds transfer within customer's accounts. 
module.exports.acc2acc = function* acc2acc(next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {

        var accounts = yield this.app.db.accounts.find({
            "userId": this.request.scrap.userId
        }).exec();

        var transaction = {};
        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");
        if (!body.srcAcc || !body.dstAcc) this.throw(405, "Error, source or destination account ids missing");
        if (!body.amount || !body.amount < 0) this.throw(405, "Error, amount is missing");
        transaction.amount = parseFloat(body.amount);
        if (!body.currency) this.throw(405, "Error, currency is missing"); //TODO: check if given currency is allowed
        transaction.currency = body.currency;


        for (var i in accounts) {
            console.log(accounts[i].id, body.srcAcc);
            if (accounts[i].id === body.srcAcc) {
                transaction.sourceAccount = accounts[i];
            }
            if (accounts[i].id === body.dstAcc) {
                transaction.destinationAccount = accounts[i];
            }
        }
        if (!transaction.sourceAccount || !transaction.destinationAccount) this.throw(405, "Error, source or destination account ids are wrong");

        for (var i in accounts) {
            if (accounts[i].id === transaction.sourceAccount.id) {
                console.log('source was', transaction.sourceAccount.balance.native);
                transaction.sourceAccount.balance.native = parseFloat((parseFloat(transaction.sourceAccount.balance.native) - transaction.amount).toFixed(2));
                console.log('source is', transaction.sourceAccount.balance.native);
            }
            if (accounts[i].id === transaction.destinationAccount.id) {
                console.log('destination was', transaction.destinationAccount.balance.native);
                transaction.destinationAccount.balance.native = parseFloat((parseFloat(transaction.destinationAccount.balance.native) + transaction.amount).toFixed(2));
                console.log('destination is', transaction.destinationAccount.balance.native);
            }
        }



        var numChanged = yield this.app.db.accounts.update({
            "userId": this.request.scrap.userId,
            "id": transaction.sourceAccount.id
        }, transaction.sourceAccount, {});
        if (numChanged < 1) this.throw(405, "Error, could not change source account");

        numChanged = yield this.app.db.accounts.update({
            "userId": this.request.scrap.userId,
            "id": transaction.destinationAccount.id
        }, transaction.destinationAccount, {});
        if (numChanged < 1) this.throw(405, "Error, could not change destination account");

        var tempTran;
        transaction.id = GLOBAL.GetRandomSTR(12);
        transaction.txnType = '001'; //### hardcoded acc2acc transfer transaction type id
        transaction.typeName = 'Funds transfer'; //### hardcoded acc2acc transfer transaction type name
        transaction.DTSValue = new Date();
        transaction.DTSBooked = new Date();
        transaction.reference = GLOBAL.GetRandomSTR(15);
        tempTran = {
            "accountId": transaction.sourceAccount.id,
            "transactionId": transaction.id,
            "txnType": transaction.txnType,
            "typeName": transaction.typeName,
            "narrative": body.narrative || "Funds transfer from " + transaction.sourceAccount.name + " to " + transaction.destinationAccount.name,
            "debit": transaction.amount,
            "credit": 0,
            "amount": -transaction.amount,
            "currency": transaction.currency,
            "DTSValue": transaction.DTSValue,
            "DTSBooked": transaction.DTSBooked,
            "stateId": "100", //### hardcoded transaction state ID
            "transactionState": "RECONCILED", //### hardcoded transaction state
            "reference": transaction.reference,
            "labels": body.labels || []
        };

        numChanged = yield this.app.db.transactions.insert(tempTran);
        console.log('inserted source', numChanged);

        tempTran = {
            "accountId": transaction.destinationAccount.id,
            "transactionId": transaction.id,
            "txnType": transaction.txnType,
            "typeName": transaction.typeName,
            "narrative": body.narrative || "Funds transfer from " + transaction.sourceAccount.name + " to " + transaction.destinationAccount.name,
            "debit": 0,
            "credit": transaction.amount,
            "amount": transaction.amount,
            "currency": transaction.currency,
            "DTSValue": transaction.DTSValue,
            "DTSBooked": transaction.DTSBooked,
            "stateId": "100", //### hardcoded transaction state ID
            "transactionState": "RECONCILED", //### hardcoded transaction state
            "reference": transaction.reference,
            "labels": body.labels || []
        };

        numChanged = yield this.app.db.transactions.insert(tempTran);
        console.log('inserted destination', numChanged);

        resp.success = true;
        resp.text = 'Transfer within customers accounts has happened';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};
