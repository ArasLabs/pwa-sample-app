function login() {
  document.getElementById("loginDialog").style.display = 'none';
  document.getElementById("reportFrame").src = '/pages/createReport.html';
  setTimeout(function() {
    document.getElementById("loader").style.display = "none";
  }, 1000);
  return false;
}



(function() {
  'use strict';

  // disabling database field if there is no innovator url
  var url = document.getElementById("url");
  var database = document.getElementById("database");
  database.disabled = true;
  url.addEventListener('keyup', function() {
    if (url.value === null || url.value.length === 0) {
      database.disabled = true;
      database.selectedIndex = "0";
      for (var i = 1; i < database.options.length; i++) {
        database.remove(i);
      }
    } else {
      database.disabled = false;
    }
  });


  // Checking if the browser supports service workers
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('./service-worker.js')
      .then(function() {
        console.log('Service Worker Registered');
      });
  }
})();