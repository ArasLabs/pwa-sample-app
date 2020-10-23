var serverURL = null;
var database = null;
var clientID = "ProblemReporter";
var username = null;
var userID = null;
var map = null;
var mapMarker = null;
var mapGeocoder = null;
var defaultVaultId = "67BBB9204FE84A8981ED8313049BA06C"
var requestMng = null;

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
    requestMng = requestManager(serverURL)

    window.onclick = function (event) {
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
function populateDatabaseList() {
    var databaseField = document.getElementById("database");

    requestMng.httpGet("/Server/DBList.aspx").then(dbListResponse => {
        var domParser = new DOMParser();
        var xmlDoc = domParser.parseFromString(
            dbListResponse.data,
            "text/xml"
        );

        var dbElements = [...xmlDoc.getElementsByTagName("DB")];

        if (dbElements.length > 0) {
            dbElements.forEach((element) => {
                let option = document.createElement("option");
                option.text = element.id;
                databaseField.add(option);
            });

            databaseField.selectedIndex = 1;
        }
    });
}

/**
 * Shows the login Dialog
 */
function showLoginDialog() {
    // Showing the dialog
    hideAllModules();
    document.getElementById("loginDialog").style.display = "inline";

    // Populating the Database List
    populateDatabaseList()
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
        document.getElementById("loader").style.cssText = "display: none !important";
    }, 500);
}

/**
 * Hides all modules in the application
 */
function hideAllModules() {
    for (var i = 0; i < document.getElementsByClassName("modules").length; i++) {
        document.getElementsByClassName("modules")[i].style.cssText = "display: none !important";
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
    return oauthLogin(serverURL, database, username, password, clientID).then(function (token) {
        requestMng.instance.defaults.headers.common["Authorization"] = 'Bearer ' + token;
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

        initLocationService();
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
    requestMng.instance.defaults.headers.common["Authorization"] = ''

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
 * Get's the user's input from the server and submits the report
 */
function submitReport() {
    var location = (mapGeocoder.mapMarker || mapMarker).getLngLat(),
        longitude = location.lng,
        latitude = location.lat;

    document.getElementById("loader").style.display = "block";
    return new Promise(function (resolve) {
        var image = getImage()
        if (image) {
            resolve(uploadImage(image))
            console.log("Related File was successfully created!")
        } else {
            resolve()
        }
    }).then(fileId => {
        var prRequestBody = buildRequestBody()
        prRequestBody.coordinates = JSON.stringify({ longitude, latitude });
        if (fileId) {
            prRequestBody["PR File"] = [{ "related_id@odata.bind": "File('" + fileId + "')" }]
        }

        return requestMng.httpPost("/Server/OData/PR", prRequestBody)
            .then(reportResp => {
                console.log("PR item successfully created!")
                alert("Report " + problemReport.item_number + " was created successfully!")
                    document.getElementById("loader").style.cssText = "display: none !important";
            }).catch(e => {
                console.log(e)
                document.getElementById("loader").style.cssText = "display: none !important";
            });;
    });
}

function buildRequestBody() {
    // getting the form info
    var title = document.getElementById("title").value;
    var description = document.getElementById("description").value;
    var problemDate = document.getElementById("problemDate").value;

    var location = document.getElementById("locationStr").textContent;

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

    return body
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

    return requestMng.httpGet("/server/odata/PR?$filter=reported_by eq '" + userID + "'")
        .then(function (response) {
            var prItems = response.data.value
            // looping through the response to create a card for each response

            var fileIds = []
            var targetStr = "fileId=";

            for (var i = 0; i < prItems.length; i++) {

                var cardBlock = document.createElement("div");
                cardBlock.classList.add("card-block");
                var card = document.createElement("div");
                card.classList.add("card");
                var problemReport = prItems[i];
                var styleNode = document.createElement("h3");
                var textNode = document.createTextNode(problemReport.item_number);
                styleNode.appendChild(textNode);
                card.appendChild(styleNode);
                card.appendChild(document.createTextNode(problemReport.title));
                card.appendChild(document.createElement("br"));

                if (problemReport.location) {
                    var location = document.createElement("div");
                    location.classList.add("ellipsis");
                    location.innerText = problemReport.location;
                    card.appendChild(location);
                }

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

                var map = document.createElement("div");
                map.classList.add("map_pr");

                if (problemReport.thumbnail) {
                    var index = problemReport.thumbnail.indexOf(targetStr);
                    var fileId = problemReport.thumbnail.substring(index + targetStr.length);
                    fileIds.push(fileId)

                    var locationThumbnail = document.createElement("img");
                    locationThumbnail.classList.add("card_img");
                    locationThumbnail.id = fileId
                    map.appendChild(locationThumbnail)
                } else {
                    map.textContent = "No thumbnail"
                }

                cardBlock.appendChild(card);
                cardBlock.appendChild(map);
                module.appendChild(cardBlock);

                //initUserReportMaps(map.id,)
            }
            loadLocationThumbnails(fileIds)
        }).catch(function () {
            alert("Unable to connect to server");
        });
}

function loadLocationThumbnails(fileIds) {
    getFilesUrls(fileIds).then(files => {
        if (files && files.length > 0) {
            files.forEach(file => {
                var imageEl = document.getElementById(file.fileId)
                imageEl.setAttribute('alt', file.name)
                imageEl.src = file.url
            })
        }

    })
}

/**
 * Takes the user's username and get's the user's id from the server
 */
function getUserID() {
    let rememberMe = document.getElementById("rememberMe").value;
    return requestMng.httpGet("/server/odata/Alias?$expand=related_id($select=id)&$filter=source_id/login_name eq '" + username + "'&$select=id")
        .then(function (response) {
            userID = response.data.value[0].related_id.id;
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

function uploadImage(image) {
    // Split our file into content chunks
    var chunkSize = 4096;

    // Starting the transaction by getting a tansaction ID
    return requestMng.httpPost("/vault/odata/vault.BeginTransaction", {}, {
        headers: { "VAULTID": defaultVaultId }
    }).then(function (transactionResponse) {
        var transactionID = transactionResponse.data.transactionId;
        return uploadFileInChunks(chunkSize, image, transactionID)
            .then(function (imageId) {
                return imageId;
            })
    }).catch(function (e) {
        console.log(e)
        alert("Unable to connect to server");
    });
}

function uploadFileInChunks(chunkSize, file, transactionID) {
    // Build our blob array
    var fileID = generateNewGuid().split('-').join('').toUpperCase();

    // Split our file into content chunks
    var chunkUploadPromiseArray = new Array();
    //var chunkUploadAttempts = 5;
    var i = 0;
    chunkSize = file.size;
    while (i < file.size) {
        var endChunkSize = i + chunkSize;
        endChunkSize = (endChunkSize < file.size) ? endChunkSize : file.size;
        endChunkSize = endChunkSize - 1;
        var chunkBlob = file.slice(i, (endChunkSize + 1));

        chunkUploadPromiseArray.push(
            requestMng.httpPost("/vault/odata/vault.UploadFile?fileId=" + fileID, chunkBlob, {
                headers: {
                    "Content-Disposition": "attachment; filename*=utf-8''" + encodeURI(file.name),
                    "Content-Range": "bytes " + i + "-" + endChunkSize + "/" + file.size,
                    "Content-Type": "application/octet-stream",
                    "VAULTID": defaultVaultId,
                    "transactionid": transactionID
                }
            })
        )
        i = endChunkSize + 1;
    }

    return Promise.all(chunkUploadPromiseArray).then(function (values) {
        var boundary = "batch_" + fileID;
        var commit_body = "--";
        commit_body += boundary + "\r\n";
        commit_body += "Content-Type: application/http\r\n\r\n";
        commit_body += "POST " + serverURL + "/Server/odata/File HTTP/1.1\r\n";
        commit_body += "Content-Type: application/json\r\n\r\n";
        commit_body += '{"id":"' + fileID + '",';
        commit_body += '"filename":"' + file.name + '",';
        commit_body += '"file_size":' + file.size + ',';
        commit_body += '"Located":[{"file_version":1,"related_id":"' + defaultVaultId + '"}]}\r\n';
        commit_body += "--" + boundary + "--";

        return requestMng.httpPost("/vault/odata/vault.CommitTransaction", commit_body, {
            headers: {
                "VAULTID": defaultVaultId,
                "Content-Type": "multipart/mixed; boundary=" + boundary,
                "transactionid": transactionID
            }
        }).then(function (fileUploadResponse) {
            console.log("commit response : " + fileUploadResponse.toString());
            var startIndex = fileUploadResponse.data.indexOf("{");
            var endIndex = fileUploadResponse.data.lastIndexOf("}") + 1;
            var jsonResponse = fileUploadResponse.data.substring(startIndex, endIndex);
            return JSON.parse(jsonResponse).id;
        })
            .catch(function (err) {
                console.log("Error in uploadFileInChunks promise : Unable to connect to server");
                alert("Unable to connect to server");
            });

    });
}

function getFilesUrls(fileIds) {
    var data = {
        idList: `'${fileIds.join("','")}'`
    }

    return requestMng.httpPost("/server/odata/method.labs_getFileLocated", data)
        .then(function (filesWithLocation) {
            if (!filesWithLocation || !filesWithLocation.data || !filesWithLocation.data.Item) {
                console.log(`"files with location", idList: ${fileIds.join(",")} was not found.`);
                return;
            }

            let items = [];
            var filesLocated = filesWithLocation.data.Item;
            var filesLocatedToFile = item => ({
                fileId: item["@aras.id"],
                vaultId: item.Relationships.Item.related_id.Item["@aras.id"],
                fileName: item.filename
            });

            if (filesLocated instanceof Array) {
                items = filesLocated.map(filesLocatedToFile);
            } else if (filesLocated instanceof Object) {
                items = [filesLocatedToFile(filesLocated)];
            }

            return Promise.all(
                items.map(fileItem =>
                    Promise.resolve(requestMng.httpPost("/server/AuthenticationBroker.asmx/GetFileDownloadToken?rnd=" + Math.random(), {
                        param: { fileId: fileItem.fileId }
                    })).then(
                        value => ({ status: 'fulfilled', item: fileItem, value: value })
                        , reason => ({ status: 'rejected', item: fileItem, reason: reason })
                    )
                )).then(results => {
                    var files = [];

                    results.forEach(result => {

                        if (result.status == "fulfilled") {
                            if (!result.value || !result.value.data || !result.value.data.d) {
                                console.log(
                                    `Toket for file with name: ${result.item.fileName} id: ${result.item.fileId} was not found`
                                )
                                return
                            }
                            const fileToken = result.value.data.d;

                            let imageUrl =
                                serverURL +
                                "/vault/vaultserver.aspx" +
                                "?dbName=" + database +
                                "&fileId=" + result.item.fileId +
                                "&fileName=" + result.item.fileName +
                                "&vaultId=" + result.item.vaultId +
                                "&token=" + fileToken;

                            files.push({
                                name: result.item.fileName,
                                fileId: result.item.fileId,
                                url: imageUrl
                            })
                        }
                        if (result.status == "rejected") {
                            console.log(`FileToken for file with id ${result.item.fileId} was not found`, result.reason)
                        }
                    })

                    return files;
                });
        });
}

function initLocationService() {
    requestMng.httpGet("/server/odata/Variable?$filter=name eq 'labs_MapToken'&$select=value,default_value").then(res => {
        console.log(res)
        if(!res || !res.data || !res.data.value || res.data.value.length <= 0)
            return

        var mapToken = res.data.value[0]

        mapboxgl.accessToken = mapToken.value || value.default_value
        if (!mapboxgl.supported()) {
            alert('Your browser does not support Mapbox GL');
        } else {

            getCurrentLocation().then((location) => {
                let startingPosition = [location.longitude, location.latitude]
                map = new mapboxgl.Map({
                    container: 'map',
                    style: 'mapbox://styles/mapbox/streets-v11',
                    center: startingPosition,
                    zoom: 16
                });

                mapMarker = new mapboxgl.Marker({ color: "#4668F2" }).setLngLat(startingPosition).addTo(map);
                mapGeocoder = new MapboxGeocoder({
                    accessToken: mapboxgl.accessToken,
                    localGeocoder: coordinatesGeocoder,
                    mapboxgl: mapboxgl,
                    zoom: map.getZoom()
                })

                document.getElementById('geocoder').appendChild(mapGeocoder.onAdd(map));
                map.on('load', () => {
                    reverseGeocodingRequest(location.longitude, location.latitude).then(res => {
                        document.getElementById('locationStr').textContent = res
                    })
                    map.addSource('single-point', {
                        type: 'geojson',
                        data: {
                            type: 'FeatureCollection',
                            features: []
                        }
                    });


                    setTimeout(() => map.resize(), 100)

                    mapGeocoder.on('result', function (e) {
                        var result = e.result
                        map.getSource('single-point').setData(result.geometry);

                        var locationStrField = document.getElementById('locationStr')

                        if (!Object.prototype.hasOwnProperty.call(result, "id")) {
                            reverseGeocodingRequest(result.center[0], result.center[1]).then(res => {
                                locationStrField.textContent = res
                            })
                        } else {
                            locationStrField.textContent = result.place_name
                        }
                    })
                });
            })
        }
    });
}

function getCurrentLocation() {
    return new Promise(function (resolve, rejected) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(resolve, rejected);
        } else {
            console.error("Geolocation is not supported by this browser.");
            resolve(null);
        };
    }).then(function (position) {
        if (position !== null && position !== undefined && position.code !== 1) {
            let { latitude, longitude } = position.coords


            return { latitude, longitude }
        }
        return null;
    });
}

function coordinatesGeocoder(query) {
    // match anything which looks like a decimal degrees coordinate pair
    var matches = query.match(
        /^[ ]*(?:Lat: )?(-?\d+\.?\d*)[, ]+(?:Lng: )?(-?\d+\.?\d*)[ ]*$/i
    );
    if (!matches) {
        return null;
    }

    function coordinateFeature(lng, lat) {
        return {
            center: [lng, lat],
            geometry: {
                type: 'Point',
                coordinates: [lng, lat]
            },
            place_name: 'Lat: ' + lat + ' Lng: ' + lng,
            place_type: ['coordinate'],
            properties: {},
            type: 'Feature'
        };
    }

    var coord1 = Number(matches[1]);
    var coord2 = Number(matches[2]);
    var geocodes = [];

    if (coord1 < -90 || coord1 > 90) {
        // must be lng, lat
        geocodes.push(coordinateFeature(coord1, coord2));
    }

    if (coord2 < -90 || coord2 > 90) {
        // must be lat, lng
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    if (geocodes.length === 0) {
        // else could be either lng, lat or lat, lng
        geocodes.push(coordinateFeature(coord1, coord2));
        geocodes.push(coordinateFeature(coord2, coord1));
    }

    return geocodes;
}


function reverseGeocodingRequest(longitude, latitude) {
    var req = mapGeocoder.geocoderService.reverseGeocode({ query: [longitude, latitude], types: ["poi"], limit: 1 })
    return mapGeocoder.geocoderService.client.sendRequest(req).then(res => {
        if (res && res.body && res.body.features && res.body.features.length > 0) {
            return res.body.features[0].place_name
        }
        return ""
    });

}
/*
function generateThumbnailLink(longitude, latitude, token, width = 400, height = 300) {
    // Marker API params: /static/ {name}-{label}+{color}({lon},{lat})
    // name - Marker shape and size. Options are pin-s and pin-l.
    return `https://api.mapbox.com/styles/v1/mapbox/${map.style.stylesheet.id}/static/pin-s+4668F2(${longitude},${latitude})/${longitude},${latitude},${map.getZoom()}}/${width}x${height}?access_token=${token}`
}

1*/