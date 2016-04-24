'use strict';
var accounts = require('./controllers/accounts');
var cards = require('./controllers/cards');
var beneficiaries = require('./controllers/beneficiaries');
var transfer = require('./controllers/transfer');
var compress = require('koa-compress');
var logger = require('koa-logger');
var serve = require('koa-static');
var route = require('koa-route');
var koa = require('koa');
var path = require('path');
var app = module.exports = koa();
//var user = require('koa-user')


var db = {},
    Datastore = require('nedb');
var wrap = require('co-ne-db');
db.tokens = new Datastore('db_tokens');
db.tokens.loadDatabase();
db.tokens = wrap(db.tokens);

// Logger
app.use(logger());


app.use(route.options('/', accounts.options));
app.use(route.trace('/', accounts.trace));
app.use(route.head('/', accounts.head));


//any route above does not require tokens
app.use(function* (next) {
    this.request.scrap = this.request.scrap || {};
    this.request.scrap.userId = undefined;
    if (this.request.headers && this.request.headers.token) {
        console.log('got token', this.request.headers.token);
        //validate if token given in the header does exist in DB. 
        var tokens = yield db.tokens.find({
            token: this.request.headers.token
        }).exec();
        if (!tokens) this.throw(500, JSON.stringify({
            error: true,
            text: "Error reading tokens"
        }));
        if (tokens.length < 1) this.throw(404, JSON.stringify({
            error: true,
            text: "Wrong token"
        }));
        console.log('validated token', this.request.headers.token, 'belongs to userId', tokens[0].userId);
        this.request.scrap.userId = tokens[0].userId;
    } else {
        this.throw(404, JSON.stringify({
            error: true,
            text: "No token in the header"
        }));
    }
    yield next;
});
//any route below does require tokens


app.use(route.get('/accounts/', accounts.all));
app.use(route.get('/accounts/:id', accounts.fetch));
app.use(route.post('/accounts/:id', accounts.modify));
app.use(route.put('/accounts/', accounts.add));

//GET /accounts/:id/transactions/:dateStart/:dateEnd -> List all the transactions of the account for the given ID which happened between the given dates
app.use(route.get('/accounts/:id/transactions/:dateStart/:dateEnd', accounts.transactions));
app.use(route.put('/accounts/:id/transactions/', accounts.transactionAdd));
app.use(route.post('/accounts/transactions/:id', accounts.transactionModify));


//GET /cards/ -> List all the cards in JSON.
app.use(route.get('/cards/', cards.all));
//GET /cards/:id -> Returns the card for the given ID
app.use(route.get('/cards/:id', cards.fetch));
//POST /cards/:id -> Changes properties of the given card
app.use(route.post('/cards/:id/:onoff', cards.onoff));
app.use(route.post('/cards/:id', cards.modify));
//PUT /cards/ -> Creates a new card
app.use(route.put('/cards/', cards.add));


//GET /beneficiaries/ -> List all the beneficiaries in JSON.
app.use(route.get('/beneficiaries/', beneficiaries.all));
//GET /beneficiaries/:id -> Returns the beneficiary for the given ID
app.use(route.get('/beneficiaries/:id', beneficiaries.fetch));
//POST /beneficiaries/:id -> Edits the beneficiary with the specified ID.
app.use(route.post('/beneficiaries/:id', beneficiaries.modifyBeneficiary));
//DELETE /beneficiaries/:id -> Removes the beneficiary with the specified ID.
app.use(route.delete('/beneficiaries/:id', beneficiaries.deleteBeneficiary));

//POST /transfer/acc2acc -> Makes a transfer
app.use(route.post('/transfer/acc2acc', transfer.acc2acc));



// Serve static files
app.use(serve(path.join(__dirname, 'public')));

// Compress
app.use(compress());

if (!module.parent) {
    app.listen(1337);
    console.log('listening on port 1337');
}
