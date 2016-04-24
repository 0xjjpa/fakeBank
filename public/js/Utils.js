"use strict";
console.log("utils started");
if (!Global) var Global = {};
Global.loading = 0;

Date.prototype.addMinutes = function (h) {
    this.setMinutes(this.getMinutes() + h);
    return this;
};
Date.prototype.addSeconds = function (h) {
    this.setSeconds(this.getSeconds() + h);
    return this;
};

function IsItaTime(GivenTime, GivenPeriod) {
    //true if GivenPeriod has passed since GivenTime
    if (!GivenTime) {
        GivenTime = new Date(10, 10, 1978);
    }
    if (new Date() - GivenTime > GivenPeriod) {
        return true;
    }
    return false;
}

function MergeObjects(GivenOld, GivenNew) {
    //copies all properties of GivenNew into GivenOld
    if (!GivenOld) return false;
    if (!GivenNew) return false;
    for (var prop in GivenNew) {
        if (GivenNew.hasOwnProperty(prop)) {
            GivenOld[prop] = owl.deepCopy(GivenNew[prop]);
        }
    }
}

function DeDupAndAdd(GivenOld, GivenNew, propertyName) {
    //merges two arrays. checks dublicates by checking propertyName fields.
    if ((!GivenOld) || (!GivenNew)) {
        return false;
    }
    if (!propertyName) propertyName = "id";

    for (var EE = 0; EE < GivenNew.length; EE++) {
        var Found = false;
        if (GivenNew[EE]) {
            if (GivenNew[EE][propertyName]) {
                for (var RR = 0; RR < GivenOld.length; RR++) {
                    if (GivenOld[RR]) {
                        if (GivenOld[RR][propertyName] && GivenNew[EE][propertyName] && GivenOld[RR][propertyName] === GivenNew[EE][propertyName]) {
                            GivenOld[RR] = owl.deepCopy(GivenNew[EE]); //replace object if ID found
                            Found = true;
                        }
                    }
                }
            }
            if (!Found) {
                GivenOld.push(GivenNew[EE]); //add the record as it is new
            }
        }
    }
    return true;
}

function GetRandomSTR(GivenLength) {
    var resp = "";
    while (resp.length < GivenLength) {
        resp += Math.random().toString(36).substr(2, GivenLength);
    }
    return resp.substring(0, GivenLength);
}

function CleanUpAmount(GivenDirty) {
    //extracts amount from the GivenDirty string, returns it as a string
    if (!GivenDirty) {
        GivenDirty = 0;
    };
    GivenDirty = (GivenDirty + "").replace(/^0+/, '').replace(/[^\d.-]/g, '');
    if (Math.round(GivenDirty) !== +(GivenDirty)) {
        GivenDirty = (+(GivenDirty)).toFixed(2);
    }
    if (isNaN(GivenDirty)) {
        GivenDirty = 0;
        Array.min = function (array) {
            return Math.min.apply(Math, array);
        };
    };
    return GivenDirty;
};

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function (from, to) {
    var rest = this.slice((to || from) + 1 || this.length);
    this.length = from < 0 ? this.length + from : from;
    return this.push.apply(this, rest);
    //// Remove the second item from the array
    //array.remove(1);
    //// Remove the second-to-last item from the array
    //array.remove(-2);
    //// Remove the second and third items from the array
    //array.remove(1,2);
    //// Remove the last and second-to-last items from the array
    //array.remove(-2,-1);
};

Array.prototype.min = function () {
    return Math.min.apply(Math, this);
};

Array.prototype.contains = function (obj) {
    //does this array contain the given object?
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}

Array.prototype.removeThis = function (obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            this.remove(i);
            return true;
        }
    }
    return false;
}


window.myAWS = (function () {
    //provides write-only properties myAWS.accessKeyId and myAWS.secretAccessKey
    //myAWS.DoCall does the AWS comms, invokes callback if successful
    var username = "not yet defined";
    var _initalized = false;

    function init() {
        _initalized = true;
        console.log('initialized');
    }

    function DoCall(RequestType, FunctionName, Payload, callback, errorcallback) {
        //FunctionName is lambda name, Payload is object to be sent to lambda
        if (!_initalized) init();
        if (!FunctionName) throw "No FunctionName";

        var params = {
            FunctionName: FunctionName,
            Payload: JSON.stringify(Payload)
        };
        console.log('doing a back-end call ' + RequestType, params);
        var request = new XMLHttpRequest();


        request.open(RequestType, 'http://api.localhost:1337/' + FunctionName);
        request.onload = function () {
            TheM.loading--;
            TheM.loadingWhat.removeThis(temp);
            if (request.status == 200) {
                console.log('Back-end replied for ' + FunctionName, request);
                callback(request.response); // we got data here, so resolve the Promise
            } else {
                errorcallback(request.statusText); // status is not 200 OK, so reject
            }
        };
        request.onerror = function () {
            TheM.loading--;
            TheM.loadingWhat.removeThis(temp);
            errorcallback(request.statusText); // error occurred, reject the  Promise
        };
        request.setRequestHeader("token", "mytoken");

        request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        //
        var parameters =  JSON.stringify(Payload);

        TheM.loading++;
        var temp = GetRandomSTR(6) + FunctionName;
        TheM.loadingWhat.push(temp);
        request.send(parameters);
        console.log('Back-end invoked, awaiting ' + FunctionName, Payload);
    }

    var resp = {
        DoCall: DoCall
    };

    Object.defineProperty(resp, 'accessKeyId', {
        set: function (val) {
            _accessKeyId = val;
            return true;
        }
    });
    Object.defineProperty(resp, 'secretAccessKey', {
        set: function (val) {
            _secretAccessKey = val;
            init();
            return true;
        }
    });
    return resp;
}());

var Base64 = {
    _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
    encode: function (e) {
        var t = "";
        var n, r, i, s, o, u, a;
        var f = 0;
        e = Base64._utf8_encode(e);
        while (f < e.length) {
            n = e.charCodeAt(f++);
            r = e.charCodeAt(f++);
            i = e.charCodeAt(f++);
            s = n >> 2;
            o = (n & 3) << 4 | r >> 4;
            u = (r & 15) << 2 | i >> 6;
            a = i & 63;
            if (isNaN(r)) {
                u = a = 64
            } else if (isNaN(i)) {
                a = 64
            }
            t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a)
        }
        return t
    },
    decode: function (e) {
        var t = "";
        var n, r, i;
        var s, o, u, a;
        var f = 0;
        e = e.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        while (f < e.length) {
            s = this._keyStr.indexOf(e.charAt(f++));
            o = this._keyStr.indexOf(e.charAt(f++));
            u = this._keyStr.indexOf(e.charAt(f++));
            a = this._keyStr.indexOf(e.charAt(f++));
            n = s << 2 | o >> 4;
            r = (o & 15) << 4 | u >> 2;
            i = (u & 3) << 6 | a;
            t = t + String.fromCharCode(n);
            if (u != 64) {
                t = t + String.fromCharCode(r)
            }
            if (a != 64) {
                t = t + String.fromCharCode(i)
            }
        }
        t = Base64._utf8_decode(t);
        return t
    },
    _utf8_encode: function (e) {
        e = e.replace(/\r\n/g, "\n");
        var t = "";
        for (var n = 0; n < e.length; n++) {
            var r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r)
            } else if (r > 127 && r < 2048) {
                t += String.fromCharCode(r >> 6 | 192);
                t += String.fromCharCode(r & 63 | 128)
            } else {
                t += String.fromCharCode(r >> 12 | 224);
                t += String.fromCharCode(r >> 6 & 63 | 128);
                t += String.fromCharCode(r & 63 | 128)
            }
        }
        return t
    },
    _utf8_decode: function (e) {
        var t = "";
        var n = 0;
        var r = c1 = c2 = 0;
        while (n < e.length) {
            r = e.charCodeAt(n);
            if (r < 128) {
                t += String.fromCharCode(r);
                n++
            } else if (r > 191 && r < 224) {
                c2 = e.charCodeAt(n + 1);
                t += String.fromCharCode((r & 31) << 6 | c2 & 63);
                n += 2
            } else {
                c2 = e.charCodeAt(n + 1);
                c3 = e.charCodeAt(n + 2);
                t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63);
                n += 3
            }
        }
        return t
    }
}
