TheM.cards = (function () {
    var _isLoaded = false;
    var _cards = [];


    var aUpdate = function () {
        if (aUpdate.isWorking) return aUpdate.intPromise;
        if ((new Date() - aUpdate.DTSUpdated) < aUpdate.msecToExpiry) return Promise.resolve();
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                aUpdate.isWorking = true;
                myAWS.DoCall('GET', 'cards/', {}, function (data) {;
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    _cards = data.slice();
                    while (TheM.cards.pop()) {} //clear the cards array
                    DeDupAndAdd(TheM.cards, data); //copy all cards received into the array
                    for (var i = 0; i < _cards.length; i++) {
                        if (_cards[i].id) {
                            _cards[i].doOnOff = aOnOff;
                            _cards[i].doOnOff.id = _cards[i].id;
                            _cards[i].doOnOff.isWorking = false;
                            _cards[i].doOnOff.msecToExpiry = 500; //???
                            _cards[i].doOnOff.DTSUpdated = new Date('1/1/1980');
                            _cards[i].doOnOff.intPromise = null;
                        }
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
                        errorMessage: 'Could not get cards'
                    })
                });
            }
        );
        return aUpdate.intPromise;
    }

    aUpdate.isWorking = false;
    aUpdate.msecToExpiry = 100000; //???
    aUpdate.DTSUpdated = new Date('1/1/1980');
    aUpdate.intPromise = null;

    var aSave = function () {
        //saves accounts in the local storage
        if (!TheM.user || !TheM.user.id) return false;
        var compressed = LZString.compressToUTF16(JSON.stringify(TheM.cards))
        window.localStorage.setItem(TheM.user.id + 'cards', compressed);
        return true;
    }

    var aLoad = function () {
        //loads cards from the local storage
        if (!TheM.user || !TheM.user.id) return false;
        var uncompressed = window.localStorage.getItem(TheM.user.id + 'cards');
        if (!uncompressed || uncompressed.length < 1) return false;
        uncompressed = LZString.decompressFromUTF16(uncompressed);
        while (TheM.cards.pop()) {} //clear the cards array
        DeDupAndAdd(TheM.cards, JSON.parse(uncompressed));
        while (_cards.pop()) {}
        DeDupAndAdd(_cards, JSON.parse(uncompressed)); //immutable, safe copy of cards
        return true;
    }

    var aOnOff = function (GivenStatus) {
        //accepts true or false for GivenStatus, turns the card on or off
        if (!GivenStatus) GivenStatus = false;
        if (GivenStatus !== true || GivenStatus !== false) GivenStatus = false;
        if (this.isWorking) return this.intPromise;
        if ((new Date() - this.DTSUpdated) > this.msecToExpiry) return Promise.resolve();
        var that = [];
        MergeObjects(that, this);
        if (!this.intPromise || ((new Date() - this.DTSUpdated) > this.msecToExpiry)) this.intPromise = new Promise(
            function resolver(resolve, reject) {;
                TheM.cards.card(that.id).doOnOff.isWorking = true;
                myAWS.DoCall('POST', 'cards/' + that.id, {
                    "status": GivenStatus
                }, function (data) {;
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    if (!data) {
                        TheM.cards.card(that.id).doOnOff.isWorking = false;
                        reject({
                            error: true,
                            errorMessage: 'Could not toggle card status 1'
                        });
                    }
                    if (!data.success || !data.status) {
                        TheM.cards.card(that.id).doOnOff.isWorking = false;
                        reject({
                            error: true,
                            errorMessage: 'Could not toggle card status 2'
                        });
                    }
                    //now change the status of the card
                    for (var i = 0; i < _cards.length; i++) {
                        if (_cards[i].id) {
                            if (_cards[i].id == that.id) {
                                _cards[i].status = data.status;
                            }
                        }
                    }
                    aOnOff.DTSUpdated = new Date();
                    _isLoaded = true;
                    TheM.cards.card(that.id).doOnOff.DTSUpdated = new Date();
                    TheM.cards.card(that.id).doOnOff.isWorking = false;
                    TheM.refresh();
                    resolve(data);
                }, function () {
                    TheM.cards.card(that.id).doOnOff.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not toggle card status'
                    });
                });
            }
        );
        return this.intPromise;
    }

    var resp = [];
    resp.doUpdate = aUpdate;
    resp.doSave = aSave;
    resp.doLoad = aLoad;
    resp.card = function (givenCardID) {
        //returns a card with a given .id
        for (var i = 0; i < _cards.length; i++) {
            if (_cards[i].id) {
                if (_cards[i].id == givenCardID) {
                    return _cards[i];
                }
            }
        }
        return false;
    }

    Object.defineProperty(resp, 'isLoaded', {
        get: function () {
            //TheM.cards.isLoaded returns true if cards were feteched from the server.
            return _isLoaded;
        }
    });
    Object.defineProperty(resp, 'all', {
        get: function () {
            return _cards;
        }
    });
    return resp;
}());
