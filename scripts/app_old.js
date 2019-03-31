/**
 * Function to initialize the application
 */
function initialize() {
  // Checking if there is local storage
  // if (window.localStorage) {
  //   let database = window.localStorage.getItem("database");
  //   let username = window.localStorage.getItem("username");
  //   let password = window.localStorage.getItem("password");

  //   // Logging in the previous user
  //   if (database !== null && username !== null && password !== null) {
  //     login(database, username, password);
  //     return false;
  //   }
  // }
  // // Showing Login Dialog
  document.getElementById("mainContent").src = 'pages/login.html';

  // Checking if the browser supports service workers
  if ('serviceWorker' in navigator) {
    // debugger;
    // window.addEventListener('load', function() {
    navigator.serviceWorker.register('../service-worker.js');
    // });
  }

  return false;
}

/**
 * Managing login with the given user credentials
 * @param {*} database
 * @param {*} username
 * @param {*} password
 */
function login(database, username, password) {
  let urlComponents = window.location.href.split('/');
  let serverUrl = urlComponents[0] + "//" + urlComponents[1] + "/" + urlComponents[2] + "/" + urlComponents[3];

  // attempting login
  let loginSuccesful = oauthLogin(serverUrl, database, username, password, "ProblemReporter");

  // if the user is authenticated successfully, show the new report dialog
  if (loginSuccesful) {
    displayReportPage();

    // saving the user's credentials
    if (window.localStorage) {
      window.localStorage.setItem("database", database);
      window.localStorage.setItem("username", username);
      window.localStorage.setItem("password", password);
    }
  }

  // returning false to prevent page refresh
  return false;
}

/**
 * Function to display the new report page
 */
function displayReportPage() {
  // debugger;
  // Displaying the report
  document.getElementById("mainContent").src = 'pages/newReport.html';
  // debugger;

  // Hide the loader after the report frame is displayed
  setTimeout(function() {
    document.getElementById("loader").style.display = "none";
  }, 500);
}