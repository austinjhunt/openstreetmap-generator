import axios from 'axios';
import L from 'leaflet';
import yaml from 'js-yaml';

async function getLatLonFromCityState({ city, state, country }) {
    try {
        var response;
        response = await axios.get(`https://nominatim.openstreetmap.org/search?city=${city}&state=${state}&format=json`);
        if (response.data.length === 0) {
            response = await axios.get(`https://nominatim.openstreetmap.org/search?city=${city}&country=${state}&format=json`);
        }
        const location = response.data[0];
        return {
            'lat': parseFloat(location.lat),
            'lon': parseFloat(location.lon)
        };
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

async function getLatLonFromCountry({  country }) {
    try {
        const response = await axios.get(`https://nominatim.openstreetmap.org/search?country=${country}&format=json`);
        const location = response.data[0];
        return {
            'lat': parseFloat(location.lat),
            'lon': parseFloat(location.lon)
        };
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

async function parseLocation(locationStr) {
    try {
        var city, state, country, latLon, cityState;
        if (!locationStr.includes(',')) {
            // e.g., "the netherlands"
            country = locationStr.trim();
            latLon = await getLatLonFromCountry({ country: country });
        } else { 
            cityState = locationStr.split(',');
            city = cityState[0].trim();
            state = cityState[1].trim(); // could be country
            latLon = await getLatLonFromCityState({city: city, state: state}); 
        }
        return {
            'name': city,
            'state': state,
            'lat': latLon.lat,
            'lon': latLon.lon
        };
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}

function createMap(locations) {
    // set the map center to atlantic ocean, zoomed out 
    const mapCenter = [0, 0];
    const myMap = L.map('map').setView(mapCenter, 2);

    // create the actual map layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: 'Map data © <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
    }).addTo(myMap);



    // now we can add markers to the map
    locations.forEach(loc => {
        L.marker([loc.lat, loc.lon]).addTo(myMap).bindPopup(loc.name);
    });

    return myMap;
}

// get locations from YAML file for John Cobb
async function getLocationsFromYamlFile() {
    //let url = "https://github.com/johndcobb/johndcobb.github.io/blob/master/_data/travel.yml";
    let url = "http://127.0.0.1:5500/_data/travel.yml"

    try {
        const response = await axios.get(url);
        const data = yaml.load(response.data);
        const whereValues = data.map(item => item.where); 
        return whereValues;
    } catch (error) {
        console.error(`Error: ${error}`);
        return null;
    }
}


(async function main() {
    const inputLocations = await getLocationsFromYamlFile();
    const parsedLocations = [];

    for (const locationStr of inputLocations) {
        let parsed = await parseLocation(locationStr);
        if (parsed) {
            parsedLocations.push(parsed);
        }
    }

    createMap(parsedLocations);
})();