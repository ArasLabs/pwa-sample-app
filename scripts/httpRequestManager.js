/**
 * Function to generate an http GET request and then return the response
 * @param {*} oauthToken
 * @param {*} url
 */
function httpGet(oauthToken, url) {
    return new Promise(function(resolve, reject) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("GET", url);
        httpRequest.setRequestHeader("Authorization", "Bearer " + oauthToken);
        httpRequest.send();
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                resolve(httpRequest);
            } else if (httpRequest.readyState == 4 && httpRequest.status == 400) {
                reject(null);
            }
        }
    });
}

/**
 * Function to generate an http POST request and then return the response
 * @param {*} oauthToken
 * @param {*} url
 * @param {*} body
 */
function httpPost(oauthToken, url, body) {
    console.log("executing httpPost with the following parameters......");
    console.log("url : " + url);
    console.log("body : \n" + body);

    return new Promise(function(resolve, reject) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("POST", url);
        httpRequest.setRequestHeader("Authorization", "Bearer " + oauthToken);
        httpRequest.send(body);
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                resolve(httpRequest);
            } else if (httpRequest.readyState == 4 && httpRequest.status == 400) {
                reject(null);
            }
        }
    });
}

/**
 * Function that will try a post a number of times
 * @param {string} token
 * @param {string} url 
 * @param {*} result 
 */
function guaranteedHttpPost(oauthToken, url, headers, body, attempts) {
    console.log("executing guaranteedHttpPost with the following parameters......");
    console.log("url : " + url);
    console.log("headers : " + headers);
    console.log("body : \n" + body);
    console.log("attempts : " + attempts);

    return new Promise(function(resolve, reject) {
        var httpRequest = new XMLHttpRequest();
        httpRequest.open("POST", url);
        httpRequest.setRequestHeader("Authorization", "Bearer " + oauthToken);
        headers = headers || [];
        for (var i = 0; i < headers.length; i++)
        {
            var header = headers[i];
            httpRequest.setRequestHeader(header.name, header.value);
        }
        httpRequest.send(body);
        httpRequest.onreadystatechange = function() {
            if (httpRequest.readyState == 4 && httpRequest.status == 200) {
                resolve(httpRequest);
            } else if (httpRequest.readyState == 4 && attempts !== 0) {
                // Try again
                return guaranteedHttpPost(oauthToken, url, headers, body, attempts - 1);
            } else if (httpRequest.readyState == 4 && httpRequest.status == 400) {
                return reject(null);
            }
        }
    })
}

/**
 * Method to create an XML Http Request and return the response
 * @param {string} url - The url of the request
 * @param {function} result - The executed function on a successful request

 */
function createXmlHttpRequest(url, result) {
    var xhttp = new XMLHttpRequest();
    console.log("Creating request for url: " + url);
    xhttp.onreadystatechange = function() {
        if (this.readyState == 4 && this.status == 200) {
            result(this.responseText);
        } else if (this.status == 404) {
            console.log("Unable to reach URL: " + url);
            return null;
        }
    };
    xhttp.upload.addEventListener("error", transferFailed);
    xhttp.open("GET", url, true);
    xhttp.send();
}

/**
 * 
 * @param {*} response 
 * @param {*} tag 
 */
function getXMLElementsFromXmlHttpResponse(response, tag) {
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(response, "text/xml");

    return xmlDoc.getElementsByTagName(tag);
}

/**
 * 
 * @param {*} evt 
 */
function transferFailed(evt) {
    console.log("An error occurred while transferring the file.");
}