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

                transaction.amountInSourceCurrency = GLOBAL.fxrates.convertCurrency(
                    transaction.sourceAccount.balance.currency,
                    transaction.amount,
                    transaction.currency); //convert transaction currency into the currency of the account
                transaction.amountInSourceCurrency = parseFloat((parseFloat(transaction.amountInSourceCurrency).toFixed(2)));
                transaction.sourceAccount.balance.native = parseFloat((parseFloat(transaction.sourceAccount.balance.native) - transaction.amountInSourceCurrency).toFixed(2)); //account balance minus transaction amount in account's currency and drop extra decimals
                console.log('source now is', transaction.sourceAccount.balance.native);
            }
            if (accounts[i].id === transaction.destinationAccount.id) {
                console.log('destination was', transaction.destinationAccount.balance.native);
                transaction.amountInDestinationCurrency = GLOBAL.fxrates.convertCurrency(
                    transaction.destinationAccount.balance.currency,
                    transaction.amount,
                    transaction.currency); //convert transaction currency into the currency of the account
                transaction.amountInDestinationCurrency = parseFloat((parseFloat(transaction.amountInDestinationCurrency).toFixed(2)));
                transaction.destinationAccount.balance.native = parseFloat((parseFloat(transaction.destinationAccount.balance.native) + transaction.amountInDestinationCurrency).toFixed(2));
                console.log('destination now is', transaction.destinationAccount.balance.native);
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
        transaction.txnType = '1'; //### hardcoded acc2acc transfer transaction type id
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
            "debit": transaction.amountInSourceCurrency,
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
            "credit": transaction.amountInDestinationCurrency,
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


//POST /transfer/acc2ben/:beneficiaryId -> Makes a funds transfer to a pre-defined beneficiary
//{ "srcAcc":"1001", "amount": 10, "currency": "EUR"}
module.exports.acc2ben = function* acc2ben(beneficiaryId, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        var transaction = {};
        var tempTran; //temp transaction record which will be written to db_transactions table
        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");
        if (!body.amount || !body.amount < 0) this.throw(405, "Error, amount is missing");
        transaction.amount = parseFloat(body.amount);
        if (!body.currency) this.throw(405, "Error, currency is missing"); //TODO: check restrictions
        transaction.currency = body.currency;


        transaction.id = GLOBAL.GetRandomSTR(12);
        transaction.DTSValue = new Date();
        transaction.DTSBooked = new Date();
        transaction.reference = GLOBAL.GetRandomSTR(15);


        transaction.beneficiary = yield this.app.db.beneficiaries.findOne({
            "userId": this.request.scrap.userId,
            "beneficiaryId": beneficiaryId
        }).exec();

        console.log('Found beneficiary', transaction.beneficiary.name);
        if (!transaction.beneficiary ||
            !transaction.beneficiary.beneficiaryId ||
            !transaction.beneficiary.txnType) this.throw(405, "Error, beneficiary id is wrong");

        if (!body.srcAcc && !transaction.beneficiary.defaultSourceAccountId) this.throw(405, "Error, source account id missing");
        transaction.sourceAccount = yield this.app.db.accounts.findOne({
            "userId": this.request.scrap.userId,
            "id": body.srcAcc || transaction.beneficiary.defaultSourceAccountId
        }).exec();

        console.log('going to debit', transaction.sourceAccount.num);

        var tempOldBalance = transaction.sourceAccount.balance.native;


        transaction.amountInSourceCurrency = GLOBAL.fxrates.convertCurrency(
            transaction.sourceAccount.balance.currency,
            transaction.amount,
            transaction.currency); //convert transaction currency into the currency of the account
        transaction.amountInSourceCurrency = parseFloat((parseFloat(transaction.amountInSourceCurrency).toFixed(2)));

        transaction.sourceAccount.balance.native = parseFloat((parseFloat(transaction.sourceAccount.balance.native) - transaction.amountInSourceCurrency).toFixed(2)); //account balance minus transaction amount in account's currency and drop extra decimals

        console.log('source balance was',
            tempOldBalance,
            transaction.sourceAccount.balance.currency,
            'got debit',
            transaction.amount,
            transaction.currency,
            'which is',
            transaction.amountInSourceCurrency,
            transaction.sourceAccount.balance.currency,
            'so the final balance is',
            transaction.sourceAccount.balance.native,
            transaction.sourceAccount.balance.currency);



        var sender = yield this.app.db.userDetails.findOne({
            "userId": this.request.scrap.userId
        }).exec();


        //---------------------------------
        console.log(transaction.beneficiary.txnType);
        switch (transaction.beneficiary.txnType) {
            case '2': // intrabank funds transfer
                console.log('will do intrabank transfer');
                transaction.txnType = transaction.beneficiary.txnType;
                transaction.typeName = 'Funds transfer intrabank'; ///###??? hardcoded
                if (!transaction.beneficiary.accountNumber) this.throw(405, "Error, beneficiary has no account id");
                if (!transaction.beneficiary.userId) this.throw(405, "Error, beneficiary has no user id");

                transaction.destinationAccount = yield this.app.db.accounts.findOne({
                    "num": transaction.beneficiary.accountNumber
                }).exec();

                if (!transaction.destinationAccount || !transaction.destinationAccount.id) this.throw(405, "Error, destination account id is wrong");

                var tempOldBalance = transaction.sourceAccount.balance.native;


                transaction.amountInDestinationCurrency = GLOBAL.fxrates.convertCurrency(
                    transaction.destinationAccount.balance.currency,
                    transaction.amount,
                    transaction.currency); //convert transaction currency into the currency of the account
                transaction.amountInDestinationCurrency = parseFloat((parseFloat(transaction.amountInDestinationCurrency).toFixed(2)));

                transaction.destinationAccount.balance.native = parseFloat((parseFloat(transaction.destinationAccount.balance.native) - transaction.amountInDestinationCurrency).toFixed(2)); //account balance minus transaction amount in account's currency and drop extra decimals

                console.log('destination balance was',
                    tempOldBalance,
                    transaction.destinationAccount.balance.currency,
                    'got credit',
                    transaction.amount,
                    transaction.currency,
                    'which is',
                    transaction.amountInDestinationCurrency,
                    transaction.destinationAccount.balance.currency,
                    'so the final balance is',
                    transaction.destinationAccount.balance.native,
                    transaction.destinationAccount.balance.currency);

                var numChanged = yield this.app.db.accounts.update({
                    "id": transaction.destinationAccount.id
                }, transaction.destinationAccount, {});
                if (numChanged < 1) this.throw(405, "Error, could not credit destination account");

                //console.log('receiver user id', transaction.destinationAccount.userId);
                var receiver = yield this.app.db.userDetails.findOne({
                    "userId": transaction.destinationAccount.userId
                }).exec();
                //
                //console.log('sender', sender.names.join(" "), 'receiver', receiver.names.join(" "));
                tempTran = {
                    "accountId": transaction.destinationAccount.id,
                    "transactionId": transaction.id,
                    "txnType": transaction.txnType,
                    "typeName": transaction.typeName,
                    "narrative": body.narrativeDestination || "Funds transfer from " + sender.names.join(" "),
                    "debit": 0,
                    "credit": transaction.amountInDestinationCurrency,
                    "amount": transaction.amount,
                    "currency": transaction.currency,
                    "DTSValue": transaction.DTSValue,
                    "DTSBooked": transaction.DTSBooked,
                    "stateId": "100", //### hardcoded transaction state ID
                    "transactionState": "RECONCILED", //### hardcoded transaction state
                    "reference": transaction.reference,
                    "labels": []
                };

                numChanged = yield this.app.db.transactions.insert(tempTran);
                //console.log('inserted destination transaction', numChanged);

                transaction.narrative = "Funds transfer to " + receiver.names.join(" ");

                break;
                //case n:
                // // add more transaction types here
                // break;
            case "10":
                console.log('PayPal funds transfer');
                transaction.txnType = transaction.beneficiary.txnType;
                transaction.typeName = 'Funds transfer to PayPal was simulated'; ///###??? hardcoded
                if (!transaction.beneficiary.paypalId) this.throw(405, "Error, beneficiary has no PayPal ID");

                transaction.narrative = "PayPal transfer to " + transaction.beneficiary.name;

                break;
            case "20":
                console.log('Cheque mailout');
                transaction.txnType = transaction.beneficiary.txnType;
                transaction.typeName = 'Cheque mailed'; ///###??? hardcoded
                if (!transaction.beneficiary.country ||
                    !transaction.beneficiary.city ||
                    !transaction.beneficiary.phone ||
                    (!transaction.beneficiary.addressLine1 && !transaction.beneficiary.postalCode)
                   ) this.throw(405, "Error, beneficiary has no address, cheque can not be mailed");

                transaction.narrative = "Cheque mailed to " + transaction.beneficiary.name;

                break;
            default:
                //
                this.throw(405, "Error, unknown transaction type");
        }
        //1753


        //now write the new balance of the source account, debit side
        var numChanged = yield this.app.db.accounts.update({
            "userId": this.request.scrap.userId,
            "id": transaction.sourceAccount.id
        }, transaction.sourceAccount, {});
        if (numChanged < 1) this.throw(405, "Error, could not change source account");


        tempTran = {
            "accountId": transaction.sourceAccount.id,
            "transactionId": transaction.id,
            "txnType": transaction.txnType,
            "typeName": transaction.typeName,
            "narrative": body.narrative || transaction.narrative || 'Funds transfer to beneficiary',
            "debit": transaction.amountInSourceCurrency,
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

        resp.success = true;
        resp.text = 'Transfer to the beneficiary was successful';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};
