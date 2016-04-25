TheM.pbanker = (function () {
    var _isLoaded = false;
    var _pbanker = {};

    var aUpdate = function () {
        if (aUpdate.isWorking) return aUpdate.intPromise;
        if ((new Date() - aUpdate.DTSUpdated) < aUpdate.msecToExpiry) return Promise.resolve();
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                aUpdate.isWorking = true;
                myAWS.DoCall('GET', 'fake_pbanker.json', {}, function (data) {;
                    data = JSON.parse(data); //TODO: handle parsing errors.
                    if (!data || data.error) {
                        aUpdate.isWorking = false;
                        reject({
                            error: true,
                            errorMessage: 'Could not get pbanker 1'
                        })
                    }
                    _pbanker = data;
                    aUpdate.DTSUpdated = new Date();
                    _isLoaded = true;
                    aUpdate.isWorking = false;
                    TheM.refresh();
                    resolve(data);
                }, function () {
                    aUpdate.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get pbanker'
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
        //saves accounts in the local storage
        var compressed = LZString.compressToUTF16(JSON.stringify(_pbanker))
        window.localStorage.setItem(TheM.user.id + 'pbanker', compressed);
        return true;
    }

    var aLoad = function () {
        //loads accounts from the local storage
        var uncompressed = window.localStorage.getItem(TheM.user.id + 'pbanker');
        if (!uncompressed || uncompressed.length < 1) return false;
        uncompressed = LZString.decompressFromUTF16(uncompressed);
        _pbanker = JSON.parse(uncompressed);
        return true;
    }

    var resp = {};
    resp.doUpdate = aUpdate;
    resp.doSave = aSave;
    resp.doLoad = aLoad;

    Object.defineProperty(resp, 'name', {
        get: function () {
            return _pbanker.name;
        }
    });
    Object.defineProperty(resp, 'photo', {
        get: function () {
            return _pbanker.photo;
        }
    });
    Object.defineProperty(resp, 'email', {
        get: function () {
            return _pbanker.email;
        }
    });
    Object.defineProperty(resp, 'phone', {
        get: function () {
            return _pbanker.phone;
        }
    });
    Object.defineProperty(resp, 'hasPhoto', {
        get: function () {
            return _pbanker.hasPhoto;
        }
    });
    Object.defineProperty(resp, 'title', {
        get: function () {
            return _pbanker.title;
        }
    });
    Object.defineProperty(resp, 'enabled', {
        get: function () {
            return _pbanker.enabled;
        }
    });
    return resp;
}());
