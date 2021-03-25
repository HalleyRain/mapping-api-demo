// TODO: set these variables for your environment
const useLocalOsrm = true; // True if you are running a local instance of OSRM. Otherwise, use their demo server.
const mapboxAccessToken = ""; // Create a free Mapbox account to get an access token
/* ================================ */
const OSRM_BASE_URL = useLocalOsrm
  ? "http://localhost:5000"
  : "https://router.project-osrm.org";
mapboxgl.accessToken = mapboxAccessToken;

const getTrip = (nearbyPoints) => {
  const query = new URLSearchParams();
  query.append("overview", "full");
  query.append("geometries", "geojson");
  const coordinates = nearbyPoints
    .map((point) => point.location.join(","))
    .join(";");
  return makeHttpRequest(
    `${OSRM_BASE_URL}/trip/v1/walking/${coordinates}?${query.toString()}`
  ).then(handleOsrmResponse);
};

const getNearbyPoints = async (lat, lon, distanceFilter = 100) => {
  // Get list of 100 points near to start location
  const query = new URLSearchParams();
  query.append("number", 100);

  const result = await makeHttpRequest(
    `${OSRM_BASE_URL}/nearest/v1/walking/${lon},${lat}?${query.toString()}`
  ).then(handleOsrmResponse);

  const { waypoints: nearbyPoints } = result;
  // Filter to find points which are a certain distance away
  const filteredPoints = nearbyPoints.filter(
    (point) => point.distance >= distanceFilter
  );
  if (filteredPoints.length === 0 && nearbyPoints.length !== 0) {
    // If no points meet the criteria, filter to find points which are half of the input distance away
    const closerPoints = nearbyPoints.filter(
      (point) => point.distance >= distanceFilter / 2
    );
    if (closerPoints.length === 0) {
      // Finally, if no points meet the criteria, return all points
      console.log(
        `No points were farther than ${
          distanceFilter / 2
        } from starting location.`
      );
      return nearbyPoints;
    }
    console.log(
      `No points were farther than ${distanceFilter} from starting location.`
    );
    return closerPoints;
  }
  return filteredPoints;
};

/**
 * getPath - iteratively build a path of the desired length using OSRM
 * @param {Number} lat latitude coordinate of starting location
 * @param {Number} lon longitude coordinate of starting location
 * @param {Number} targetLengthMeters desired path length in meters
 * @returns {Object} includes geometry of the generated path and the length of the path
 */
const getPath = async (lat, lon, targetLengthMeters) => {
  // Load nearby points on the road network from OSRM
  const nearbyPoints = await getNearbyPoints(lat, lon);
  let walkLength = 0;
  // Initially, include the starting location
  const pathPoints = [
    {
      location: [lon, lat],
    },
  ];
  let trip;
  while (walkLength < targetLengthMeters) {
    // Select a random point from the nearby points
    const pointIndex = Math.floor(Math.random() * nearbyPoints.length);
    pathPoints.push(nearbyPoints[pointIndex]);
    // Remove selected point from list to avoid choosing it twice
    nearbyPoints.splice(pointIndex, 1);
    // Generate a trip including the new point
    trip = await getTrip(pathPoints);
    // Check if the generated trip meets the distance requirement
    walkLength = trip.trips[0].distance;
  }
  return {
    geometry: trip.trips[0].geometry,
    distance: walkLength,
  };
};

const loadMapboxMap = (route, startingLocation, points) => {
  const [lon, lat] = startingLocation;
  // Load a map centered on the starting location
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/hrc95/ckmjapfsb0ke117qlrb8vj0ot",
    center: [lon, lat],
    zoom: 16, // starting zoom
  });
  // When map and styles are loaded, add layers
  map.on("load", () => {
    // Display walking path route as a line
    map.addSource("route", { type: "geojson", data: route });
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "black",
        "line-width": 8,
        "line-opacity": 0.3,
      },
    });
    // Display a marker for the starting location
    new mapboxgl.Marker({ color: "black" }).setLngLat([lon, lat]).addTo(map);
    // Display directional arrows along the walking path
    map.addLayer({
      id: "arrowId",
      source: "route",
      type: "symbol",
      layout: {
        "icon-image": "double-arrow-right",
        "icon-allow-overlap": true,
        "symbol-placement": "line",
        "symbol-spacing": 200,
        "icon-size": 0.15,
      },
    });
  });
};

const onFormSubmit = async (e) => {
  e.preventDefault();
  toggleSpinner();
  const { lat, lon, targetLengthMeters } = getFormInputValues();
  const { geometry: routeToDisplay, distance } = await getPath(
    lat,
    lon,
    targetLengthMeters
  );
  loadMapboxMap(routeToDisplay, [lon, lat]);
  toggleSpinner();
  displayWalkLength(distance);
};

window.addEventListener("load", async function () {
  // On the initial page load
  const form = document.getElementById("form");
  form.addEventListener("submit", onFormSubmit);
});
