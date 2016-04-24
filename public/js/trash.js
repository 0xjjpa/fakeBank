function getJsonAsync(url) {
    // Promises require two functions: one for success, one for failure
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', url);

        xhr.onload = () => {
            if (xhr.status === 200) {
                // We can resolve the promise
                resolve(xhr.response);
            } else {
                // It's a failure, so let's reject the promise
                reject("Unable to load RSS");
            }
        }

        xhr.onerror = () => {
            // It's a failure, so let's reject the promise
            reject("Unable to load RSS");
        };

        xhr.send();
    });
}



function makeRequest(method, url) {
    return new Promise(function (resolve, reject) {
        var xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.onload = function () {
            if (this.status >= 200 && this.status < 300) {
                resolve(xhr.response);
            } else {
                reject({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function () {
            reject({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    });
}
makeRequest('GET', 'http://localhost:8888/fake_accounts.json')
    .then(function (datums) {
        makeRequest('GET', 'http://localhost:8888/fake_accounts.json');
    })


var x = (function () {
    var foo = "a";
    var bar;

    function createBar(Given) {
        bar = Given;
    }

    return {
        getFoo: function () {
            return foo;
        },
        getBar: function () {
            return bar;
        },
        setBar: createBar
    }; // end: returned object
}());


//function GetRandomSTR(GivenLength) {
//    //returns a random string
//    var resp = '';
//    var allowedChars = 'qwertyuiopasdfghjklzxcvbnm1234567890';
//    var allowedCharsNum = allowedChars.length;
//    for (var i = 0; i < GivenLength; i++) {
//        resp += allowedChars[parseInt(Math.random() * allowedCharsNum)];
//    }
//    return resp; //Math.random().toString(35).substr(2, GivenLength);
//}


[{
    "id": "4_Alan111_-1_2340896294",
    "nickname": "Alan",
    "name": "RENT",
    "accountno": "4565535342",
    "typeForDisplay": "",
    "type": "40",
    "enabled": "true",
    "photo": "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCACAAIADASIAAhEBAxEB/8QAGwAAAgMBAQEAAAAAAAAAAAAABAUDBgcCAQD/xAA8EAACAQMCBAQDBgMGBwAAAAABAgMABBEFIRIxQVEGEyJhFDJxFSNCgZHBB1KxFjNiodHhJCVyc4Lw8f/EABkBAAMBAQEAAAAAAAAAAAAAAAIDBAEABf/EACERAAIDAAMAAgMBAAAAAAAAAAABAgMREiExBEETMlEi/9oADAMBAAIRAxEAPwBJI9p4asH4WD3LD7yXqT2FZ9qd/cancs7k8PQdqn1bUpL6YuxPD+EURougX2tRYtYwADvI5wBSSlR4/wCpFfOQ2OldJzq6Sfw21ELlby2Zu24qvahoV/pMoW7hwudnXdT+dcHCyLfTBeeK6cehRXqjffpQk90wcogBPWsS0ZZNRWsIXAB7YpdKGe4Yjcd6k4pH2ZjjltU8UESLxMZf/DG35UaWE1lvJYL2iLHAYZFevayKRxAjI7UyW1j4i6sGUH1A7Ee9dXDMJ1hUb5wARW6IwTGJx0o2EEWp260wkt7dYl4x6gfUuOR6flXk9iyrxoSV/lFdyOwBft/jFcZ3oh7dwqkj8W4oc7E126cwSb+9b61bfA935t6bGa5ESY4kY9+1VGXeRvrRekuY9RiYNw4POi+gZLUO7A2XxMa3YZ1J9QBxV3ttatdOt1t7RAkK8gGqmyaIyDPxCk+wr6GytYz988zHrwnFKwrsSl9lvuPFh4cAH9aTX3iBr6B4HTiRh1PKvLf7LTH/AAvGe8jk0wjvbaEfc28KfRBXYKhifhTL1JoIFYKyhjgMRXlpZo1v5jnJ5nNNPEepzX9zBaEfdr6gfevrTT7hrQeWhkHLIG1c3gU25sXxxxDDtggyFT+XX+lcpH513mHaNcYJ6A9P1p/beGJTbtLMDGo3BIpfcReXIyQx8IJGBWKaYHBr0EPDHfEugyuxIPPbrXYMQvgkhygwqt1G9SXFs5lUcOdgWI70NPbytMz8JIPtXajuLOL1FcyeskJtn2qOLU3MqoNs7ZPavZeONnDrgOOtBn7qTzEO1EjGh1cmJYVVccZ3pRweqpI5kkiAJYkb/Su2ALkjke1aujGJpP7xsdzRdhFxTcRGyiuZbVgSe5ovR5UguGEwJVhRasMaLHJcDqwoKWbJ5E1I+FOMcqHdtzSylo5WZg2womKWRl54oTiHFU8LYOK5mxR1c2r3E8HCcksFz9a2LQtMhtrdIlQcKqByrLdNXzNUtFPLzV/rWyad6RU178RRXFa2TvpdteL5Mka8J7UEngbTUmLGPiB70/iThII50UCx3pS8NlmiFfB+lBCfh0zS248KWG4EKj9qtxYqOYoSYekkbVjeHRX9Mg8W+H7e3hLwH1DmAOdUC4tzEcOOYra/ElmJYWJOTzANZlqlpwPyyPaqKp9E10cZWFhK775z3owoY24TzGKKhtV4skjGeVDSNxys45Z/yqhPSYhmJPM/kKFVSZR71I7cyTXVseKX6b0T8Nj6OTsBvmoX+Y1K5SNPnz7AVBDOskpULk460tFTR4o3qWLLHsKh81zIVC4HKumDLKFyeXSuZ0BpZTSw3sMkEfmyq2VXua0HTfFy27JFqVpLbSH8TL6TWfaFA0muWa77ydfpV3+xdT+IVJrxGtM7oyAt+VJszcYb5J6jQrXUoLiJZEZSCOYNSyaraw7yTIg7s2Kr/hzTXt1khJygGVHal+taK07yMImmVdwuedI3sY/Cyv4i0s7C8iJ/6ga9jv7e8i4oJlcdcHlWd2Nram6ktbnRnWVASXAJUj2NNdNsoUuRNp6TQODggk4b23opJARlIba1bm4tHKnBUEis6uIPOkDEA+1anLCzWrhhglSMVUtC06FpZr26IEEDY9Q2znrWQliZ1keTRTdS0O+tNP8AjxastvvljjOD1xzx71WWbCEDtW8+Ira3+xbozMrR/CyEydMYP+1YExyu/PFVUzck9J761BrAcxluZqW2QKXJxyr5iFwTyxQ7Skn07Cm7olelguLOeIkTFASOQOTQtvCsdyhyeeKsFnFBcw20k6cRdsNk86YSaNpTb/Duh7rKaWmPlZ/RBcWXkqrx81O570MD97v9K+vdTJuZIeBiithd+1dNbTxxpOyEo4yCK5b9hR+hv4fI/tBZf9z9jWzR8LRqWAO3asN0W6EOu2TnkJRzrYZrspa4DAADc1Pb6iiI2sQPLnm5cWyj2ouCJJIuEgEHnSeHXtNFioDE7dASa6hvlmYGyaQ4PqZlIApb9DxMZ/ZcSNxKSAeleSQpGMKAT3qWC8L5VxhxzriZs5NY2mA1gBcycKMx7cqB060RtFkjMfEZ2Y8IHSpNTkKwsMEnBziqde/xBh0RpbNLKSa8RPSxfCDbO/WujFvpA81F6zv+I2pfZ/he200P99cYQ4O/ANz+pwKyN29OwzRuratea1qEt7fS8crYAHIKOwHQUFGoLeoHGOhxV0IcI4SWz/JPSBwzn1HArj0qepo17eLGcN+ZqBkjVflH61umFutnWKJYmJ2bIIHKmnxAxsRVVbWrpgMMg25haDkvbqd+EyuxJwFHWhUWHKDfpZp1sUkLyeWGO570LcajCYjHCGI7mgLfSryQhpQIgf5zufyo8abBDGXJMzAfiOB+lFxYHKMfXoqR2E6smSynIwK0+Nn1jTYrpHbhCjjQHGCBvVe0DTo9SuTH5YWNE42VRjNWqxtBYaolvGOGC5jIAHIOv+1ItaTz7KYSc1udHdnaWyQ4aeWI9njo23kWxy8N0sg/lY4qUajeWDiGS0MsfRl3FOLJpJxxvB5S8xkb0ptD8hnQHY6q1zIRJHwsp5j3qe7vOAtvyoW/1iCC7CbDGxJG/wBaTXeqQxzF2biLfKijPEfpQJNsVKYfdzGWNUOeJ9jmsT1i4+J1m8uAfS0j4PsNq2WGKWWNpZgYy64ROqg/vVA1nw0lpM1vOi5xxLKgxxDv9afQ0pNCL9xMo5b5j7j+lcF2Kkg78qc3Hh25jjIidJMnI3wcYoeLQrxlCyKIyT13qptL0TXFyfQoaRifmP615xVctG8FxalcJavNIJ5WARuJVXuc59uVWAfw20gu7fF3fACI44wuJpWPJlU7EZ7Ut3QXRS65L0o2n6dPqDgIMR9XP7dzVotNNttPA4Ey5+aRtz/tRUUUNtGqRrwKowAP2rpjjfPEnXHMfWmpYR2WuTOJoBMuY29fPahV+9JVhhuTDvRJHC2FJzzGOoqCYYdbhRg8mAFaLQ28GSiHVpIXPzxlR9Qc1btTsmnt8xELNGwkibHJv/dqz+2k+D1OG6QYAYMR7da04AMisDlGAIPsai+QslyL/jPlFxANP8Soh8i9QQzrzSTb/wC11feMra3i4EdC2O/Kpp4YZRwzRI46cSg0sudJs88SW8anuFpSaGS5ZhUp7281K4kkjTCnm7cs+1WHQdGW2xdz5edhsW6f6Udb20SEHgQY7UeilyAvWilLroCMMekkSGWYDoKX+N7RBp9pcAepXKZ9iM/1FWWxtCMEjHelnjiL/kSntKuP86Gr90zbP0aM0mz8NnqoNSAdBzI5V9cKfhyp+YtipwmGLAe1eg0edrXhxbeVDcxzPH5kSsC0ROA47Z6Va1W4luUJlhewjjiZbxDxNZrkkKvUb7b1V4k+5IOM5OKZ6bMLcuHaYLw5xE2MsN1z3GelItqTWopr+RJvJsAkjVhw++21QmMSAbhZF2z/AK+1EFcnnuOhNRyAkA/iHP3qkkBypwFxjnw+x6iuOIEf4WGDUwHpdFO3zrXBCsegB3rjUDAFSY25odj7VovhW/S+0gW8hzNB6Tnnw9D+1Z/OuyzL+D0t9KaaJenT75Jhuh9Mg7ilWw5RHVWcJGhm1Dbc1qCTTzgjOxpjbPHPGrxsCrDIwanKjG4qDD0vRAmjuzc9hzprZacsR33o1CiLkYya74/LXibOTsNq1LQSTCxrtVK8b3vmrb2i7+rjYdscqtN1drHEzMwCqMnesz1O7a/v5Z84B9K+wp1MdlpPfLjHBawLyxJ04uI1LjBY4OMmvogfMduwwK7w3ASMHO9WEGkaZEQ33xt+dFg4kxjHehEIaRVG3pGTUwLCUsQM7n6Vpx//2Q==",
    "defaultAmount": "79.17",
    "currency": "EUR",
    "defaultAccountID": "1",
    "defaultNarrative": "",
    "senderInformation": "",
    "islocal": "false",
    "isnational": "",
    "categoryId": "",
    "txnTypeId": "40",
    "city": "Krakow",
    "country": "PL",
    "bankName": "CR2 Bank",
    "needsRefresh": true,
    "hasPhoto": true,
}, {
    "id": "11_JohnqsSmith111_-1_2604027696",
    "nickname": "John Smith",
    "name": "RENT",
    "accountno": "4565535342",
    "typeForDisplay": "",
    "type": "40",
    "enabled": "true",
    "photo": "Frank.jpg",
    "defaultAmount": "42.00",
    "currency": "EUR",
    "defaultAccountID": "1",
    "defaultNarrative": "",
    "senderInformation": "",
    "islocal": "false",
    "isnational": "",
    "categoryId": "",
    "txnTypeId": "40",
    "city": "Krakow",
    "country": "PL",
    "bankName": "CR2 Bank",
    "needsRefresh": true,
    "hasPhoto": true,
}]


TheM.accounts[0].transactions.doUpdate({
            dateStart: new Date('1/1/2016'),
            dateEnd: new Date()
        }).then(json => {
            TheM.fxrates.doUpdate()
        })
