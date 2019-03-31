function initialize() {
    // Checking if the browser supports service workers
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('../service-worker.js');
        });
    }

    // Getting the application URL
    let urlComponents = window.location.href.split('/');
    let serverUrl = urlComponents[0] + "//" + urlComponents[1] + "/" + urlComponents[2] + "/" + urlComponents[3];

    // Populating the Database List
    createXmlHttpRequest(serverUrl + "/Server/DBList.aspx", populateDatabaseList);

    window.onclick = function(event) {
        if (!event.target.matches('.menuButton')) {
            hideMenu();
        }
    }

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

function showMenu() {
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        openDropdown.classList.add('show');

    }
}

function hideMenu() {
    // TODO: Does not hide after mutliple sign outs
    let dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
        var openDropdown = dropdowns[i];
        if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
        }
    }
}

function signOut() {
    // Clearing the saved credentials
    window.localStorage.clear();

    // Showing the login dialog
    document.getElementById("loginDialog").style.display = "flex";
    document.getElementById("reportPage").style.display = "none";
    document.getElementById("menu").style.display = "none";
    hideMenu();
}