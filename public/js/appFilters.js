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
        if (value === undefined) return "";
        var temp = parseFloat(value);
        if (isNaN(temp)) return "0";
        return parseFloat(value).toFixed(2);
    };
});


theApp.filter("Date", function () {
    return function (input) {
        return moment(input).format("DD.MM.YYYY");
    }
});
theApp.filter("DateShort", function () {
    return function (input) {
        return moment(input).format("DD.MM");
    }
});


theApp.filter("DateTime", function () {
    return function (input) {
        return moment(input).format("DD.MM.YYYY hh:mm:ss");
    }
});

theApp.filter("Time", function () {
    return function (input) {
        return moment(input).format("hh:mm");
    }
});
theApp.filter("TimeFull", function () {
    return function (input) {
        return moment(input).format("hh:mm:ss"); //new Date(input);
    }
});
