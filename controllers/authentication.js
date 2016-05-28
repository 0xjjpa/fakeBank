'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');


//GET /authenticate/ -> Login
//{"userName": "myuserid", "password": "mysecretpassword"}
//{"userName": "myuserid", "password": "mysecretpassword", "channel":"web"}
module.exports.login = function* login(next) {
    if ('POST' != this.method) return yield next;
    var resp = {};
    resp.success = false;
    resp.text = 'Strange';

    var body = yield parse.json(this);
    if (!body) this.throw(404, JSON.stringify({
        error: true,
        text: 'No body'
    }));
    if (!body.userName) this.throw(404, JSON.stringify({
        error: true,
        text: 'No userName'
    }));
    if (!body.password) this.throw(404, JSON.stringify({
        error: true,
        text: 'No password'
    }));
    body.channel = body.channel || "web";

    //find the user
    var user = yield this.app.db.users.findOne({
        "userName": body.userName,
        "password": body.password
    }).exec();

    if (!user || !user.userId) {
        //username and/or password are wrong
        resp.success = false;
        resp.text = 'Can not authenticate';
    } else {
        console.log('got user');
        //username and password are correct
        var newTokenObj = {};
        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                newTokenObj[property] = body[property];
            }
        }
        newTokenObj.token = GLOBAL.GetRandomSTR(20);
        newTokenObj.DTS = new Date();
        newTokenObj.userId = user.userId;
        newTokenObj.chanel = body.channel;

        var numChanged = yield this.app.db.tokens.update({
            "userId": newTokenObj.userId,
            "channel": newTokenObj.chanel
        }, newTokenObj, {
            upsert: true
        });

        if (numChanged !== 1) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: can't create a session"
        }));

        resp.success = true;
        resp.text = 'Authenticated';
        resp.token = newTokenObj.token;
        newTokenObj = {};
    }

    this.body = JSON.stringify(resp);
};
