/**
 * Initial processing of login data
 * @param {*} url
 * @param {*} database
 * @param {*} username
 * @param {*} password
 */
function oauthLogin(url, database, username, password, clientID) {
    let discoveryUrl = url + "/Server/OAuthServerDiscovery.aspx";

    return new Promise(function(resolve, reject) {
        // Getting the OAuth Server URL
        var oauthRequest = new XMLHttpRequest();
        oauthRequest.open("GET", discoveryUrl);
        oauthRequest.send();
        oauthRequest.onreadystatechange = function() {
            if (oauthRequest.readyState == 4 && oauthRequest.status == 200) {
                // Getting the token end point
                let oauthServerURL = JSON.parse(oauthRequest.responseText.toString()).locations[0].uri;
                let endpointRequest = new XMLHttpRequest();
                endpointRequest.open("GET", oauthServerURL + ".well-known/openid-configuration");
                endpointRequest.send();
                endpointRequest.onreadystatechange = function() {
                    if (endpointRequest.readyState == 4 && endpointRequest.status == 200) {
                        // Getting the token
                        let tokenEndpointURL = JSON.parse(endpointRequest.responseText.toString()).token_endpoint;
                        let tokenRequest = new XMLHttpRequest();
                        tokenRequest.open("POST", tokenEndpointURL);

                        // set body of request using form data
                        let body = new FormData();
                        body.append("grant_type", "password");
                        body.append("scope", "Innovator");
                        body.append("client_id", clientID);
                        body.append("username", username);
                        body.append("password", password);
                        body.append("database", database);

                        // send request
                        tokenRequest.send(body);
                        tokenRequest.onreadystatechange = function() {
                            if (tokenRequest.readyState == 4 && tokenRequest.status == 200) {
                                var token = JSON.parse(tokenRequest.responseText).access_token;
                                resolve(token);
                            } else if (tokenRequest.readyState == 4 && tokenRequest.status == 400) {
                                reject(null);
                            }
                        }
                    }
                }
            }
        }
    });
}