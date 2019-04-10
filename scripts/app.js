var serverURL = null;
var oauthToken = null;
var database = null;
var clientID = "ProblemReporter";
var username = null;
var userID = null;
var image = null;

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
 * Function to get an image from the user and set it to the photo button
 */
function getImage() {
    var file = document.getElementById("imageUpload").files[0];
    var reader = new FileReader();

    reader.onload = function() {
        document.getElementById('photoButton').style.backgroundImage = "url(" + reader.result + ")";
    };

    if (file) {
        image = reader.readAsDataURL(file);
    }
}

/**
 * Get's the user's location and logs it to the console
 */
function getLocation() {
    // if (navigator.geolocation) {
    //     navigator.geolocation.getCurrentPosition(function(position) {
    //         var loc = "Latitude: " + position.coords.latitude +
    //             " - Longitude: " + position.coords.longitude;
    //         submitReport(loc);
    //     });
    // } else {
    //     console.error = "Geolocation is not supported by this browser.";
    //     submitReport(null);
    // }
    submitReport(null);

    return false;
}

/**
 * Get's the user's input from the server and submits the report
 * @param {*} loc The location of the problem
 */
function submitReport(loc) {
    let reportURL = serverURL + "/Server/OData/PR";

    // getting the form info
    var title = document.getElementById("title").value;
    var description = document.getElementById("description").value;
    var problemDate = document.getElementById("problemDate").value;

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
        if (loc !== null) {
            body["location"] = loc;
        }
        if (image !== null) {
            // body["image"] = image;
            uploadImage();
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
 * Uploads the image of the problme to the server
 */
function uploadImage() {
    // return new Promise(function(resolve, reject) {
    //     // Creating the POST request to make a new report
    //     var beginTransactionRequest = new XMLHttpRequest();
    //     beginTransactionRequest.open("POST", serverURL + "/vault/odata/vault.BeginTransaction");
    //     beginTransactionRequest.setRequestHeader("Authorization", "Bearer " + oauthToken);
    //     beginTransactionRequest.send();
    //     beginTransactionRequest.onreadystatechange = function() {
    //         if (beginTransactionRequest.readyState == 4 && beginTransactionRequest.status == 200) {

    //         }
    //     }
    // });
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