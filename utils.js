function isDate(givenDate) {
    var d = Date.parse(givenDate);
    //returns true if given a date
    if (Object.prototype.toString.call(givenDate) === "[object Date]") {
        // it is a date
        if (isNaN(givenDate.getTime())) {
            // date is not valid
            return false;
        } else {
            // date is valid
            return true;
        }
    } else {
        // not a date
        return false;
    }
}


function isArray(givenArray) {
    //returns true if givenArray is an array
    if (Object.prototype.toString.call(givenArray) === '[object Array]') return true
    return false;
}

GLOBAL.GetRandomSTR = function (GivenLength) {
    var resp = "";
    while (resp.length < GivenLength) {
        resp += Math.random().toString(36).substr(2, GivenLength);
    }
    return resp.substring(0, GivenLength);
}


GLOBAL.GetRandomNumbers = function (GivenLength) {
    var resp = '',
        allowedChars = '1234567890',
        allowedCharsNum = allowedChars.length;
    for (var i = 0; i < GivenLength; i++) {
        resp += allowedChars[parseInt(Math.random() * allowedCharsNum)];
    }
    return resp;
}


GLOBAL.isDate = function (givenDate) {
    var d = Date.parse(givenDate);
    //returns true if given a date
    if (Object.prototype.toString.call(givenDate) === "[object Date]") {
        // it is a date
        if (isNaN(givenDate.getTime())) {
            // date is not valid
            return false;
        } else {
            // date is valid
            return true;
        }
    } else {
        // not a date
        return false;
    }
}


GLOBAL.isArray = function (givenArray) {
    //returns true if givenArray is an array
    if (Object.prototype.toString.call(givenArray) === '[object Array]') return true
    return false;
}

Date.prototype.addMinutes = function (h) {
    this.setMinutes(this.getMinutes() + h);
    return this;
};
Date.prototype.addSeconds = function (h) {
    this.setSeconds(this.getSeconds() + h);
    return this;
};