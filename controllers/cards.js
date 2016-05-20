'use strict';
var parse = require('co-body');
//var co = require('co');
require('../utils.js');


//GET /cards/ -> List all the cards in JSON.
module.exports.all = function* list(next) {
    if ('GET' != this.method) return yield next;

    //this.request.scrap.userId should have the user id which corresponds to the token 

    //find cards which correspond to the userId
    var cards = yield this.app.db.cards.find({
        "userId": this.request.scrap.userId
    }).exec();

    //return them all
    this.body = yield cards;
};


//GET /cards/:id -> Returns the card of the given ID
module.exports.fetch = function* fetch(id, next) {
    if ('GET' != this.method) return yield next;
    //find accounts which correspond to the userId

    var card = yield this.app.db.cards.findOne({
        "userId": this.request.scrap.userId,
        "id": id
    }).exec();

    if (!card || card.id !== id) this.throw(404, JSON.stringify({
        error: true,
        text: "Error: can't find the card"
    }));
    this.body = yield card;
};


module.exports.add = function* add(data, next) {
    //adds a new card 
    if ('PUT' != this.method) return yield next;

    var resp = {
        success: false
    };

    try {
        var body = yield parse.json(this);
        if (!body || !body.type) this.throw(404, JSON.stringify({
            error: true,
            text: 'Not enough parameters in the request body'
        }));

        var accounts = yield this.app.db.accounts.find({
            "userId": this.request.scrap.userId
        }).exec();


        var tempCard = {
            "userId": body.userId || this.request.scrap.userId,
            "id": GLOBAL.GetRandomSTR(12),
            "name": body.name || body.type,
            "status": body.status || "active",
            "isActive": body.isActive || true,
            "type": body.type,
            "productTypeId": body.typeId,
            "num": body.num || '4' + GetRandomNumbers(3) + '...' + GetRandomNumbers(4),
            "DTSExpiry": body.DTSExpiry || new Date((new Date()).setDate((new Date()).getDate() + 365 * 5)),
            "DTSOpened": body.DTSOpened || new Date(),
            "accountsLinked": [{
                "id": accounts[0].id
            }]
        }
        var inserted = yield this.app.db.cards.insert(tempCard);
        console.log('added the new card');
        if (!inserted) {
            this.throw(405, "Error: Card could not be added.");
        }
    } catch (e) {
        console.log('error', e);
        this.throw(500, "Error: Card could not be added!");
    }

    resp.success = true;
    resp.text = 'Card has been added';
    this.body = JSON.stringify(resp);
};



//POST /cards/:id -> Changes properties of a given card.
//send name parameters in the body
module.exports.modify = function* modify(id, next) {
    if ('POST' != this.method) return yield next;

    var resp = {};
    resp.success = false;
    try {
        //find cards which correspond to the userId
        var card = yield this.app.db.cards.findOne({
            "userId": this.request.scrap.userId,
            "id": id
        }).exec();

        if (!card.id) this.throw(404, JSON.stringify({
            error: true,
            text: 'Card not found'
        }));

        var body = yield parse.json(this);
        if (!body) this.throw(405, "Error, request body is empty");
        card.name = body.name || card.name;
        card.accountsLinked = body.accountsLinked || card.accountsLinked;

        var numChanged = yield this.app.db.cards.update({
            "id": id
        }, card, {});

        resp.success = true;
        resp.text = 'Card details have been changed';
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};






module.exports.onoff = function* onoff(id, onoff, next) {
    if ('POST' != this.method) return yield next;
    var resp = {};
    resp.success = false;
    try {

        var card = yield this.app.db.cards.findOne({
            "userId": this.request.scrap.userId,
            "id": id
        }).exec();

        if (!card || card.id !== id) this.throw(404, JSON.stringify({
            error: true,
            text: "Error: can't find the card"
        }));

        if (onoff === "off") {
            card.status = 'blocked';
            card.isActive = false;
        }
        if (onoff === "on") {
            card.status = 'active';
            card.isActive = true;
        }
        var numChanged = yield this.app.db.cards.update({
            "id": id
        }, card, {});

        resp.success = true;
        resp.isActive = card.isActive;
        resp.status = card.status;
        this.body = JSON.stringify(resp);
    } catch (e) {
        resp.text = "Error parsing JSON";
        console.log(e);
        this.throw(405, "Error parsing JSON.");
    }
};
