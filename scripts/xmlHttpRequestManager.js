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

function getXMLElementsFromXmlHttpResponse(response, tag) {
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(response, "text/xml");

    return xmlDoc.getElementsByTagName(tag);
}

function transferFailed(evt) {
    console.log("An error occurred while transferring the file.");
}