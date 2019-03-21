// Setting the date field to the current date
let today = new Date().toISOString().substr(0, 10);
document.getElementById("date").value = today;

// Getting the user's location
var x = document.getElementById("location");

function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    x.innerHTML = "Latitude: " + position.coords.latitude +
        "<br>Longitude: " + position.coords.longitude;
}

var cameraOpen = false;

function previewFile() {
    var preview = document.getElementById('imageResult');
    var file = document.getElementById("imageUpload").files[0];
    var reader = new FileReader();

    reader.onload = (function(theFile) {
        return function(e) {
            document.getElementById('imageResult').innerHTML = ['<img src="', e.target.result, '" title="', theFile.name, '" width="50" />'].join('');
            document.getElementById("myCamera").style.height = 0;
            document.getElementById("cameraButton").value = "Open Camera";
            Webcam.reset();
            cameraOpen = false;
        };
    })(file);

    if (file) {
        reader.readAsDataURL(file);
    }
}

// Helper method to decide on opening the camera or taking a picture
function camera() {
    if (cameraOpen) {
        takePicture();
    } else {
        openCamera();
    }
}

function openCamera() {
    Webcam.set({
        width: 320,
        height: 240,
        image_format: 'jpeg',
        jpeg_quality: 1080
    });

    Webcam.attach(document.getElementById("myCamera"));
    document.getElementById("cameraButton").value = "Take Picture";
    cameraOpen = true;
}

function takePicture() {
    // take snapshot and get image data
    Webcam.snap(function(data_uri) {
        // display results in page
        document.getElementById('imageResult').innerHTML =
            '<img src="' + data_uri + '"/>';
    });
    Webcam.reset();
    document.getElementById("myCamera").style.height = 0;
    document.getElementById("cameraButton").value = "Open Camera";
    document.getElementById("imageUpload").value = "";

    cameraOpen = false;
}