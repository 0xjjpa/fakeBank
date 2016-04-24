TheM.restrictions = (function () {
    var _isLoaded = false;
    var _restrictions = [];


    var aUpdate = function () {
        if (aUpdate.isWorking) return aUpdate.intPromise;
        if ((new Date() - aUpdate.DTSUpdated) < aUpdate.msecToExpiry) return Promise.resolve();
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                aUpdate.isWorking = true;
                myAWS.DoCall('fake_restrictions.json', {}, function (data) {;
                    data = JSON.parse(data);
                    if (!data || data.error) {
                        aUpdate.isWorking = false;
                        reject({
                            error: true,
                            errorMessage: 'Could not fetch restrictions'
                        })
                    }
                    _restrictions = data.slice();
                    while (TheM.restrictions.pop()) {} //clear the array
                    DeDupAndAdd(TheM.restrictions, data); //copy all restrictions received into the array
                    aUpdate.DTSUpdated = new Date();
                    _isLoaded = true;
                    aUpdate.isWorking = false;
                    TheM.refresh();
                    resolve(data);
                }, function () {
                    aUpdate.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get restrictions'
                    })
                });
            }
        );
        return aUpdate.intPromise;
    }

    aUpdate.isWorking = false;
    aUpdate.msecToExpiry = 10000000; //???
    aUpdate.DTSUpdated = new Date('1/1/1980');
    aUpdate.intPromise = null;

    var aSave = function () {
        //saves accounts in the local storage
        if (!TheM.user || !TheM.user.id) return false;
        var compressed = LZString.compressToUTF16(JSON.stringify(TheM.restrictions))
        window.localStorage.setItem(TheM.user.id + 'restrictions', compressed);
        return true;
    }

    var aLoad = function () {
        //loads restrictions from the local storage
        if (!TheM.user || !TheM.user.id) return false;
        var uncompressed = window.localStorage.getItem(TheM.user.id + 'restrictions');
        if (!uncompressed || uncompressed.length < 1) return false;
        uncompressed = LZString.decompressFromUTF16(uncompressed);
        while (TheM.restrictions.pop()) {} //clear the restrictions array
        DeDupAndAdd(TheM.restrictions, JSON.parse(uncompressed));
        while (_restrictions.pop()) {}
        DeDupAndAdd(_restrictions, JSON.parse(uncompressed)); //immutable, safe copy of restrictions
        return true;
    }

    var resp = [];
    resp.doUpdate = aUpdate;
    resp.doSave = aSave;
    resp.doLoad = aLoad;

    resp.isTransactionAllowed = function (givenTransactionID) {
        //returns true if transaction of a given id is allowed for the customer
        if (TheM.restrictions.length < 1) return false;
        for (var i = 0; i < TheM.restrictions.length; i++) {
            if (TheM.restrictions[i].transactionTypeID === givenTransactionID) {
                if (TheM.restrictions[i].allowed) return true;
            }
        }
        return false;
    }
    resp.accountsAsSourceFor = function (givenTransactionID) {
        //returns a list of accounts which are allowed to be a source account for a given transaction type
        //requires TheM.restrictions
        if (!_restrictions || TheM.restrictions.length < 1) return TheM.accounts.all; //allow all accounts if restrictions object is not ready
        var tempresponse = [];
        for (var r = 0; r < TheM.accounts.length; r++) {
            for (var i = 0; i < TheM.restrictions.length; i++) {
                if (TheM.restrictions[i].transactionTypeID === givenTransactionID && TheM.restrictions[i].allowed) {
                    for (var e = 0; e < TheM.restrictions[i].sourceAccountTypes.length; e++) {
                        if (TheM.restrictions[i].sourceAccountTypes[e] === TheM.accounts[r].producttypeid) {
                            tempresponse.push(TheM.accounts[r]);
                        }
                    }
                }
            }
        }
        return tempresponse;
    }
    resp.accountsAsDestinationFor = function (givenTransactionID) {
        //returns a list of accounts which are allowed to be a destination account for a given transaction type
        //requires TheM.restrictions
        if (!_restrictions || TheM.restrictions.length < 1) return TheM.accounts.all; //allow all accounts if restrictions object is not ready
        var tempresponse = [];
        for (var r = 0; r < TheM.accounts.length; r++) {
            for (var i = 0; i < TheM.restrictions.length; i++) {
                if (TheM.restrictions[i].transactionTypeID === givenTransactionID && TheM.restrictions[i].allowed) {
                    for (var e = 0; e < TheM.restrictions[i].destinationAccountTypes.length; e++) {
                        if (TheM.restrictions[i].destinationAccountTypes[e] === TheM.accounts[r].producttypeid) {
                            tempresponse.push(TheM.accounts[r]);
                        }
                    }
                }
            }
        }
        return tempresponse;
    }
    resp.currenciesAllowed = function (givenTransactionID) {
        //returns an array with currencies allowed for the given transaction id
        for (var i = 0; i < _restrictions.length; i++) {
            if (_restrictions[i].allowed && _restrictions[i].transactionTypeID === givenTransactionID) return _restrictions[i].allowedTransactionCurrencies;
        }
        throw "givenTransactionID not found";
        return [];
    }
    Object.defineProperty(resp, 'isLoaded', {
        get: function () {
            //TheM.restrictions.isLoaded returns true if restrictions were feteched from the server.
            return _isLoaded;
        }
    });
    Object.defineProperty(resp, 'all', {
        get: function () {
            return _restrictions;
        }
    });
    return resp;
}());
