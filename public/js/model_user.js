TheM.user = (function () {
    var _username = undefined;
    var _id = undefined;
    var _isAuthenticated = false;
    var _homecurrency = 'EUR';

    var aUpdate = function () {
        // if (aUpdate.isWorking) return aUpdate.intPromise;
        if ((new Date() - aUpdate.DTSUpdated) < aUpdate.msecToExpiry) return Promise.resolve();
        if (!aUpdate.intPromise || ((new Date() - aUpdate.DTSUpdated) > aUpdate.msecToExpiry)) aUpdate.intPromise = new Promise(
            function resolver(resolve, reject) {
                aUpdate.isWorking = true;
                myAWS.DoCall('GET','user', {}, function (data) {
                    data = JSON.parse(data);
                    _username = data.name;
                    _id = data.userId;
                    aUpdate.DTSUpdated = new Date();
                    aUpdate.isWorking = false;
                    resolve(data);
                }, function () {
                    aUpdate.isWorking = false;
                    reject({
                        error: true,
                        errorMessage: 'Could not get user details'
                    });
                });
            }
        );
        return aUpdate.intPromise;
    };
    aUpdate.isWorking = false;
    aUpdate.msecToExpiry = 30000; //???
    aUpdate.DTSUpdated = new Date('1/1/1980');
    aUpdate.intPromise = null;

    var goFetchAll = function () {
        //loads whatever it can from the localstorage, initiates updates
        TheM.doLoad();
        TheM.user.doUpdate();
        if (TheM.accounts) TheM.accounts.doUpdate();
        if (TheM.cards) TheM.cards.doUpdate();
        if (TheM.beneficiaries) TheM.beneficiaries.doUpdate();
        if (TheM.restrictions) TheM.restrictions.doUpdate();
        if (TheM.fxrates) TheM.fxrates.doUpdate();
        if (TheM.pbanker) TheM.pbanker.doUpdate();
    }

    var goLogin = function (GivenCredentials) {
        if (goLogin.isWorking) return goLogin.intPromise;
        if (!goLogin.intPromise) goLogin.intPromise = new Promise(
            function resolver(resolve, reject) {
                goLogin.isWorking = true;
                myAWS.DoCall('fake_authenticate.json', GivenCredentials, function (data) {
                    _isAuthenticated = true;
                    goLogin.isWorking = false;
                    goLogin.intPromise = null; //put promise to null so each new call would trigger separate aws call
                    resolve(data);
                }, function () {
                    goLogin.isWorking = false;
                    goLogin.intPromise = null; //put promise to null so each new call would trigger separate aws call
                    reject({
                        error: true,
                        errorMessage: 'Could not authenticate'
                    });
                });
            }
        );
        return goLogin.intPromise;
    };
    goLogin.isWorking = false;
    goLogin.intPromise = null;
    var goLogout = function () {};

    var resp = {
        doUpdate: aUpdate,
        doLogin: goLogin,
        doLogout: goLogout,
        doFetchAll: goFetchAll
    };

    Object.defineProperty(resp, 'id', {
        get: function () {
            return _id;
        }
    });
    Object.defineProperty(resp, 'name', {
        get: function () {
            return _username;
        }
    });
    Object.defineProperty(resp, 'homecurrency', {
        get: function () {
            return _homecurrency;
        }
    });
    Object.defineProperty(resp, 'isAuthenticated', {
        get: function () {
            return _isAuthenticated;
        }
    });

    return resp;
}());
