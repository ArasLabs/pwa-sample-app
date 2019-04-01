function initialize() {
    // Checking if the browser supports service workers
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('../service-worker.js');
        });
    }

    hideMenu();
    let today = new Date().toISOString().substr(0, 10);
    document.getElementById("problemDate").value = today;

    window.onclick = function(event) {
        if (!event.target.matches('.menuButton') && event.target.className !== 'fa fa-cog') {
            hideMenu();
        }
    }

    // Checking if there is local storage
    if (window.localStorage) {
        let database = window.localStorage.getItem("database");
        let username = window.localStorage.getItem("username");
        let password = window.localStorage.getItem("password");

        // Logging in the previous user
        if (database !== null && username !== null && password !== null) {
            login(database, username, password, true);
            return;
        }
    }

    // No previous user found, showing login
    showLoginDialog();
}

/**
 * Method to populate the database select field from the xml database list
 * @param {*} databaseList The list of databases from the server
 */
function populateDatabaseList(databaseList) {
    let databaseField = document.getElementById("database");
    let databases = getXMLElementsFromXmlHttpResponse(databaseList, "DB");

    // if the url is a valid innovator instance, add the databases to the dropdown
    if (databases.length > 0) {
        // databaseField.disabled = false;
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
 * Utility function to show the login Dialog
 */
function showLoginDialog() {
    document.getElementById("loginDialog").style.display = "inline";
    document.getElementById("reportPage").style.display = "none";
    document.getElementById("menu").style.display = "none";
    hideMenu();

    // Getting the application URL
    let urlComponents = window.location.href.split('/');
    let serverUrl = urlComponents[0] + "//" + urlComponents[1] + "/" + urlComponents[2] + "/" + urlComponents[3];

    // Populating the Database List
    createXmlHttpRequest(serverUrl + "/Server/DBList.aspx", populateDatabaseList);
}

/**
 * Helper method to get credentials when clicking login
 */
function loginFromUI() {
    let database = document.getElementById("database").value;
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    let rememberMe = document.getElementById("rememberMe").value;

    login(database, username, password, rememberMe);

    return false;
}

/**
 * Managing login with the given user credentials
 * @param {*} database
 * @param {*} username
 * @param {*} password
 */
function login(database, username, password, rememberMe) {
    let urlComponents = window.location.href.split('/');
    let serverUrl = urlComponents[0] + "//" + urlComponents[1] + "/" + urlComponents[2] + "/" + urlComponents[3];

    // attempting login
    let loginSuccesful = oauthLogin(serverUrl, database, username, password, "ProblemReporter");

    // if the user is authenticated successfully, show the new report dialog
    if (loginSuccesful) {
        document.getElementById("loginDialog").style.display = "none";
        document.getElementById("menu").style.display = "inline";

        // Update the UI to show the report page
        setTimeout(function() {
            // Hiding the loading spinner
            document.getElementById("loader").style.display = "none";

            // Showing the report page
            document.getElementById("reportPage").style.display = "block";
        }, 500);

        // saving the user's credentials
        if (rememberMe && window.localStorage) {
            window.localStorage.setItem("database", database);
            window.localStorage.setItem("username", username);
            window.localStorage.setItem("password", password);
        }
    }

    // returning false to prevent page refresh
    return false;
}

function toggleMenu() {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.style.display === "none") {
            openDropdown.style.display = "block"
        } else {
            openDropdown.style.display = "none"
        }
    }
}

function showMenu() {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].style.display = "block";
    }
}

function hideMenu() {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        dropdowns[i].style.display = "none";
    }
}

function signOut() {
    // Clearing the saved credentials
    window.localStorage.clear();

    // Showing the login dialog
    showLoginDialog();
}

function uploadPhoto() {

}

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            console.log("Latitude: " + position.coords.latitude +
                "<br>Longitude: " + position.coords.longitude);
        });
    } else {
        console.error = "Geolocation is not supported by this browser.";
    }

    return false;
}