TheM.beneficiaries = (function () {
    var _isLoaded = false;
    var _beneficiaries = [];

    function transactionsdoUpdate() {
        //TODO: add dateStart, dateEnd to pull transactions for a specified period
        if (this.isWorking) return this.intPromise;
        if ((new Date() - this.DTSUpdated) < this.msecToExpiry) return Promise.resolve();
        var that = [];
        MergeObjects(that, this);
        if (!this.intPromise || ((new Date() - this.DTSUpdated) > this.msecToExpiry)) this.intPromise = new Promise(
            function resolver(resolve, reject) {
                this.isWorking = true;
                myAWS.DoCall('fake_beneficiaries_transactions.json', {
                    transID: that.beneficiaryID //### check if beneficiaryID does exist first.
                }, function (data) {
                    if (data && data.length) {
                        DeDupAndAdd(TheM.beneficiaries.beneficiary(that.beneficiaryID).transactions, data);
                        TheM.beneficiaries.beneficiary(that.beneficiaryID).transactions.DTSUpdated = new Date();
                        TheM.beneficiaries.beneficiary(that.beneficiaryID).transactions.isWorking = false;
                        TheM.refresh();
                        resolve(data);
                    }
                }, function () {
                    that.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get transactions'
                    })
                });
            }
        );
        return this.intPromise;

        this.push({
            transID: 12
        })
    }

    var aUpdate = function () {
        if (aUpdate.isWorking) return aUpdate.intPromise;
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                console.log('fetching beneficiaries');
                aUpdate.isWorking = true;
                myAWS.DoCall('GET','beneficiaries/', {}, function (data) {
                    console.log('fetched beneficiaries');
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    _beneficiaries = data.slice();
                    while (TheM.beneficiaries.pop()) {} //clear the beneficiaries array
                    DeDupAndAdd(TheM.beneficiaries, data); //copy all beneficiaries received into the array
                    for (var i = 0; i < TheM.beneficiaries.length; i++) {
                        TheM.beneficiaries[i].transactions = TheM.beneficiaries[i].transactions || [];
                        TheM.beneficiaries[i].transactions.beneficiaryID = TheM.beneficiaries[i].id;
                        TheM.beneficiaries[i].transactions.doUpdate = transactionsdoUpdate;
                        TheM.beneficiaries[i].transactions.isWorking = false;
                        TheM.beneficiaries[i].transactions.msecToExpiry = 3000; //??? when beneficiary transactions should expire
                        TheM.beneficiaries[i].transactions.DTSUpdated = new Date('1/1/1980');
                        TheM.beneficiaries[i].transactions.intPromise = null;
                    }
                    aUpdate.DTSUpdated = new Date();
                    _isLoaded = true;
                    aUpdate.isWorking = false;
                    resolve(data);
                }, function () {
                    aUpdate.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get beneficiaries'
                    })
                });
            }
        );
        return aUpdate.intPromise;
    }

    aUpdate.isWorking = false;
    aUpdate.msecToExpiry = 300000; //???
    aUpdate.DTSUpdated = new Date('1/1/1980');
    aUpdate.intPromise = null;

    var aSave = function () {
        //saves beneficiaries in the local storage
        var compressed = LZString.compressToUTF16(JSON.stringify(TheM.beneficiaries))
        window.localStorage.setItem(TheM.user.id + 'beneficiaries', compressed);
        return true;
    }

    var aLoad = function () {
        //loads beneficiaries from the local storage
        var uncompressed = window.localStorage.getItem(TheM.user.id + 'beneficiaries');
        if (!uncompressed || uncompressed.length < 1) return false;
        uncompressed = LZString.decompressFromUTF16(uncompressed);
        while (TheM.beneficiaries.pop()) {} //clear the accounts array
        DeDupAndAdd(TheM.beneficiaries, JSON.parse(uncompressed));
        while (_beneficiaries.pop()) {}
        DeDupAndAdd(_beneficiaries, JSON.parse(uncompressed)); //immutable, safe copy of beneficiaries
        return true;
    }

    var resp = [];
    resp.doUpdate = aUpdate;
    resp.doSave = aSave;
    resp.doLoad = aLoad;
    resp.beneficiary = function (givenBeneficiaryID) {
        //returns a beneficiary with a given .id
        for (var i = 0; i < _beneficiaries.length; i++) {
            if (_beneficiaries[i].id) {
                if (_beneficiaries[i].id == givenBeneficiaryID) {
                    return _beneficiaries[i];
                }
            }
        }
        return false;
    }

    Object.defineProperty(resp, 'isLoaded', {
        get: function () {
            //TheM.beneficiaries.isLoaded returns true if beneficiaries were feteched from the server.
            return _isLoaded;
        }
    });
    Object.defineProperty(resp, 'all', {
        get: function () {
            return _beneficiaries;
        }
    });
    return resp;
}());
