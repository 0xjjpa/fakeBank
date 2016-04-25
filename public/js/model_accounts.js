TheM.accounts = (function () {
    var _isLoaded = false;
    var _accounts = [];

    function transactionsdoUpdate(givenParams) {
        //Include dateStart, dateEnd to pull transactions for a specified period
        //Ignores requests if the last request was made less than 60 seconds ago. To force a request include force:true into the givenParams
        if (this.isWorking) return this.intPromise;
        var that = [];
        givenParams = givenParams || {};
        //will save dateStart and dateEnd on success, so will ignore requests to fetch transactions within this range
        givenParams.dateStart = givenParams.dateStart || (new Date()).addMinutes(-44640); //past 31 days
        givenParams.dateEnd = givenParams.dateEnd || new Date();
        this.dateStart = this.dateStart || new Date();
        this.dateEnd = this.dateEnd || new Date('1/1/1980');
        this.RequestedDateStart = givenParams.dateStart;
        this.RequestedDateEnd = givenParams.dateEnd;
        var StartInside = false;
        var EndInside = false;
        givenParams.force = givenParams.force || false;
        var tolerance = 60000; //??? 60 seconds tolerance. If requested period is about the same as what is already available in the cache then request should be ignored
        if (givenParams.force === true) tolerance = 0; //no tolerance if forced.
        if (this.dateStart.valueOf() - tolerance <= givenParams.dateStart.valueOf()) StartInside = true;
        if (this.dateEnd.valueOf() + tolerance >= givenParams.dateEnd.valueOf()) EndInside = true;
        if (StartInside && EndInside) return Promise.resolve(); //no need to fetch anything, we already have the data
        this.isWorking = true;
        if (StartInside && !EndInside) {
            this.RequestedDateStart = this.dateEnd;
            this.RequestedDateEnd = givenParams.dateEnd;
        }
        if (!StartInside && EndInside) {
            this.RequestedDateStart = givenParams.dateStart;
            this.RequestedDateEnd = this.dateStart;
        }
        if (!StartInside && !EndInside) {
            //TODO. filter was asked to give transactions before and after of what is available. Perhaps should do two separate calls for the two periods
            //Instead, as a workaround, we do one call overlaping existing data
            this.RequestedDateStart = givenParams.dateStart;
            this.RequestedDateEnd = givenParams.dateEnd;
        }
        MergeObjects(that, this);
        this.intPromise = new Promise(
            function resolver(resolve, reject) {
                TheM.accounts.account(that.accountID).transactions.isWorking = true;
                myAWS.DoCall('GET', 'accounts/' + that.accountID + '/transactions/' + that.RequestedDateStart.valueOf() + '/' + that.RequestedDateEnd.valueOf(), {},
                    function (data) {
                        data = JSON.parse(data);
                        if (data && data.length) {
                            DeDupAndAdd(TheM.accounts.account(that.accountID).transactions, data, 'id'); //deduplicate objects based on their IDs
                            TheM.accounts.account(that.accountID).transactions.DTSUpdated = new Date();
                            TheM.accounts.account(that.accountID).transactions.isWorking = false;
                            TheM.accounts.account(that.accountID).transactions.dateStart = Math.min(TheM.accounts.account(that.accountID).transactions.dateStart, TheM.accounts.account(that.accountID).transactions.RequestedDateStart);
                            TheM.accounts.account(that.accountID).transactions.dateEnd = Math.max(TheM.accounts.account(that.accountID).transactions.dateEnd, TheM.accounts.account(that.accountID).transactions.RequestedDateEnd);
                            TheM.refresh();
                            resolve(data);
                        }
                    },
                    function () {
                        TheM.accounts.account(that.accountID).transactions.isWorking = false;
                        reject({
                            error: true,
                            errorMessage: 'Could not get transactions'
                        })
                    });
            }
        );
        return this.intPromise;
    }

    function transactionsReset() {
        //removes all the transactions from the cache
        while (this.pop()) {}
    }

    var aUpdate = function (isUpdateForced) {
        isUpdateForced = isUpdateForced || false;
        if (aUpdate.isWorking) return aUpdate.intPromise;
        if ((new Date() - aUpdate.DTSUpdated) < aUpdate.msecToExpiry) {
            console.log('has not expired yet');
            if (!isUpdateForced) aUpdate.intPromise = null;;
        }
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                aUpdate.isWorking = true;
                myAWS.DoCall('GET', 'accounts/', {}, function (data) {;
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    _accounts = data.slice();
                    while (TheM.accounts.pop()) {} //clear the accounts array
                    DeDupAndAdd(TheM.accounts, data); //copy all accounts received into the array
                    for (var i = 0; i < TheM.accounts.length; i++) {
                        TheM.accounts[i].transactions = TheM.accounts[i].transactions || [];
                        TheM.accounts[i].transactions.accountID = TheM.accounts[i].id;
                        TheM.accounts[i].transactions.doUpdate = transactionsdoUpdate;
                        TheM.accounts[i].transactions.isWorking = false;
                        TheM.accounts[i].transactions.doReset = transactionsReset;
                        TheM.accounts[i].transactions.DTSUpdated = new Date('1/1/1980');
                        TheM.accounts[i].transactions.intPromise = null;
                    }
                    aUpdate.DTSUpdated = new Date();
                    _isLoaded = true;
                    aUpdate.isWorking = false;
                    TheM.refresh();
                    resolve(data);
                }, function () {
                    aUpdate.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get accounts'
                    })
                });
            }
        );
        return aUpdate.intPromise;
    }

    aUpdate.isWorking = false;
    aUpdate.msecToExpiry = 30000; //???
    aUpdate.DTSUpdated = new Date('1/1/1980');
    aUpdate.intPromise = null;

    var aSave = function () {
        //saves accounts in the local storage
        var compressed = LZString.compressToUTF16(JSON.stringify(_accounts))
        window.localStorage.setItem(TheM.user.id + 'accounts', compressed);
        return true;
    }

    var aLoad = function () {
        //loads accounts from the local storage
        var uncompressed = window.localStorage.getItem(TheM.user.id + 'accounts');
        if (!uncompressed || uncompressed.length < 1) return !!console.log("Can't load accounts as localStorage is empty");
        uncompressed = LZString.decompressFromUTF16(uncompressed);
        while (TheM.accounts.pop()) {} //clear the accounts array
        DeDupAndAdd(TheM.accounts, JSON.parse(uncompressed));
        while (_accounts.pop()) {}
        DeDupAndAdd(_accounts, JSON.parse(uncompressed)); //immutable, safe copy of accounts
        return true;
    }

    var resp = [];
    resp.doUpdate = aUpdate;
    resp.doSave = aSave;
    resp.doLoad = aLoad;
    resp.account = function (givenAccountID) {
        //returns a account with a given .id
        for (var i = 0; i < _accounts.length; i++) {
            if (_accounts[i].id) {
                if (_accounts[i].id == givenAccountID) {
                    return _accounts[i];
                }
            }
        }
        return !!console.log("Can't find given account");
    }

    Object.defineProperty(resp, 'isLoaded', {
        get: function () {
            //TheM.accounts.isLoaded returns true if accounts were feteched from the server.
            return _isLoaded;
        }
    });
    Object.defineProperty(resp, 'all', {
        get: function () {
            return _accounts;
        }
    });
    return resp;
}());
