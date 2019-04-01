/**
 * Initial processing of login data
 * @param {*} url
 * @param {*} database
 * @param {*} username
 * @param {*} password
 */
function oauthLogin(url, database, username, password, clientID) {
    let discoveryUrl = url + "/Server/OAuthServerDiscovery.aspx";

    // Getting the OAuth Server URL
    var oauthRequest = new XMLHttpRequest();
    oauthRequest.open("GET", discoveryUrl);
    oauthRequest.send();
    oauthRequest.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseURL)
            let oauthServerURL = JSON.parse(Http.responseText.toString()).locations[0].uri;

            // Getting the token end point
            var endpointRequest = new XMLHttpRequest();
            endpointRequest.open("GET", oauthServerURL + ".well-known/openid-configuration");
            endpointRequest.send();
            endpointRequest.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    console.log(Http.responseURL);

                    var tokenEndpointURL = JSON.parse(Http.responseText.toString()).token_endpoint;

                    var tokenRequest = new XMLHttpRequest();
                    tokenRequest.open("POST", tokenEndpointURL);
                    tokenRequest.setRequestHeader('Content-Type', 'application/json');
                    // tokenRequest.send(JSON.stringify({
                    //     "grant_type": "password",
                    //     "scope": "Innovator",
                    //     "client_id": clientID,
                    //     "username": username,
                    //     "password": password,
                    //     "database": database
                    // }));

                    // set body of request using form data
                    var body = new FormData();
                    body.append("grant_type", "password");
                    body.append("scope", "Innovator");
                    body.append("client_id", clientID);
                    body.append("username", username);
                    body.append("password", password);
                    body.append("database", database);

                    // send request
                    tokenRequest.send(body);

                    tokenRequest.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            debugger;
                        }
                    }
                }
            }
        }
    }
    return true;
}