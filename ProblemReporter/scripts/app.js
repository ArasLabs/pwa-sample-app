var serverURL = null;
var oauthToken = null;
var database = null;
var clientID = "ProblemReporter";
var username = null;
var userID = null;

/**
 * Initializes the main page
 */
function initialize() {
    // Checking if the browser supports service workers
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js');
    }

    // Setting the current date and getting the server URL
    let today = new Date().toISOString().substr(0, 10);
    document.getElementById("problemDate").value = today;
    let urlComponents = window.location.href.split('/');
    serverURL = urlComponents[0] + "//" + urlComponents[2] + "/" + urlComponents[3];

    window.onclick = function (event) {
        if (!event.target.matches('#navButton') && event.target.getAttribute("id") !== 'fa fa-bars') {
            closeNav();
        }
    };

    initLocationService();

    // Checking if there is local storage
    if (window.localStorage) {
        database = window.localStorage.getItem("database");
        username = window.localStorage.getItem("username");
        userID = window.localStorage.getItem("userID");
        let password = window.localStorage.getItem("password");

        // Logging in the previous user
        if (database !== null && username !== null && password !== null) {
            login(password, true);
            return;
        }
    }

    // No previous user found, showing login
    showLoginDialog();
}

/**
 * Opens the left side navigation bar
 */
function openNav() {
    document.getElementById("sideNav").style.width = "250px";
}

/**
 * Closes the left side navigation bar
 */
function closeNav() {
    document.getElementById("sideNav").style.width = "0";
}

/**
 * Populates the database select field from the xml database list
 * @param {*} databaseList The list of databases from the server
 */
function populateDatabaseList(databaseList) {
    let databaseField = document.getElementById("database");
    while(databaseField.firstChild) { databaseField.removeChild(databaseField.firstChild);}
    let databases = getXMLElementsFromXmlHttpResponse(databaseList, "DB");

    // if the url is a valid innovator instance, add the databases to the dropdown
    if (databases.length > 0) {
        for (let i = 0; i < databases.length; i++) {
            let database = databases[i];
            let option = document.createElement("option");
            option.text = database.id;
            databaseField.add(option);
        }
        databaseField.selectedIndex = 1;
    }
}

/**
 * Shows the login Dialog
 */
function showLoginDialog() {
    // Showing the dialog
    hideAllModules();
    document.getElementById("loginDialog").style.display = "inline";

    // Populating the Database List
    createXmlHttpRequest(serverURL + "/Server/DBList.aspx", populateDatabaseList);
}

/**
 * Shows the given module
 * @param {*} moduleName the module to show
 */
function showModule(moduleName) {
    // Hiding all elements and showing the loading spinner
    hideAllModules();
    document.getElementById("loginDialog").style.display = "none";
    document.getElementById("loader").style.display = "block";

    // Shows the module after a brief loading period
    setTimeout(function () {
        document.getElementById(moduleName).style.display = "block";
        document.getElementById("loader").style.display = "none";
    }, 500);
}

/**
 * Hides all modules in the application
 */
function hideAllModules() {
    for (var i = 0; i < document.getElementsByClassName("modules").length; i++) {
        document.getElementsByClassName("modules")[i].style.display = "none";
    }
}


/**
 * Helper method to get credentials when clicking login
 */
function loginFromUI() {
    // Gets the user's input
    database = document.getElementById("database").value;
    username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let rememberMe = document.getElementById("rememberMe").value;
    password = md5(password);

    // logging in the user
    login(password, rememberMe);

    return false;
}

/**
 * Managing login with the given user credentials
 * @param {*} password
 * @param {*} rememberMe
 */
function login(password, rememberMe) {
    // attempting login
    var afterLogin = oauthLogin(serverURL, database, username, password, clientID);

    afterLogin.then(function (token) {
        oauthToken = token;
        document.getElementById("loginDialog").style.display = "none";

        if (userID === null) {
            getUserID();
        }

        showModule("newReportModule");

        // saving the user's credentials
        if (rememberMe && window.localStorage) {
            window.localStorage.setItem("database", database);
            window.localStorage.setItem("username", username);
            window.localStorage.setItem("password", password);
            window.localStorage.setItem("userID", userID);
        }
    }).catch(function () {
        //TODO: Implement better error page
        alert("Invalid credentials. Please try again");
    })

    // returning false to prevent page refresh
    return false;
}

/**
 * Signs out the user and clears the cached information
 */
function signOut() {
    // Clearing the saved credentials
    window.localStorage.clear();

    // Clearing input fields
    document.getElementById("title").value = "";
    document.getElementById("description").value = "";
    let today = new Date().toISOString().substr(0, 10);
    document.getElementById("problemDate").value = today;
    document.getElementById("photoButton").style.backgroundImage = "url(images/camera.png)";

    // Showing the login dialog
    showLoginDialog();
}

/**
 * Gets the image from the user and set it to the photo button
 */
function getImage() {
    var image = null;
    var file = document.getElementById("imageUpload").files[0];
    var reader = new FileReader();

    reader.onload = function () {
        image = "url(" + reader.result + ")";
        document.getElementById('photoButton').style.backgroundImage = image;
    };

    if (file) {
        image = reader.readAsDataURL(file);
    }

    return file;
}

/**
 * Get's the user's location and logs it to the console
 */
function getLocation() {
    return new Promise(function (resolve) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(resolve, resolve);
        } else {
            console.error("Geolocation is not supported by this browser.");
            resolve(null);
        };
    }).then(function (position) {
        if (position !== null && position !== undefined && position.code !== 1) {
            return position.coords.latitude + "," + position.coords.longitude;
        }
        return null;
    });
}

/**
 * Get's the user's input from the server and submits the report
 */
function submitReport() {
    let reportURL = serverURL + "/Server/OData/PR";
    let reportFileURL = serverURL + "/Server/OData/PR File";

    // getting the form info
    var title = document.getElementById("title").value;
    var description = document.getElementById("description").value;
    var problemDate = document.getElementById("problemDate").value;
    var location = document.getElementById("location").value;
    var image = getImage();

    return new Promise(function (resolve, reject) {

        if (image !== null && image !== undefined) {
            var uploadImageId = uploadImage(image);
            resolve(uploadImageId);
        }
        else {
            resolve(null);
        }

    }).then(function (fileID) {

        // Creating the POST request to make a new report
        var createReportRequest = new XMLHttpRequest();
        createReportRequest.open("POST", reportURL);
        createReportRequest.setRequestHeader("Authorization", "Bearer " + oauthToken);

        // set body of request using form data
        let body = {};
        body["reported_by"] = userID;

        if (title !== "") {
            body["title"] = title;
        }

        if (description !== "") {
            body["description"] = description;
        }

        if (problemDate !== "") {
            body["problemDate"] = problemDate;
        }

        if (location !== null) {
            body["location"] = location;
        }

        body = JSON.stringify(body);

        createReportRequest.send(body);
        createReportRequest.onreadystatechange = function () {
            if (createReportRequest.readyState == 4 && createReportRequest.status == 201) {
                console.log("createReportRequest : " + createReportRequest.responseText)
                var createReportResponse = JSON.parse(createReportRequest.responseText);
                var reportNumber = createReportResponse.item_number;
                var reportId = createReportResponse.id;

                //add file image to the relationship 
                if (fileID != null) {
                    var addFileToReportRequest = new XMLHttpRequest();
                    addFileToReportRequest.open("POST", reportFileURL);
                    addFileToReportRequest.setRequestHeader("Authorization", "Bearer " + oauthToken);

                    // set body of request using form data
                    var relationshipBody = JSON.stringify({
                        source_id: reportId,
                        related_id: fileID
                    });

                    addFileToReportRequest.send(relationshipBody);
                    addFileToReportRequest.onreadystatechange = function () {
                        if (addFileToReportRequest.readyState == 4 && addFileToReportRequest.status == 201) {
                            alert("Report " + reportNumber + " was created successfully!");
                        }
                    }
                }
                else {
                    alert("Report " + reportNumber + " was created successfully!");
                }
            }
        }
    });
}

/**
 * Uploads the problem image to the server
 * Returns the id of the created file
 * @param {*} image the image to be uploaded
 */
function uploadImage(image) {
    // Split our file into content chunks
    var chunkSize = 4096;

    // Starting the transaction by getting a tansaction ID
    return httpPost(oauthToken, serverURL + "/vault/odata/vault.BeginTransaction")
        .then(function (transactionResponse) {
            var transactionID = JSON.parse(transactionResponse.responseText.toString()).transactionId;
            return uploadFileInChunks(chunkSize, image, transactionID)
                .then(function (imageId) {
                    return imageId;
                })
        }).catch(function () {
            alert("Unable to connect to server");
        });
}

function uploadFileInChunks(chunkSize, file, transactionID) {
    // Build our blob array
    var fileID = generateNewGuid().split('-').join('').toUpperCase();

    // Split our file into content chunks
    var chunkUploadPromiseArray = new Array();
    var chunkUploadAttempts = 5;
    var i = 0;
    chunkSize = file.size;
    while (i < file.size) {
        var endChunkSize = i + chunkSize;
        endChunkSize = (endChunkSize < file.size) ? endChunkSize : file.size;
        endChunkSize = endChunkSize - 1;
        var chunkBlob = file.slice(i, (endChunkSize + 1));

        var headers = [];
        headers.push({
            name: "Content-Disposition",
            value: "attachment; filename*=utf-8''" + encodeURI(file.name)
        });
        headers.push({
            name: "Content-Range",
            value: "bytes " + i + "-" + endChunkSize + "/" + file.size
        });
        headers.push({
            name: "Content-Type",
            value: "application/octet-stream"
        });
        headers.push({
            name: "transactionid",
            value: transactionID
        });

        var uploadUrl = serverURL + "/vault/odata/vault.UploadFile?fileId=" + fileID;
        chunkUploadPromiseArray.push(guaranteedHttpPost(oauthToken, uploadUrl, headers, chunkBlob, chunkUploadAttempts));

        i = endChunkSize + 1;
    }

    return Promise.all(chunkUploadPromiseArray).then(function (values) {

        var boundary = "batch_" + fileID;
        var commit_headers = [];
        commit_headers.push({
            name: "Content-Type",
            value: "multipart/mixed; boundary=" + boundary
        });
        commit_headers.push({
            name: "transactionid",
            value: transactionID
        });

        var commit_body = "--";
        commit_body += boundary + "\r\n";
        commit_body += "Content-Type: application/http\r\n\r\n";
        commit_body += "POST " + serverURL + "/Server/odata/File HTTP/1.1\r\n";
        commit_body += "Content-Type: application/json\r\n\r\n";
        commit_body += '{"id":"' + fileID + '",';
        commit_body += '"filename":"' + file.name + '",';
        commit_body += '"file_size":' + file.size + ',';
        commit_body += '"Located":[{"file_version":1,"related_id":"67BBB9204FE84A8981ED8313049BA06C"}]}\r\n';
        commit_body += "--" + boundary + "--";

        return guaranteedHttpPost(oauthToken, serverURL + "/vault/odata/vault.CommitTransaction", commit_headers, commit_body, 5)
            .then(function (fileUploadResponse) {
                console.log("commit response : " + fileUploadResponse.responseText.toString());
                var startIndex = fileUploadResponse.responseText.indexOf("{");
                var endIndex = fileUploadResponse.responseText.lastIndexOf("}") + 1;
                var jsonResponse = fileUploadResponse.responseText.substring(startIndex, endIndex);
                return JSON.parse(jsonResponse).id;
            })
            .catch(function (err) {
                console.log("Error in uploadFileInChunks promise : Unable to connect to server");
                alert("Unable to connect to server");
            });

    });
}

/**
 * Shows the user a list of all problem reports they have submitted
 */
function showUserReports() {
    // Clearing any previous content
    var module = document.getElementById("allReportsModule");
    while (module.firstChild) {
        module.removeChild(module.firstChild);
    }

    var request = httpGet(oauthToken, serverURL + "/server/odata/PR?$filter=reported_by eq '" + userID + "'");
    request.then(function (response) {
        var responseBody = JSON.parse(response.responseText).value;

        // looping through the response to create a card for each response
        for (var i = 0; i < responseBody.length; i++) {
            var card = document.createElement("div");
            card.classList.add("card");
            var problemReport = responseBody[i];
            var styleNode = document.createElement("h3");
            var textNode = document.createTextNode(problemReport.item_number);
            styleNode.appendChild(textNode);
            card.appendChild(styleNode);
            card.appendChild(document.createTextNode(problemReport.title));
            card.appendChild(document.createElement("br"));

            // Keep this in case we need location for cards:
            // if (problemReport.location !== undefined && problemReport.location !== null && problemReport.location.length !== 0) {
            //     var locationLink = document.createElement("a");
            //     locationLink.innerText = problemReport.location;
            //     locationLink.setAttribute("href", generateLocationLink(problemReport.location));
            //     locationLink.setAttribute("target", "_blank");
            //     card.appendChild(locationLink);
            // }

            styleNode = document.createElement("div");

            //create a div/span/etc containing the community svg image 
            // Most likely:
            // communityBtn.setAttribute("class", "communityBtn");
            // communityBtn.setAttribute("class", communityBtn.getAttribute("class", " communityBtn"));


            // communityBtn = document.createElement("button");
            // card.appendChild(communityBtn);
            // communityBtn.setAttribute("class", "communityBtn");
            
            
            
            textNode = document.createTextNode(problemReport.state);
            styleNode.appendChild(textNode);

            // Coloring the different statuses
            if (problemReport.state === "Submitted") {
                styleNode.style.color = "grey";
            } else if (problemReport.state === "Closed") {
                styleNode.style.color = "green";
            } else if (problemReport.state === "Rejected") {
                styleNode.style.color = "red";
            } else {
                styleNode.style.color = "orange";
            }
            card.appendChild(styleNode);

            module.appendChild(card);
        }
    })
        .catch(function () {
            alert("Unable to connect to server");
        });
}

/**
 * Takes the user's username and get's the user's id from the server
 */
function getUserID() {
    let rememberMe = document.getElementById("rememberMe").value;
    var request = httpGet(oauthToken, serverURL + "/server/odata/Alias?$expand=related_id&$filter=source_id/login_name eq '" + username + "'");
    request.then(function (response) {
        userID = JSON.parse(response.responseText.toString()).value[0].related_id.id;
        if (rememberMe && window.localStorage) {
            window.localStorage.setItem("userID", userID);
        }
    })
        .catch(function () {
            //TODO: Implement better error page
            alert("Username not found");
        });
}

/**
 * Generates new guid
 */
function generateNewGuid() {
    function randomDigit() {
        if (crypto && crypto.getRandomValues) {
            var rands = new Uint8Array(1);
            crypto.getRandomValues(rands);
            return (rands[0] % 16).toString(16);
        } else {
            return ((Math.random() * 16) | 0).toString(16);
        }
    }
    var crypto = window.crypto || window.msCrypto;
    return 'xxxxxxxxxxxx4xxx8xxxxxxxxxxxxxxx'.replace(/x/g, randomDigit).toUpperCase();
}

function generateLocationLink(location) {
    const googleMapsEmbedLink = "https://maps.google.com/maps?t=&ie=UTF8&iwloc=";

    if (location === null || location === undefined || location.length == 0) {
        return googleMapsEmbedLink;
    }

    return googleMapsEmbedLink + "&q=" + encodeURI(location);
}

function generateEmbedLocationLink(location) {
    return generateLocationLink(location) + "&output=embed";
}


function updateLocation() {
    var mapFrame = document.getElementById("gmap");
    var location = document.getElementById('location').value;
    var src = generateEmbedLocationLink(location);
    mapFrame.setAttribute("src", src);
}


function initLocationService() {
    var locationInputElement = document.getElementById('location');
    locationInputElement.addEventListener("input", updateLocation);
    locationInputElement.addEventListener("change", updateLocation);
    getLocation().then(function (coordinates) {
        //TODO convert coordinates to address using google api. 
        locationInputElement.value = encodeURI(coordinates);
        updateLocation();
    })
}

function populateLocationList() {

    var grabLocation = httpGet(oauthToken, serverURL + "/server/odata/PR?$select=location&$filter=location ne ''");
    grabLocation.then(function(res) {
	var resObj = JSON.parse(res.response);

	var itemArray = resObj.value;
	var locationData;
	var distinctLocationData = [];
	let locationField = document.getElementById("location");

	itemArray.forEach(function(elem) {
		if(distinctLocationData.indexOf(elem.location) === -1) {
			distinctLocationData.push(elem.location);
		}
	});

	distinctLocationData.forEach(function(item) {
		let option = document.createElement("option");
		option.text = item;
		locationField.add(option);
	});

    });

}


// -----------------------------------------------------------------------------------------------



//     grabLocation.then(function(res) {
//         var resObj = JSON.parse(res.response);

//         var itemArray = resObj.value;
//         forEach(function(elem) {
//             var locationData = elem.location;
//         });

//         let locationField = document.getElementsById("locationDropDown");

//         if(locationData.length > 0) {
//             locationData = locationData.filter(unique);
//             forEach(function(i) {
//                 locationData = locationData[i];
//                 let option = document.createElement("option");
//                 locationField.appendChild(locationData);
//             });
//         }
//     });


//     Need to get the Json tag for location
//     Make each Json location value list unique so duplicates are not returned
//     Grab option tags 
//     Create new option tags containing locations 

//     let option = document.createElement("option");
//     option.text = database.id;
//     databaseField.add(option);
// }