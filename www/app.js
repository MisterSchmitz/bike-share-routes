// Application variables
var addressStart, addressEnd, placeStart, placeEnd;
var walkTime=0, bikeTime=0, walkDistance=0, bikeDistance=0;
var stations=[];
var markers=[];

function resetSearch() {
  addressStart=null, addressEnd=null, placeStart=null, placeEnd=null
  walkTime=0, bikeTime=0, walkDistance=0, bikeDistance=0;
  markers = [];
}

// Images
var markerA = '/images/markerA.png';
var markerB = '/images/markerB.png';

// Google Maps API Callback Function
function initMap() {

  map = new google.maps.Map(document.getElementById('map'), {
    // center: {lat: 40.014984, lng: -105.270546},  // Boulder, CO
    // zoom: 14
  });

  // Initialize Google Maps Services
  geocoder = new google.maps.Geocoder();
  infoWindow = new google.maps.InfoWindow();
  // distanceMatrixService = new google.maps.DistanceMatrixService;
  directionsService = new google.maps.DirectionsService();

  var bounds = new google.maps.LatLngBounds();

  // Choose Station List
  var markerStation = '/images/bcycle.png';
  // var markerStation = '/images/divvy.png';

  // var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_arborbike/station_information.json" // Ann Arbor
  // var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_austin/station_information.json" // Austin
  var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_boulder/station_information.json";  // Boulder
  // var stationInformationUrl = "https://gbfs.divvybikes.com/gbfs/en/station_information.json" //Chicago
  // var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_denver/station_information.json";   // Denver
  // var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_lametro/station_information.json"; // Los Angeles
  // var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_madison/station_information.json"; // Madison
  // var stationInformationUrl = "https://gbfs.citibikenyc.com/gbfs/en/station_information.json"; // New York City
  // var stationInformationUrl = "https://gbfs.bcycle.com/bcycle_indego/station_information.json" // Philadelphia
  // var stationInformationUrl = "https://gbfs.bayareabikeshare.com/gbfs/en/station_information.json" // San Francisco
  // var stationInformationUrl = "http://santamonicabikeshare.com/opendata/station_information.json" // Santa Monica

  // TODO: Implement station status: https://gbfs.bcycle.com/bcycle_boulder/station_status.json
  
  // Pull Stations from URL
  function pullStations(url) {
    $.getJSON(url, function(data) {          
      $.each(data.data.stations, function(i, station) {
        // Push the station to our array of stations
        stations.push(station);
    });
  }

  function createStationMarkers(stations, markerIcon) {
    $.each(stations, function(i, station) {
        // Create station markers
        var marker = new google.maps.Marker({
          map: map,
          position: new google.maps.LatLng(station.lat, station.lon),
          title: station.name,
          icon: markerStation,
          id: i
        });
        // Push the marker to our array of markers
        markers.push(marker);
        // Extend the boundaries of the map for each marker
        bounds.extend(marker.position);
      });
      map.fitBounds(bounds);
    })
  }

  pullStations(stationInformationUrl);
  createStationMarkers(stations, markerStation);

  // Places autocomplete
  var startAutocomplete = new google.maps.places.Autocomplete(
    document.getElementById('address-start'));    
  var endAutocomplete = new google.maps.places.Autocomplete(
    document.getElementById('address-end'));
  
  // Bias the boundaries within the map for the text
  startAutocomplete.bindTo('bounds', map);
  endAutocomplete.bindTo('bounds', map);

/////////////////////////////////////////////////////
  // User initiates search:
/////////////////////////////////////////////////////        
  document.getElementById('search-button').addEventListener('click', function() {
    // console.time("Total Time to complete request");

    clearAllMarkers();
    // document.getElementById("map").style.width = "70%";
    // document.getElementById("directionsPanel").style.left = "0px";

    // User inputs
    addressStart = document.getElementById('address-start').value;
    addressEnd = document.getElementById('address-end').value;
    
    // User inputs (as places, if applicable)
    placeStart = startAutocomplete.getPlace();
    placeEnd = endAutocomplete.getPlace();

    // console.log(placeStart);
    // console.log(placeEnd);

    var geoLocations = [];
    var stationLocations = [];

    $('#map').addClass('loading-mask');

    // Verify addresses and begin 
    // console.time("sub: Verify Addresses");
    Promise.all([
      verifyAddress(addressStart, placeStart, bounds),
      verifyAddress(addressEnd, placeEnd, bounds)
      ])
    // Set Geocoded addresses and find bike station nearest to each address
    .then(function(results) {
      // console.timeEnd("sub: Verify Addresses");
      geoLocations.push(results[0].geometry.location);
      geoLocations.push(results[1].geometry.location);
      // console.log("geoLocations:");
      // console.log(geoLocations);
      // Add start and end markers to map
      // console.time("sub: Add start and end markers to map");
      createMarker(map, geoLocations[0], "Origin", markerA);
      createMarker(map, geoLocations[1], "Destination", markerB);
      // console.timeEnd("sub: Add start and end markers to map");
      // Find bike station nearest to each address
      // console.time("sub: Find Nearest Station");
      return new Promise(function(resolve, reject) {
        stationLocations.push(findNearestStation(results[0], stations));
        stationLocations.push(findNearestStation(results[1], stations));
        resolve();
      });
    })
    // Get directions
    .then(function(results) {
      // console.timeEnd("sub: Find Nearest Station");
      // console.time("sub: Get directions");
      // console.log("stationLocations:");
      // console.log(stationLocations);
      return Promise.all([
          getDirections(geoLocations[0], stationLocations[0], "WALKING"),   // start
          getDirections(stationLocations[1], geoLocations[1], "WALKING"),   // end
          getDirections(stationLocations[0], stationLocations[1], "BICYCLING")  // middle
        ])
    })
    // Sum up direction distance and duration
    .then(function(results) {
      // console.timeEnd("sub: Get directions");
      // console.time("sub: Sum up direction distance and duration");
        walkDistance = results[0].routes[0].legs[0].distance.value + results[1].routes[0].legs[0].distance.value;
        walkTime = results[0].routes[0].legs[0].duration.value + results[1].routes[0].legs[0].duration.value;
        bikeDistance = results[2].routes[0].legs[0].distance.value;
        bikeTime = results[2].routes[0].legs[0].duration.value;
        return results;
    })
    // Add directions to map and directions panel
    .then(function(results) {
      // console.timeEnd("sub: Sum up direction distance and duration");
      // console.time("sub: Add directions to map and directions panel");
      return Promise.all([
          displayDirections(results[0], "directionsPanelStart"),
          displayDirections(results[1], "directionsPanelEnd"),
          displayDirections(results[2], "directionsPanelMiddle")
        ])
    })
    // Reset map's bounds based on active markers and display results panel (total distance and duration)
    .then(function(results) {
      $('#map').removeClass('loading-mask');
      // console.timeEnd("sub: Add directions to map and directions panel");
      // console.time("sub: Fit Map to Bounds");
      fitMapToBounds(map, markers);
      // console.timeEnd("sub: Fit Map to Bounds");
      // console.time("sub: Display Results");
      displayResults();
      // console.timeEnd("sub: Display Results");
      // console.timeEnd("Total Time to complete request");            
    })
    .catch(function(status){
      console.log(status);
      Error(status);
    });
  });
}


function clearAllMarkers() {
  for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
    }
}


function verifyAddress(address, place, bounds) {
  return new Promise(function(resolve,reject) {
    // Check whether address or place was given.
    if (place == undefined) {
      return resolve(geoCodeAddress(address, bounds));
    } else {
      resolve(place);
    }
  })
}


function geoCodeAddress(address, bounds) {
  return new Promise(function(resolve,reject) {
    geocoder.geocode( {'address': address, 'bounds': bounds}, function(results, status) {
      if (status === google.maps.GeocoderStatus.OK) {
        resolve(results[0]);
      } else {
        window.alert("Unable to verify address: "+address);
        reject(status);
      }
    });
  });
}


function findNearestStation(address, stations) {
    // console.log(address);
    // Find the closest station, using pyth distance
    // Get LatLng coordinates for current address
    var addLat = parseFloat(address.geometry.location.lat());
    var addLng = parseFloat(address.geometry.location.lng());

    // find the pyth distance of each station to current address, and return index of min distance
    var pythDistances = [];
    var min = 1;
    var index = 0;

    for (var i = 0; i < stations.length; i++) {
      curr = Math.sqrt(Math.pow(addLat - parseFloat(stations[i].lat),2)+Math.pow(addLng - parseFloat(stations[i].lon),2));
      if (curr < min) {
        min = curr;
        index = i;
      }
    }
    // console.log("Nearest B-Cycle station: \n" + stations[index].name);
    markers[index].setMap(map);
    // console.log(markers[index].position);
    return markers[index].position;
}


function getDirections(orig, dest, mode) {
  return new Promise(function(resolve, reject) {
    directionsService.route({
        origin: orig,
        destination: dest,
        travelMode: google.maps.TravelMode[mode],
        unitSystem: google.maps.UnitSystem.IMPERIAL,
      }, function(response, status) {
        if (status !== google.maps.DirectionsStatus.OK) {
          console.log(status);
          reject(Error(status));
        } else {
          resolve(response);
        }
      });
  });
}


function displayDirections(directions, panel) {
  return new Promise(function(resolve, reject) {
    var directionsDisplay = new google.maps.DirectionsRenderer({suppressMarkers: true, suppressBicyclingLayer: true});
    directionsDisplay.setDirections(directions);
    directionsDisplay.setMap(map);
    directionsDisplay.setPanel(document.getElementById(panel));
    resolve();
  });
}

// Create a new marker
function createMarker(map, position, title, icon) {
  return new Promise(function(resolve, reject) {
    marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      icon: icon
    });
    markers.push(marker);
    resolve();
  });
}

// Extend a map's bounds based on active markers, and fit map to bounds
function fitMapToBounds(map, markers) {
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < markers.length; i++) {
    if (markers[i].map != null) {
      // console.log(markers[i].position);
      bounds.extend(markers[i].position);
    }
  }
  map.fitBounds(bounds);
}


function displayResults() {
    var totalTimeFormatted, bikeTimeFormatted, walkTimeFormatted, walkDistanceFormatted, bikeDistanceFormatted;

    totalTimeFormatted = (Math.round((walkTime+bikeTime)/60))+" mins";
    walkTimeFormatted = (Math.round((walkTime)/60))+" mins";
    bikeTimeFormatted = (Math.round((bikeTime)/60))+" mins";

    if (walkDistance <= 160) {
      walkDistanceFormatted = Math.round(walkDistance*3.28084)+" ft";
    } else {
      walkDistanceFormatted = (Math.round(walkDistance*0.000621371 * 10) / 10)+" mi";
    }

    if (bikeDistance <= 160) {
      bikeDistanceFormatted = Math.round(bikeDistance*3.28084)+" ft";
    } else {
      bikeDistanceFormatted = (Math.round(bikeDistance*0.000621371 * 10) / 10)+" mi";
    }

    results.innerHTML = "<h4>Total Travel Time: "+totalTimeFormatted+"</h4><h4>Walking Distance: "+walkDistanceFormatted+" ("+walkTimeFormatted+")</h4><h4>Biking Distance: "+bikeDistanceFormatted+" ("+bikeTimeFormatted+")</h4>";

    // Update marker icons in results panel for B-cycle stations
    // ISSUE: not evaluating when it needs to
    var directionPanelMarkers = document.getElementsByClassName("adp-marker");
    // console.log(directionPanelMarkers);
    // console.log(directionPanelMarkers.length);
    for (var i = 1; i < directionPanelMarkers.length-1; i++) {
        console.log("hello");
        console.log(directionPanelMarkers[i]);
        directionPanelMarkers[i].src=markerStation;
        directionPanelMarkers.style.height = "29px";
        directionPanelMarkers.style.width = "29px";
    }
};

// function createMarker(element, index, array) {
//   var html = "<b>" + element.name + "</b> <br/>" + element.formatted_address;
//   var marker = new google.maps.Marker({
//     map: map,
//     position: element.geometry.location,
//     animation: google.maps.Animation.DROP,
//     title: element.formatted_address
//   });
//   google.maps.event.addListener(marker, 'click', function() {
//     infoWindow.setContent(html);
//     infoWindow.open(map, marker);
//   });
//   // bounds.extend(element.geometry.location);
//   markers.push(marker);
// }