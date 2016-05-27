'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');


//GET /messages/ -> List all the messages
module.exports.all = function* list(next) {
    if ('GET' != this.method) return yield next;


    //find cards which correspond to the userId
    var msgsFromUser = yield this.app.db.messages.find({
        "authorUserId": this.request.scrap.userId
    }).exec();

    var msgsToUser = yield this.app.db.messages.find({
        "recepientUserId": this.request.scrap.userId
    }).exec();

    this.body = yield msgsFromUser.concat(msgsToUser);
};


// PUT /messages/ -> add a new message
module.exports.add = function* add(data, next) {
    if ('PUT' != this.method) return yield next;

    var resp = {
        success: false
    };

    try {
        var body = yield parse.json(this);
        if (!body || !body.text) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));

        var user = yield this.app.db.userDetails.findOne({
            "userId": this.request.scrap.userId
        }).exec();

        if (!user || user.userId !== this.request.scrap.userId) this.throw(405, "Error: can not find the user." + this.request.scrap.userId);

        var tempMsg = {};
        for (var property in body) { //blindly copy all the object properties sent in the request body
            if (body.hasOwnProperty(property)) {
                tempMsg[property] = body[property];
            }
        }

        tempMsg.DTS = new Date();
        tempMsg.authorName = user.names.join(" ");
        tempMsg.authorUserId = user.userId;
        tempMsg.isSent = true;
        tempMsg.id = GLOBAL.GetRandomSTR(12);
        var tempId = tempMsg.tempId;
        tempMsg.tempId = undefined;

        var inserted = yield this.app.db.messages.insert(tempMsg);
        if (!inserted) {
            this.throw(405, "Error: Failed adding the new message.");
        }
        console.log('added the new message');
        resp.message = inserted;
        resp.tempId = tempId;
    } catch (e) {
        console.log('error', e);
        this.throw(500, "Error: Message could not be added");
    }

    resp.success = true;
    resp.text = 'Message has been added';
    this.body = JSON.stringify(resp);
};



//POST /messages/:id -> Marks given message as sent and/or read.
//{isSent: true, isRead: false}
module.exports.modify = function* modify(id, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        var body = yield parse.json(this);
        if (!body) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));

        var msg = yield this.app.db.messages.findOne({
            "id": id,
            "recepientUserId": this.request.scrap.userId
        }).exec();

        if (!msg || !msg.id) this.throw(404, JSON.stringify({
            error: true,
            text: 'Can not find the message'
        }));

        msg.isRead = msg.isRead || body.isRead;
        msg.isSent = msg.isSent || body.isSent;

        var numChanged = yield this.app.db.messages.update({
            "id": id,
            "recepientUserId": this.request.scrap.userId
        }, msg, {});
        if (numChanged !== 1) {
            this.throw(405, "Error: Failed updating the message.");
        }

        resp.success = true;
        resp.text = 'Message was updated';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};




