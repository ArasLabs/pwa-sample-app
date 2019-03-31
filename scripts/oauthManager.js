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
    const Http = new XMLHttpRequest();
    Http.open("GET", discoveryUrl);
    Http.send();
    Http.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            console.log(Http.responseURL)
            let oauthServerURL = JSON.parse(Http.responseText.toString()).locations[0].uri;

            // Getting the token end point
            Http.open("GET", oauthServerURL + ".well-known/openid-configuration");
            Http.send();
            Http.onreadystatechange = function() {
                if (this.readyState == 4 && this.status == 200) {
                    console.log(Http.responseURL);

                    var tokenEndpointURL = JSON.parse(Http.responseText.toString()).token_endpoint;

                    Http.open("POST", tokenEndpointURL);
                    Http.setRequestHeader('Content-Type', 'application/json');
                    Http.send(JSON.stringify({
                        "grant_type": "password",
                        "scope": "Innovator",
                        "client_id": clientID,
                        "username": username,
                        "password": password,
                        "database": database
                    }));

                    Http.onreadystatechange = function() {
                        if (this.readyState == 4 && this.status == 200) {
                            debugger;
                        }
                    }
                }
            }
        }
    }
    return true;

    /*
    // Import the express lirbary
    const express = require('express')

    // Import the axios library, to make HTTP requests
    const axios = require('axios')

    // This is the client ID and client secret that you obtained
    // while registering the application
    const clientID = 'IOMapp'
    const clientSecret = '<your client secret>'

    // Create a new express application and use
    // the express static middleware, to serve all files
    // inside the public directory
    const app = express()
    app.use(express.static(__dirname + '/public'))

    app.get('/oauth/redirect', (req, res) => {
        // The req.query object has the query params that
        // were sent to this route. We want the `code` param
        const requestToken = req.query.code
        axios({
            // make a POST request
            method: 'post',
            // to the Github authentication API, with the client ID, client secret
            // and request token
            url: discoveryUrl,
            // Set the content type header, so that we get the response in JSOn
            headers: {
                accept: 'application/json'
            }
        }).then((response) => {
            // Once we get the response, extract the access token from
            // the response body
            const accessToken = response.data.access_token
            // redirect the user to the welcome page, along with the access token
            res.redirect(`/welcome.html?access_token=${accessToken}`)
        })
    })

    // Start the server on port 8080
    app.listen(8080)
    */

}