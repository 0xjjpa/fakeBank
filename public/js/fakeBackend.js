console.log('fake back-end started');

var fakeBackEnd = (function () {
    var _SessionCreated = false;

    function doinvoke(FunctionName, Payload) {
        if (FunctionName === 'Authenticate') {
            if (Payload && Payload.userName && Payload.userName === 'alibek' && Payload.password && Payload.password === 'qa') {
                console.log('fake authentication');
                _SessionCreated = true;
                return {
                    isAuthenticated: true
                };
            }
            return {
                isAuthenticated: false
            };
        }

        if (!_SessionCreated) {
            console.log('fake backend has no session yet');
            return undefined;
        }

        if (FunctionName === 'GetTransactions') {
            console.log('fake transactions');
            return [{
                'transId': 1
                    }, {
                'transId': 2
                    }, {
                'transId': 3
                    }];
        }
        if (FunctionName === 'GetAccounts') {
            console.log('fake accounts');
            return [{
                'id': 1
                    }, {
                'id': 2
                    }, {
                'id': 3
                    }];
        }



        if (FunctionName === 'GetUser') {
            return {
                name: 'Samantha',
                id: 'SomeUserID',
                agentID: 'AGENT001',
                subscribedToSpam: true
            };
        }
    }

    var resp = {
        doinvoke: doinvoke
    };
    return resp;
}());
