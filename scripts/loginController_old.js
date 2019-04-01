/**
 * Initializing the Login Dialog
 */
function initializeLoginDialog() {
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

    parent.login(database, username, password);

    return false;
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
        databaseField.disabled = false;
        for (let i = 0; i < databases.length; i++) {
            let database = databases[i];
            let option = document.createElement("option");
            option.text = database.id;
            databaseField.add(option);
        }
        databaseField.selectedIndex = 1;
    }
}