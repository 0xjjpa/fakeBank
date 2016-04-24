# fakeBank
Retail bank back-end simulator REST API

Stand-alone simulator does what banks do: maintains accounts, does funds transfers, etc.
Accounts, balances, transaction statements, etc. are available via simple REST API. 

# Installation
```
npm install
```



__How to try it?__

```sh

$ node app.js

```

Open http://localhost:1337 to see the results.


```

GET /accounts/ -> List all the accounts in JSON.

GET /accounts/:id -> Returns the account for the given ID

POST /accounts/:id -> Changes properties of a given account
{   
    "status": "On" || "Off",
    "isMain": false || true,
    "name": "new account name"
}




GET /accounts/:id/transactions/:dateStart/:dateEnd -> List all the transactions of the account for the given ID which happened between the given dates

POST /accounts/:id/transaction/:id -> Changes properties of a given transaction
{
    "labels": ["Food", "Unnecessary"]
}
PUT /accounts/:id/transactions/ -> Imports a new transaction record
{
    "txnType": "40",
    "typeName": "Funds transfer",
    "narrative": "Transfer from Current to Savings",
    "debit": 10,
    "credit": 0,
    "amount": -10,
    "currency": "EUR",
    "DTSValue": "Sat Dec 23 2017 14:36:05 GMT+0400 (GST)",
    "DTSBooked": "Sat Dec 23 2017 14:36:05 GMT+0400 (GST)",
    "stateId": "100",
    "transactionState": "RECONCILED",
    "reference": "123321",
    "labels": ["Transfers", "SavingForTheVacation"]
}


GET /cards/ -> List all the cards in JSON.

GET /cards/:id -> Returns the card for the given ID

POST /cards/:id -> Changes properties of the given card
{   
    "status": "On" || "Off"
}


GET /beneficiaries/ -> List all the beneficiaries in JSON.

GET /beneficiaries/:id -> Beneficiary details

DELETE /beneficiaries/:id -> Removes the beneficiary with the specified ID.

POST /beneficiaries/:id -> Edits the beneficiary with the specified ID.


POST /transfer/acc2acc -> Makes a transfer within customer's accounts.
{
    "srcAcc": "k878sg4nsrod",
    "dstAcc": "176",
    "amount": 10,
    "currency": "EUR",
    "narrative": "My funds transfer".
    "labels": []
}



OPTIONS / -> Gives the list of allowed request types.

HEAD / -> HTTP headers only, no body.

TRACE / -> Blocked for security reasons.

```
