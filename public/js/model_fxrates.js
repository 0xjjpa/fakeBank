TheM.fxrates = (function () {
    var _isLoaded = false;
    var _fxrates = [];

    var aUpdate = function () {
        console.log('FX Update called');
        if (aUpdate.isWorking) return aUpdate.intPromise;
        if ((new Date() - aUpdate.DTSUpdated) < aUpdate.msecToExpiry) return Promise.resolve();
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                console.log('fetching fxrates');
                aUpdate.isWorking = true;
                myAWS.DoCall('GET','rates', {}, function (data) {
                    console.log('fetched fxrates');
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    _fxrates = data.slice();
                    while (TheM.fxrates.pop()) {} //clear the  array
                    DeDupAndAdd(TheM.fxrates, data); //copy all rates received into the array
                    aUpdate.DTSUpdated = new Date();
                    _isLoaded = true;
                    aUpdate.isWorking = false;
                    TheM.refresh();
                    resolve(data);
                }, function () {
                    aUpdate.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get fxrates'
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
        //saves FX rates in the local storage
        var compressed = LZString.compressToUTF16(JSON.stringify(TheM.fxrates))
        window.localStorage.setItem(TheM.user.id + 'fxrates', compressed);
        return true;
    }

    var aLoad = function () {
        //loads fxrates from the local storage
        var uncompressed = window.localStorage.getItem(TheM.user.id + 'fxrates');
        if (!uncompressed || uncompressed.length < 1) return false;
        uncompressed = LZString.decompressFromUTF16(uncompressed);
        while (TheM.fxrates.pop()) {} //clear the array
        DeDupAndAdd(TheM.fxrates, JSON.parse(uncompressed));
        while (_fxrates.pop()) {}
        DeDupAndAdd(_fxrates, JSON.parse(uncompressed)); //immutable, safe copy of fxrates
        return true;
    }

    function checkIfCurrencyIsKnown(GivenCurrency) {
        //returns false if given currency code is not present in the _fxrates array
        for (var i = 0; i < _fxrates.length; i++) {
            if (TheM.fxrates[i].src === GivenCurrency || TheM.fxrates[i].dst === GivenCurrency) return true;
        }
        return false;
    }


    // returns how much is GivenAmount of GivenCur2 in GivenCur1. i.e. 100 AED in EUR
    var aConvertCurrency = function (GivenCur1, GivenAmount, GivenCur2) {
        if (GivenCur1 === GivenCur2) {
            return GivenAmount;
        }
        if (TheM.fxrates.length < 1) return 0;
        if (!checkIfCurrencyIsKnown(GivenCur1)) return -1;
        if (!checkIfCurrencyIsKnown(GivenCur2)) return -1;
        var Found = false;
        var Result = 0;
        for (var i = 0; i < TheM.fxrates.length; i++) {
            if ((TheM.fxrates[i].src === GivenCur1) && (TheM.fxrates[i].dst === GivenCur2)) {
                Result = GivenAmount * TheM.fxrates[i].sell;
                Found = true;
            }
            if ((TheM.fxrates[i].dst === GivenCur1) && (TheM.fxrates[i].src === GivenCur2)) {
                Result = GivenAmount / TheM.fxrates[i].buy;
                Found = true;
            }
        }
        if (Found) {
            return Result;
        }
        //No direct rate, so will need to do double conversion via homecurrency
        var temp1 = aConvertCurrency(TheM.user.homecurrency, GivenAmount, GivenCur2);
        var temp2 = aConvertCurrency(GivenCur1, temp1, TheM.user.homecurrency);
        return temp2;
    };

    var resp = [];
    resp.doUpdate = aUpdate;
    resp.doSave = aSave;
    resp.doLoad = aLoad;
    resp.doConvertCurrency = aConvertCurrency;
    Object.defineProperty(resp, 'isLoaded', {
        get: function () {
            //returns true if any rates are available, regardless if they are fresh or not.
            if (_fxrates.length > 0) return true;
            return false;
        }
    });
     Object.defineProperty(resp, 'baseCurrency', {
        get: function () {
            //returns true if any rates are available, regardless if they are fresh or not.
            return "EUR"; //???### Hardcoded base currency of the bank
        }
    });
    return resp;
})();
