TheM.fundsTransfer = (function () {
    _sourceAccount = undefined;
    _destinationAccount = undefined;
    _amount = undefined;
    _currency = undefined;
    _narrative = undefined;
    _transactionType = "1"; //??? hardcoded
    _validationMessage = " ";

    var isValid = function () {
        _validationMessage = " ";
        GivenAmount = _amount;
        GivenCurrency = _currency;
        GivenNarrative = _narrative || "";
        GivensourceAccount = _sourceAccount;
        GivendestinationAccount = _destinationAccount;
        if (!GivenCurrency || !TheM.accounts || !GivensourceAccount || !GivendestinationAccount) return false;
        if (typeof GivenAmount === 'undefined' || GivenAmount < 0 || GivenAmount == 0) {
            _validationMessage = "Please, enter the amount";
            return false;
        }
        if (typeof GivenCurrency === 'undefined') {
            _validationMessage = "Please, select the currency";
            return false;
        }

        if (!TheM.accounts.account(GivensourceAccount)) {
            _validationMessage = "Wrong source account";
            return false;
        }
        if (!TheM.accounts.account(GivendestinationAccount)) {
            _validationMessage = "Wrong destination account";
            return false;
        }
        if (GivensourceAccount == GivendestinationAccount) {
            _validationMessage = "Source and destination accounts can't be the same";
            return false;
        }

        if (TheM.restrictions) {
            for (var i = 0; i < TheM.restrictions.length; i++) {
                if (TheM.restrictions[i].transactionTypeID === _transactionType) {
                    if (TheM.restrictions[i].allowed === false) {
                        _validationMessage = "This transaction type is explicitly forbidden";
                        return false;
                    }
                    //now check if amount does not exceed maximum
                    //first convert transaction amount into the limit currency
                    if (TheM.fxrates && TheM.fxrates.isLoaded && typeof TheM.restrictions[i].maxAmount != 'undefined' && TheM.restrictions[i].maxAmountCurrency) {
                        var tempAmount = TheM.fxrates.doConvertCurrency(TheM.restrictions[i].maxAmountCurrency, GivenAmount, GivenCurrency);
                        if (TheM.restrictions[i].maxAmount < tempAmount) {
                            _validationMessage = "Amount exceeds maximum allowed";
                            return false;
                        }
                        tempAmount = TheM.fxrates.doConvertCurrency(TheM.accounts.account(GivensourceAccount).balance.currency, GivenAmount, GivenCurrency);
                        var tempAmount1 = TheM.fxrates.doConvertCurrency(GivenCurrency, TheM.accounts.account(GivensourceAccount).balance.native, TheM.accounts.account(GivensourceAccount).balance.currency);
                        //console.log(tempAmount1.toFixed(2));
                        tempAmount1 = parseFloat(tempAmount1).toFixed(2);
                        if (tempAmount > TheM.accounts.account(GivensourceAccount).balance.native) {
                            _validationMessage = "Source account does not have that much. Maximum avalable is " + tempAmount1 + " " + GivenCurrency;
                            return false;
                        }
                    }
                    if (TheM.fxrates && TheM.fxrates.isLoaded && typeof TheM.restrictions[i].minAmount != 'undefined' && TheM.restrictions[i].minAmountCurrency) {
                        var tempAmount = TheM.fxrates.doConvertCurrency(TheM.restrictions[i].minAmountCurrency, GivenAmount, GivenCurrency);
                        if (TheM.restrictions[i].minAmount > tempAmount) {
                            _validationMessage = "Amount is too small";
                            return false;
                        }
                    }
                    //Check if transaction currency is listed as allowed
                    var Found = false;
                    if (TheM.restrictions[i].allowedTransactionCurrencies) {
                        for (var e = 0; e < TheM.restrictions[i].allowedTransactionCurrencies.length; e++) {
                            if (TheM.restrictions[i].allowedTransactionCurrencies[e] === GivenCurrency) Found = true;
                        }
                    }
                    if (!Found) {
                        _validationMessage = "Strange currency";
                        return false
                    };
                }
            }
        }
        return true;
    }
    var doAcc2Acc = function () {
        if (TheM.fundsTransfer.doAcc2Acc.isWorking) return TheM.fundsTransfer.doAcc2Acc.intPromise;
        GivenAmount = _amount;
        GivenCurrency = _currency;
        GivenNarrative = _narrative || "";
        GivensourceAccount = _sourceAccount;
        GivendestinationAccount = _destinationAccount;

        if (!isValid()) return false;

        if (!TheM.fundsTransfer.doAcc2Acc.intPromise) TheM.fundsTransfer.doAcc2Acc.intPromise = new Promise(
            function resolver(resolve, reject) {
                console.log('doing acc2acc funds transfer');
                TheM.fundsTransfer.doAcc2Acc.isWorking = true;
                myAWS.DoCall('POST', 'transfer/acc2acc/', {
                    "srcAcc": TheM.accounts.account(GivensourceAccount).id,
                    "dstAcc": TheM.accounts.account(GivendestinationAccount).id,
                    "amount": GivenAmount,
                    "currency": GivenCurrency,
                    "narrative": GivenNarrative
                }, function (data) {
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    TheM.notificationsOnscreen.add({
                        undoable: false,
                        text: 'Successfully transfered %amount% from %source% to %destination%.'
                            .replace('%amount%', GivenAmount + ' ' + GivenCurrency)
                            .replace('%source%', TheM.accounts.account(GivensourceAccount).name)
                            .replace('%destination%', TheM.accounts.account(GivendestinationAccount).name)
                    });
                    TheM.fundsTransfer.doAcc2Acc.isWorking = false;
                    TheM.fundsTransfer.doAcc2Acc.intPromise = undefined;
                    _sourceAccount = undefined;
                    _destinationAccount = undefined;
                    _amount = undefined;
                    _currency = undefined;
                    _narrative = undefined;
                    TheM.refresh();
                    resolve(data);
                }, function () {
                    TheM.fundsTransfer.doAcc2Acc.isWorking = false;
                    TheM.fundsTransfer.doAcc2Acc.intPromise = undefined;
                    TheM.notificationsOnscreen.add({
                        undoable: false,
                        isError: true,
                        text: 'Failed transfering %amount% from %source% to %destination%.'
                            .replace('%amount%', GivenAmount + ' ' + GivenCurrency)
                            .replace('%source%', TheM.accounts.account(GivensourceAccount).name)
                            .replace('%destination%', TheM.accounts.account(GivendestinationAccount).name)
                    });
                    reject({
                        error: true,
                        errorMessage: 'Could not do the transfer'
                    })
                });
            }
        );
        return TheM.fundsTransfer.doAcc2Acc.intPromise;
    }

    var resp = [];

    resp.doAcc2Acc = doAcc2Acc;

    Object.defineProperty(resp, 'isValid', {
        get: function () {
            return isValid();
        }
    });
    Object.defineProperty(resp, 'validationMessage', {
        get: function () {
            isValid();
            return _validationMessage;
        }
    });
    Object.defineProperty(resp, 'sourceAccount', {
        get: function () {
            return TheM.accounts.account(_sourceAccount);
        },
        set: function (newValue) {
            //can accept ID of an account or account object as such
            if (!newValue) return false;
            if (typeof newValue === "string") {
                if (TheM.accounts.account(newValue)) _sourceAccount = newValue;
            } else {
                if (newValue.id) {
                    if (TheM.accounts.account(newValue.id)) _sourceAccount = newValue.id;
                }
            }
        },
    });
    Object.defineProperty(resp, 'destinationAccount', {
        get: function () {
            return TheM.accounts.account(_destinationAccount);
        },
        set: function (newValue) {
            //can accept ID of an account or account object as such
            if (!newValue) return false;
            if (typeof newValue === "string") {
                if (TheM.accounts.account(newValue)) _destinationAccount = newValue;
            } else {
                if (newValue.id) {
                    if (TheM.accounts.account(newValue.id)) _destinationAccount = newValue.id;
                }
            }
        },
    });
    Object.defineProperty(resp, 'transactionType', {
        get: function () {
            return _transactionType;
        }
    });
    Object.defineProperty(resp, 'amount', {
        get: function () {
            return _amount;
        },
        set: function (newValue) {
            //TODO does not accept non integer amounts
            newValue = "" + newValue;
            var temp = Number(newValue.replace(/[^0-9\.-]+/g, ""));
            if (temp > 0) _amount = temp;
        },
    });
    Object.defineProperty(resp, 'currency', {
        get: function () {
            return _currency;
        },
        set: function (newValue) {
            //TODO validate currency id prior to accepting it
            _currency = newValue;
        },
    });
    Object.defineProperty(resp, 'narrative', {
        get: function () {
            return narrative;
        },
        set: function (newValue) {
            //TODO validate narrative prior to accepting it
            _narrative = newValue;
        },
    });
    return resp;
}());
