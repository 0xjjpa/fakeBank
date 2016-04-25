'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');




function* fetchAccounts(givenUserId) {
    var resp = {};
    resp = yield db.accounts.find({
        "userId": givenUserId
    }).exec();
    console.log('got', resp.length, 'accounts for userId', givenUserId);
    return resp;
}



//GET /user -> Returns user details
module.exports.fetch = function* fetch(id, next) {
    if ('GET' != this.method) return yield next;

    var user = yield this.app.db.userDetails.findOne({
        "userId": this.request.scrap.userId
    }).exec();

    if (!user || user.userId !== this.request.scrap.userId) this.throw(404, JSON.stringify({
        error: true,
        text: "Error: can't find the user"
    }));
    this.body = yield user;
};

//PUT /user -> Adds a new user
//Requires "name", "userName" and "password" in the request body
module.exports.add = function* add(data, next) {
    //adds a new user
    if ('PUT' != this.method) return yield next;

    var resp = {
        success: false
    };

    try {
        var body = yield parse.json(this);
        if (!body || !body.name || !body.userName || !body.password) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));

        var tempUser = {};

        tempUser.userName = body.userName;
        tempUser.userId = GLOBAL.GetRandomSTR(12);
        tempUser.password = body.password;

        var inserted = yield this.app.db.users.insert(tempUser);
        console.log('added the new user');
        if (!inserted || inserted < 1) {
            this.throw(405, "Error: User could not be added.");
        }

        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                tempUser[property] = body[property];
            }
        }
        delete tempUser.password;

        tempUser.isActive = body.isActive || true;
        tempUser.DTSCreated = body.DTSCreated || new Date();
        tempUser.DTSModified = body.DTSModified || new Date();
        tempUser.homeCurrency = body.homecurrency || GLOBAL.homeCurrency;
        tempUser.mobile = body.mobile || "";


        var inserted = yield this.app.db.userDetails.insert(tempUser);
        console.log('added the new user details');
        if (!inserted || inserted < 1) {
            this.throw(405, "Error: Failed registering user details.");
        }
    } catch (e) {
        console.log('error', e);
        this.throw(500, "Error: user could not be added!");
    }

    resp.success = true;
    resp.text = 'User has been added';
    this.body = JSON.stringify(resp);
};



//POST /user/:id -> Changes details of the given user.
module.exports.modify = function* modify(id, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        //find user which correspond to the userId
        var user = yield this.app.db.userDetails.findOne({
            "userId": this.request.scrap.userId
        }).exec();

        if (!user.userId) this.throw(404, JSON.stringify({
            error: true,
            text: 'User not found'
        }));

        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");
        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                user[property] = body[property];
            }
        }

        var numChanged = yield this.app.db.userDetails.update({
            "userId": id
        }, user, {});

        resp.success = true;
        resp.text = 'User details have been changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};




//POST /user/password -> Changes user's password.
//requires currentPassword and newPassword in the request body
module.exports.passwordChange = function* passwordChange(id, next) {
    if ('POST' != this.method) return yield next;
    //TODO 111222
    var resp = {};
    resp.success = false;
    try {
        //find user which correspond to the userId
        var user = yield this.app.db.users.findOne({
            "userId": this.request.scrap.userId
        }).exec();

        if (!user.userId) this.throw(404, JSON.stringify({
            error: true,
            text: 'User not found'
        }));

        var body = yield parse.json(this);
        if (!body || !body.currentPassword || !body.newPassword) this.throw(405, "Error, request body is empty");

        if (user.password!==!body.currentPassword) this.throw(405, "Error, wrong password");
        user.password = body.newPassword;
        var numChanged = yield this.app.db.users.update({
            "userId": id
        }, user, {});

        resp.success = true;
        resp.text = 'User details have been changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};
