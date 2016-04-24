TheM.notificationsOnscreen = (function () {
    var _isLoaded = false;
    var _notifications = [];
    var _mytimer;

    var add = function (given) {
        //adds a new notificaiton to be displayed on screen

        //verify that new element does include all the properties expected from the notification
        if (!given || !given.text) return false;

        //set defaults
        given.id = given.id || GetRandomSTR(19) + _notifications.length.toString();
        given.undoable = given.undoable || false;
        given.isError = given.isError || false;
        given.DTS = given.DTS || new Date();
        if (!given.undoDetails) given.undoable = false;
        given.textLocalized = given.textLocalized || given.text; //given.textLocalized contains the .text translated to client's language
        given.TTL = given.TTL || given.DTS.addSeconds(10); //default time to live is 30 seconds ???
        console.log(given.text);
        _notifications.push(given);
        TheM.notificationsOnscreen.push(given);
        //setTimeout(purge(), 5000); //???
    }

    var purge = function () {
        //deletes expired notifications
        for (var i = _notifications.length; i > -1; i--) {
            if (_notifications[i] && _notifications[i].TTL < (new Date())) {
                console.log('purging ', _notifications[i]);
                TheM.notificationsOnscreen.removeThis(_notifications[i]);
                _notifications.removeThis(_notifications[i]);
                purge(); //recursion
                break;
            }
        }
    }

    var resp = [];
    resp.add = add;
    resp.notification = function (givenID) {
        //returns a notification with a given .id even it already has expired
        for (var i = 0; i < _notifications.length; i++) {
            if (_notifications[i].id) {
                if (_notifications[i].id == givenID) {
                    return _notifications[i];
                }
            }
        }
        return false;
    }
    Object.defineProperty(resp, 'get', {
        get: function () {
            //retrieves the latest unexpired notificaiton to be displayed on screen
            purge();
            var resp = undefined;
            for (var i = _notifications.length; i > -1; i--) {
                if (_notifications[i] && _notifications[i].TTL > (new Date())) {
                    resp = _notifications[i];
                    break;
                }
            }
            return resp;
        }
    });
    Object.defineProperty(resp, 'all', {
        get: function () {
            purge();
            return _notifications;
        }
    });
    _mytimer = setTimeout(purge, 500); //???
    return resp;
}());
