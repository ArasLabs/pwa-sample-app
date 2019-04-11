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
    serverURL = urlComponents[0] + "//" + urlComponents[1] + "/" + urlComponents[2] + "/" + urlComponents[3];

    window.onclick = function(event) {
        if (!event.target.matches('#navButton') && event.target.getAttribute("id") !== 'fa fa-bars') {
            closeNav();
        }
    };

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
    setTimeout(function() {
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

    afterLogin.then(function(token) {
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
    }).catch(function() {
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

    reader.onload = function() {
        debugger;
        image = "url(" + reader.result + ")";
        document.getElementById('photoButton').style.backgroundImage = image;
    };

    if (file) {
        image = reader.readAsDataURL(file);
    }

    return image;
}

/**
 * Get's the user's location and logs it to the console
 */
function getLocation() {
    var location = null;
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            location = "Latitude: " + position.coords.latitude +
                " - Longitude: " + position.coords.longitude;
        });
    } else {
        console.error = "Geolocation is not supported by this browser.";
    };

    return location;
}

/**
 * Get's the user's input from the server and submits the report
 */
function submitReport() {
    let reportURL = serverURL + "/Server/OData/PR";

    // getting the form info
    var title = document.getElementById("title").value;
    var description = document.getElementById("description").value;
    var problemDate = document.getElementById("problemDate").value;
    var location = getLocation();
    var image = getImage();

    return new Promise(function(resolve, reject) {
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
        // if (problemDate !== "") {
        //     body["problemDate"] = problemDate;
        // }

        // Commented out because of lack of HTTPS
        // if (location !== null) {
        //     body["location"] = loc;
        // }
        if (image !== null) {
            uploadImage(image);
            // body["image"] = imageID;
        }
        body = JSON.stringify(body);

        createReportRequest.send(body);
        createReportRequest.onreadystatechange = function() {
            if (createReportRequest.readyState == 4 && createReportRequest.status == 201) {
                console.log(createReportRequest.responseText)
                var reportNumber = JSON.parse(createReportRequest.responseText.toString()).item_number;
                alert("Report " + reportNumber + " was created successfully!");
            }
        }
    });
}

/**
 * Uploads the problem image to the server
 * @param {*} image the image to be uploaded
 */
function uploadImage(image) {
    var transactionID = "";
    var fileID = generateNewGuid();
    debugger;

    // Starting the transaction by getting a tansaction ID
    var transactionIDRequest = httpPost(oauthToken, serverURL + "/vault/odata/vault.BeginTransaction");
    transactionIDRequest.then(function(transactionResponse) {
            transactionID = JSON.parse(transactionResponse.responseText.toString()).transactionId;
        })
        .then(function() {
            var body = {};
            body["transactionid"] = transactionID;
            body["Aras-ContentRange-Checksum-Type"] = "xxHashAsUInt32AsDecimalString";
            // var
        })
        .catch(function() {
            alert("Unable to connect to server");
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
    request.then(function(response) {
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

                styleNode = document.createElement("div");
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
        .catch(function() {
            alert("Unable to connect to server");
        });
}

/**
 * Takes the user's username and get's the user's id from the server
 */
function getUserID() {
    var request = httpGet(oauthToken, serverURL + "/server/odata/Alias?$expand=related_id&$filter=source_id/login_name eq '" + username + "'");
    request.then(function(response) {
            userID = JSON.parse(response.responseText.toString()).value[0].related_id.id;
        })
        .catch(function() {
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
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
}