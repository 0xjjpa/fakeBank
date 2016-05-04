//Imports transactions generated

//Takes pre-generated transactions from db_future and puts them into db_transactions.
//Account balance does change.
//
var co = require('co'); //!!!


module.exports.doImport = function* (app) {

    yield co(function* () {
        console.log('will try importing new transactions');
        var fxrates = yield app.db.rates.find({}).exec();
        fxrates.homecurrency = "EUR"; //???### hardcoded

        fxrates.convertCurrency = function (GivenCur1, GivenAmount, GivenCur2) {
            function checkIfCurrencyIsKnown(GivenCurrency) {
                //returns false if given currency code is not present in the fxrates array
                for (var i = 0; i < fxrates.length; i++) {
                    if (fxrates[i].src === GivenCurrency || fxrates[i].dst === GivenCurrency) return true;
                }
                return false;
            }
            if (GivenCur1 === GivenCur2) return GivenAmount;
            if (fxrates.length < 1) return 0;
            if (!checkIfCurrencyIsKnown(GivenCur1) || !checkIfCurrencyIsKnown(GivenCur2)) return -1;
            var Found = false,
                Result = 0;
            for (var i = 0; i < fxrates.length; i++) {
                if ((fxrates[i].src === GivenCur1) && (fxrates[i].dst === GivenCur2)) {
                    Result = GivenAmount * fxrates[i].sell;
                    Found = true;
                }
                if ((fxrates[i].dst === GivenCur1) && (fxrates[i].src === GivenCur2)) {
                    Result = GivenAmount / fxrates[i].buy;
                    Found = true;
                }
            }
            if (Found) return Result;
            //No direct rate, so will need to do double conversion via fxrates.homecurrency
            var temp1 = fxrates.convertCurrency(fxrates.homecurrency, GivenAmount, GivenCur2);
            var temp2 = fxrates.convertCurrency(GivenCur1, temp1, fxrates.homecurrency);
            return temp2;
        };


        var accounts = yield app.db.accounts.find({}).exec();
        findAccount = function (givenAccountID) {
            for (var i = 0; i < accounts.length; i++) {
                if (givenAccountID === accounts[i].id) return accounts[i];
            }
        }
        var Datastore = require('nedb');
        var wrap = require('co-ne-db');

        var future = new Datastore({
            filename: './generator/db_future',
            autoload: true
        });
        future = wrap(future);


        var futures = yield future.find({}).exec();
        var toBePosted = [];
        for (var i = 0; i < futures.length; i++) {
            if (futures[i].DTSValue < new Date()) {
                var transactionCurrency = futures[i].currency;
                var transactionAccount = futures[i].accountId;
                var accountCurrency = findAccount(transactionAccount).balance.currency;
                var oldBalance = findAccount(transactionAccount).balance.native;
                var amountInAccountCurrency = fxrates.convertCurrency(accountCurrency, futures[i].amount, transactionCurrency);
                findAccount(transactionAccount).balance.native += futures[i].credit;
                findAccount(transactionAccount).balance.native += futures[i].debit;
                findAccount(transactionAccount).balance.native = parseFloat(parseFloat(Math.round(findAccount(transactionAccount).balance.native * 100) / 100).toFixed(2)); //drop extra decimals
                var newBalance = findAccount(transactionAccount).balance.native;
                toBePosted.push(futures[i]);
            }
        }
        if (toBePosted.length > 0) {
            for (var i = 0; i < accounts.length; i++) {
                yield app.db.accounts.update({
                    id: accounts[i].id
                }, accounts[i]);
            }
            console.log('updated account balances');


            for (var i = 0; i < toBePosted.length; i++) {
                yield app.db.transactions.update({
                    transactionId: toBePosted[i].transactionId
                }, toBePosted[i], {
                    upsert: true
                });
            }
            //console.log('updated transactions');

            for (var i = 0; i < toBePosted.length; i++) {
                yield future.remove({
                    transactionId: toBePosted[i].transactionId
                }, {
                    multi: true
                });
            }
        }
        return true;
    }).then(function (value) {
        console.log('done importing new transactions');
    }, function (err) {
        console.error(err.stack);
    });
}

