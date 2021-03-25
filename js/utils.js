/**
 * milesToMeters - converts a number of miles to the equivalent number of meters
 * @param {Number} miles number of miles
 * @returns {Number} meters
 */
const milesToMeters = (miles) => miles * 1609.344;

/**
 * metersToMiles - converts a number of meters to the equivalent number of miles
 * @param {Number} miles number of meters
 * @returns {Number} miles
 */
const metersToMiles = (meters) => meters / 1609.344;

/**
 * makeHttpRequest - uses XMLHttpRequest to perform a GET request
 * Adapted from MDN example: https://github.com/mdn/js-examples/blob/master/promises-test/index.html
 * @param {String} url destination for request
 * @returns {Promise} a promise which resolves when request is complete
 */
const makeHttpRequest = (url) => {
  return new Promise(function (resolve, reject) {
    var request = new XMLHttpRequest();
    request.open("GET", url);
    request.onload = function () {
      if (request.status === 200) {
        resolve(JSON.parse(request.response));
      } else {
        // If it fails, reject the promise with a error message
        reject(Error("Error in request" + request.statusText));
      }
    };
    request.onerror = function () {
      // Also deal with the case when the entire request fails to begin with
      // This is probably a network error, so reject the promise with an appropriate message
      reject(Error("There was a network error."));
    };
    request.send();
  });
};

/**
 * handleOsrmResponse - check for errors from OSRM API
 * @param {Object} result API response object
 * @returns {Object} successful response object
 */
const handleOsrmResponse = (result) => {
  if (result.code != "Ok") {
    throw { message: "Error from OSRM", result };
  }
  return result;
};

/**
 * toggleSpinner - hides or displays Bootstrap spinner on form submit button
 * @returns undefined
 */
const toggleSpinner = () => {
  const spinner = document.getElementById("spinner");
  const submitButton = document.getElementById("submit-button");
  spinner.hidden = !spinner.hidden;
  submitButton.disabled = !submitButton.disabled;
};

/**
 * displayWalkLength - adds walk length to DOM element
 * @param {Number} meters length of walk in meters
 * @returns undefined
 */
const displayWalkLength = (meters) => {
  const walkInfo = document.getElementById("walk-info");
  walkInfo.innerHTML = `Total length of walk: ${
    Math.round(metersToMiles(meters) * 100) / 100
  } miles`;
};

/**
 * getFormInputValues - accesses & validates form inputs
 * @returns {Object} object containing input lat, lon, and target length in meters
 */
const getFormInputValues = () => {
  const lat = parseFloat(document.getElementById("latitude").value);
  const lon = parseFloat(document.getElementById("longitude").value);
  const targetLengthMiles = parseFloat(
    document.getElementById("target-length-miles").value
  );
  if (isNaN(lat) || isNaN(lon) || isNaN(targetLengthMiles)) {
    return alert("Invalid input values!");
  }
  const targetLengthMeters = milesToMeters(targetLengthMiles);
  return { lat, lon, targetLengthMeters };
};
