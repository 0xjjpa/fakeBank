"use strict";

console.log("app starts");

// Create Base64 Object

var URLPrefix = "/templates/"; //"/mybank";

var theApp = theApp || angular.module("theApp", ["ngRoute"])
    .config(function ($routeProvider) {

        $routeProvider.when("/main", {
            templateUrl: URLPrefix + "main.html"
        });
        $routeProvider.when("/search", {
            templateUrl: URLPrefix + "/search.html"
        });
        $routeProvider.when("/statement", {
            templateUrl: URLPrefix + "statement.html"
        });
        $routeProvider.when("/cashwithdrawal", {
            templateUrl: URLPrefix + "CashWithdrawal.html"
        });
        $routeProvider.when("/cashdeposit", {
            templateUrl: URLPrefix + "CashDeposit.html"
        });
        $routeProvider.when("/chequedeposit", {
            templateUrl: URLPrefix + "ChequeDeposit.html"
        });
        $routeProvider.when("/utilities", {
            templateUrl: URLPrefix + "Utilities.html"
        });
        $routeProvider.when("/loans", {
            templateUrl: URLPrefix + "Loans.html"
        });
        $routeProvider.when("/deposits", {
            templateUrl: URLPrefix + "Deposits.html"
        });
        $routeProvider.when("/beneficiary", {
            templateUrl: URLPrefix + "beneficiary.html"
        });
        $routeProvider.when("/beneficiaryrename", {
            templateUrl: URLPrefix + "beneficiaryrename.html"
        });
        $routeProvider.when("/messages", {
            templateUrl: URLPrefix + "/messages.html"
        });
        $routeProvider.when("/writeacheque", {
            templateUrl: URLPrefix + "/writeacheque.html"
        });
        $routeProvider.when("/newproduct", {
            templateUrl: URLPrefix + "/newproduct.html"
        });
        $routeProvider.when("/newbeneficiary", {
            templateUrl: URLPrefix + "/newbeneficiary.html"
        });
        $routeProvider.when("/newbeneficiarysamebank", {
            templateUrl: URLPrefix + "/newbeneficiarysamebank.html"
        });
        $routeProvider.when("/editbeneficiarysamebank", {
            templateUrl: URLPrefix + "/editbeneficiarysamebank.html"
        });
        $routeProvider.when("/newbeneficiarymobiletopup", {
            templateUrl: URLPrefix + "/newbeneficiarymobiletopup.html"
        });
        $routeProvider.when("/newbeneficiaryschools", {
            templateUrl: URLPrefix + "/newbeneficiaryschools.html"
        });
        $routeProvider.when("/newbeneficiaryutilities", {
            templateUrl: URLPrefix + "/newbeneficiaryutilities.html"
        });
        $routeProvider.when("/newbeneficiaryotheruae", {
            templateUrl: URLPrefix + "/newbeneficiaryotheruae.html"
        });
        $routeProvider.when("/settings", {
            templateUrl: URLPrefix + "settings.html"
        });
        $routeProvider.when("/topup", {
            templateUrl: URLPrefix + "/topup.html"
        });
        $routeProvider.when("/card", {
            templateUrl: URLPrefix + "/card.html"
        });
        $routeProvider.when("/bill", {
            templateUrl: URLPrefix + "/Bill.html"
        });
        $routeProvider.when("/topupcard", {
            templateUrl: URLPrefix + "/topupcard.html"
        });
        $routeProvider.when("/topupchequemail", {
            templateUrl: URLPrefix + "/topupchequemail.html"
        });
        $routeProvider.when("/topupchequescan", {
            templateUrl: URLPrefix + "/topupchequescan.html"
        });
        $routeProvider.when("/ATMs", {
            templateUrl: URLPrefix + "/ATMs.html"
        });
        $routeProvider.when("/changepassword", {
            templateUrl: URLPrefix + "/changepassword.html"
        });
        $routeProvider.when("/changeemail", {
            templateUrl: URLPrefix + "/changeemail.html"
        });
        $routeProvider.when("/fundstransfer", {
            templateUrl: URLPrefix + "fundstransfer.html"
        });
        $routeProvider.when("/emailandphone", {
            templateUrl: URLPrefix + "/emailandphone.html"
        });
        $routeProvider.when("/personaldetails", {
            templateUrl: URLPrefix + "/personaldetails.html"
        });
        $routeProvider.when("/fxrates", {
            templateUrl: URLPrefix + "/fxrates.html"
        });
        $routeProvider.otherwise({
            templateUrl: URLPrefix + "main.html"
        });
    });

var theDataURL = "../SampleData/";








theApp.controller("MainController", function ($scope, $location) {

});


theApp.controller("StatementController", function ($scope, $location, $q) {

    var requestedAccID;
    if ($location.search().id) {
        requestedAccID = $location.search().id;
    } else {
        $location.path("/");
    }

    //go fetch latest data for the account

    $scope.accountSelected = requestedAccID;

    var Found = false;
    if (!TheM.accounts.account(requestedAccID)) {
        //account was not found
        console.log("ERROR: Can't find account the statement was requested for");
        $location.path("/");
    }

    $scope.account  = TheM.accounts.account(requestedAccID);
    TheM.accounts.account(requestedAccID).transactions.doUpdate();

});


theApp.controller("GeneralController", function ($window, $scope, $interval, $q) {
    $scope.TheM = TheM;

    $scope.go = function (where) {
        $window.location.href = where;
    }

    document.addEventListener("eventModelUpdate", handlermodelUpdate, false);

    function handlermodelUpdate(e) {
        $scope.$apply();
        //TODO @@@ Being called too often, event is being rased even if there is no need to fetch data
    }
});



theApp.controller("FundsTransferController", function ($scope, $location) {

});


theApp.controller("FXConverterController", function ($scope) {
    $scope.fxconvertSrc = model.baseCurrency;
    $scope.fxconvertDst = model.fxrates[1].dst;
    $scope.fxconvertAmount = 100;

    $scope.fxconvert = function () {
        //TODO!!! Add error checking here
        $scope.fxconvertresult = model.ConvertCurrency($scope.fxconvertDst, $scope.fxconvertAmount, $scope.fxconvertSrc);
    }
    $scope.fxconvert();
});


theApp.filter("fraction", function () {
    return function (value, reverse) {
        return (value + "").split(".")[1] || "00";
    };
});

theApp.filter("abs", function () {
    return function (value, reverse) {
        return (value + "").split(".")[0] || "0";
    };
});

theApp.filter("money", function () {
    return function (value, reverse) {
        return value.toFixed(2);
    };
});

theApp.filter("Date", function () {
    return function (input) {
        return moment(input).format("DD.MM.YYYY"); //new Date(input);
    }
});
theApp.filter("DateTime", function () {
    return function (input) {
        return moment(input).format("DD.MM.YYYY hh:mm:ss"); //new Date(input);
    }
});
theApp.filter("Time", function () {
    return function (input) {
        return moment(input).format("hh:mm"); //new Date(input);
    }
});
theApp.filter("TimeFull", function () {
    return function (input) {
        return moment(input).format("hh:mm:ss"); //new Date(input);
    }
});
