# fakeBank
Retail bank back-end simulator REST API

Stand-alone simulator does what banks do: maintains accounts, does funds transfers, etc.
Accounts, balances, transaction statements, etc. are available via simple REST API. 

# Installation

pull the repository, then do
```
npm install
```

```sh

node app.js

```

Open http://localhost:5000 to see the results.



# Demo

http://peaceful-stream-14264.herokuapp.com/



# Examples

```

GET /accounts/ -> List all the accounts in JSON.

GET /accounts/:id -> Returns the account for the given ID

POST /accounts/:id -> Changes properties of a given account
{   
    "status": "On" || "Off",
    "isMain": false || true,
    "name": "new account name"
}

PUT /accounts/ -> Imports an account
{
    "type":"Current",
    "typeId":505
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

DELETE /accounts/:id -> Closes the given account. Remaining balance gets credited to other account if dstAcc is given, otherwise gets discarded 
{
    "dstAcc": "111000" //account id
}

GET /cards/ -> List all the cards in JSON.

GET /cards/:id -> Returns the card for the given ID

POST /cards/:id -> Changes properties of the given card
{   
    "name": "my debit card",
    "accountsLinded": ['accountId1',''accountId2']
}

POST /cards/:id/off -> turns card off

POST /cards/:id/on -> turns card on

PUT /cards/ -> Creates a new card
{
    "type":"Debit card",
    "typeId":"1001"
}





GET /beneficiaries/ -> List all the beneficiaries in JSON.

GET /beneficiaries/:id -> Beneficiary details

DELETE /beneficiaries/:id -> Removes the beneficiary with the specified ID.

POST /beneficiaries/:id -> Edits the beneficiary with the specified ID.

PUT /beneficiaries/ -> Creates a new beneficiary

POST /transfer/acc2acc -> Makes a transfer within customer's accounts.
{
    "srcAcc": "k878sg4nsrod",
    "dstAcc": "176",
    "amount": 10,
    "currency": "EUR",
    "narrative": "My funds transfer".
    "labels": []
}

POST /transfer/acc2ben/:beneficiaryId -> Makes a transfer to a predefined beneficiary
{
    "amount": 10, "currency": "EUR"
}
{
    "amount": 10, "currency": "EUR", "srcAcc": "10001", "narrativeDestination": "Payment for May", "narrative": "Payment to my greedy landlord"
}
Supports two types of transactions: intrabank transfer and transfer to PayPal. Transaction type is indicated in beneficiary type.

POST /transfer/card2acc -> Debits other bank's card, credits user's account
{
    "dstAcc": "k878sg4nsrod", //id of the account to be credited
    "cardnumber": "1234567890123456",  //PAN to be debited
    "expiryMonth": "12",
    "expiryYear": "25",
    "cvv": "222",
    "nameoncard": "John Doe",
    "amount": 100,
    "currency": "EUR"
}


GET /user/ -> User details in JSON.

POST /user/ -> Change user's details.

POST /user/password -> Change user's password.


GET /rates/ -> Currency rates in JSON.

POST /rates/ -> Adds or modifies existing rate.
{   
    "src": "EUR",
    "dst": "USD",
    "rate": 0.82,
    "buy": 0.8118,
    "sell": 0.8282,
    "DTSRefreshed": "2016-02-26T11:52:06.399Z",
    "isCommon": true
}



PUT /requests/ -> Adds new generic request. Chequebook requests, address changes, loan applications, etc.
{            
    "requestTypeId": "New request" //request type
    "someData": "anything"
}
Generic requests to be saved into DB for further processing.
Some are hardcoded to be processed immediately.
For example, requests with requestTypeId==="New savings account" would open a new account for the user.
{            
    "requestTypeId": "New savings account",
    "typeName": "SAVINGS",
    "typeId": "506",
    "currency": "EUR"
}




GET /messages/ -> List all the messages from and to the user.

PUT /messages/ -> Adds a new message
{"text": "New message from client to the personal banker"}
{"text": "Reply from personal banker to the client", "recepientUserId": "002"}

POST /messages/:id -> Marks given message as sent and/or read.
{
    "isSent": true,
    "isRead": false
}




OPTIONS / -> Gives the list of allowed request types.

HEAD / -> HTTP headers only, no body.

TRACE / -> Blocked for security reasons.


```

# License

MIT License

Copyright (c) 2016 Alibek Junisbayev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
