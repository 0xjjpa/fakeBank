console.log('Generating fake transactions');
//run this once a month to generate transactions
//Transactions get stored in a db_future table


var accountId = process.argv[2];
var monthShift = process.argv[3] || 0;
if (!accountId) console.log('no account'); //TODO: break if no account given

var fs = require('fs');
var templates = JSON.parse(fs.readFileSync('transaction_templates.json', 'utf8'));

var TempDate = new Date();

var Year = (TempDate).getFullYear();
var Month = (TempDate).getMonth() - monthShift ;
var daysInMonth = getDaysInMonth(Month + 1, Year);

var tempArray = [];
var counter = 0;
console.log(templates.length, 'templates loaded');
for (var i = 0; i < templates.length; i++) {
    var temp = templates[i];

    for (var ee = 0; ee < temp.nPerMonth; ee++) {
        if (temp.probability > Math.random()) {
            var tempRecord = {};
            tempRecord.accountId = accountId;
            tempRecord.amount = Math.random() * (temp.amountMax - temp.amountMin) + temp.amountMin;
            if (temp.integer) tempRecord.amount = Math.floor(tempRecord.amount);
            tempRecord.amount = parseFloat(tempRecord.amount.toFixed(2));
            tempRecord.currency = temp.currency;
            var dayOfMonth = Math.floor(1 + (daysInMonth - 1) * Math.random());
            tempRecord.narrative = temp.narrative;
            tempRecord.txnType = temp.txnType;
            tempRecord.type = temp.type;
            tempRecord.DTSValue = new Date(Year, Month, dayOfMonth);
            tempRecord.DTSValue.setMinutes(24 * 60 * Math.random());
            tempRecord.DTSBooked = new Date(tempRecord.DTSValue.getTime());
            tempRecord.DTSBooked.setMinutes(tempRecord.DTSValue.getMinutes() + 12 * 60 * Math.random());
            if (tempRecord.amount > 0) {
                tempRecord.credit = tempRecord.amount;
                tempRecord.debit = 0;
            }
            if (tempRecord.amount <= 0) {
                tempRecord.credit = 0;
                tempRecord.debit = tempRecord.amount;
            }
            tempRecord.reference = GetRandomSTR(10);
            tempRecord.transactionId = GetRandomSTR(10);
            tempRecord.stateId = "100";
            tempRecord.labels = [];
            tempRecord.transactionState = "RECONCILED";
            // console.log(counter++, (ee + 1) + "/" + temp.nPerMonth, tempRecord.DTSValue, tempRecord.narrative);
            tempArray.push(tempRecord);
        }
    }
}

for (i = 0; i < tempArray.length; i++) {
    console.log(tempArray[i].DTSValue, tempArray[i].narrative)
}


//console.log(Resp);

var Datastore = require('nedb'),
    db = new Datastore({
        filename: 'db_future',
        autoload: true
    });

db.insert(tempArray, function (err, newDoc) {
    console.log('Transactions were written into the db_future');
});


//fs.writeFile("92999.json", JSON.stringify(tempArray), function (err) {
//    if (err) {
//        return console.log(err);
//    }
//    console.log("The file was saved!");
//});



function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}


function GetRandomSTR(GivenLength) {
    var resp = "";
    while (resp.length < GivenLength) {
        resp += Math.random().toString(36).substr(2, GivenLength);
    }
    return resp.substring(0, GivenLength);
}
