function openNav(sidepanel){
    document.getElementById(sidepanel).style.width = "250px";
}
function closeNav(sidebar){
    document.getElementById(sidebar).style.width = "0px";
}
function switchRoutes(button){
    document.getElementById('routes-panel').style.width = "100%";
    document.getElementById('routes-panel').style.display = "flex";
    document.getElementById('search-panel').style.width = "0%";
    toggleTab(button);
}
function switchSearch(button){
    document.getElementById('search-panel').style.width = "100%";
    document.getElementById('routes-panel').style.display = "none";
    document.getElementById('routes-panel').style.width = "0%";
    toggleTab(button);
}
function toggleTab(clickedButton) {
    const tabs = document.querySelectorAll(".tab"); // Get all buttons

    tabs.forEach(tab => {
        tab.classList.remove("active");  // Remove active from all
        tab.classList.add("inactive");   // Make all inactive
    });

    clickedButton.classList.add("active"); // Activate clicked button
    clickedButton.classList.remove("inactive"); // Remove inactive from clicked button
}


const map = L.map('map', {zoomControl:false}).setView([7.1072857, 125.5946292], 11);
const zoomOptions = { position: 'bottomright' };
L.control.zoom(zoomOptions).addTo(map);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);


let jsonData = [];        // Stores route data from JSON
let activeRoutes = [];    // Stores currently active routes
let routeCoordinates = {};
let routeControls = {}; // Stores all nodes for each route
let routeNodes = {};

// Fetch route data and extract all coordinates
document.addEventListener('DOMContentLoaded', () => {
    fetch('./static/Routes.json')
        .then(response => response.json())
        .then(data => {
            jsonData = data;
            extractRouteCoordinates();
            populateDropdown();
        })
        .catch(error => console.error('Error fetching JSON:', error));
});

// Extract all route coordinates when JSON is fetched
function extractRouteCoordinates() {
    jsonData.forEach(route => {
        const filtered = route.lat_long.filter(([lat, lng]) => lat && lng);
        const waypoints = filtered.map(([lat, lng, name]) => {
            return L.Routing.waypoint(L.latLng(parseFloat(lat), parseFloat(lng)), name);
        }); 

        // Create a routing control (temporarily added to extract nodes)
        const routeControl = L.Routing.control({
            waypoints,
            lineOptions: { styles: [{ color: getRandomColor(), weight: 5 }] }, 
            createMarker: (i, waypoint) => L.marker(waypoint.latLng).bindPopup(waypoint.landmark)
        })

        // Extract all nodes when route is computed
        routeControl.on('routesfound', function (e) {
            routeNodes[route.X1] = {waypoints: waypoints, coordinates : e.routes[0].coordinates.map(coord => L.latLng(coord.lat, coord.lng))};
        });

        routeControls[route.X1] = routeControl; // Store for toggling later
    });
    console.log(routeControls);
}

// Populate dropdown menu with route checkboxes
function populateDropdown() {
    const dropdown = document.getElementById('routes-dropdown');
    dropdown.innerHTML = '';

    jsonData.forEach(item => {
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        const label = document.createElement('label');

        checkbox.type = 'checkbox';
        checkbox.id = item.X1;
        checkbox.addEventListener('change', toggleRouteVisibility);

        label.textContent = item.X1;
        label.htmlFor = item.X1;

        li.appendChild(checkbox);
        li.appendChild(label);
        dropdown.appendChild(li);
    });
}


/**Remove all active routes and update selected ones
function updateRoutes() {
    activeRoutes.forEach(route => map.removeControl(route));
    activeRoutes = [];

    document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
        const routeName = checkbox.id;
        const waypoints = routeCoordinates[routeName].map(latlng => L.Routing.waypoint(latlng));

        if (!waypoints.length) return;

        const route = L.Routing.control({
            waypoints,
            lineOptions: { styles: [{ color: getRandomColor(), weight: 5 }] },
            createMarker: (i, waypoint) => L.marker(waypoint.latLng).bindPopup(waypoint.name).openPopup()
        }).addTo(map);

        activeRoutes.push(route);
    });
}*/

function toggleRouteVisibility() {
    Object.keys(routeControls).forEach(routeName => {
        const checkbox = document.getElementById(routeName);
        if (!checkbox || !routeControls[routeName]) return;

        if (checkbox.checked) {
            routeControls[routeName].addTo(map); // Show the route (waypoints + polyline)
        } else {
            map.removeControl(routeControls[routeName]); // Hide the route completely
        }
    });
}

// Find the closest route and log its distance from the waypoint
function findClosestRoutes() {
    const waypointLatLng = waypoint.getLatLng();
    let closestRoute = { name: "", distance: Infinity };
    console.log(waypointLatLng);

    Object.entries(routeNodes).forEach(([routeName, nodes]) => {
        nodes.coordinates.forEach(node => {
            const dist = map.distance(waypointLatLng, node);
            if (dist < closestRoute.distance) {
                closestRoute = { name: routeName, distance: dist };
            }
        });
    });

    console.log(`🚏 Closest Route: ${closestRoute.name} - Distance: ${closestRoute.distance.toFixed(2)}m`);
}

function saveRoutesToServer() {
    fetch("http://localhost:8000/save-routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(routeNodes)
    })
    .then(response => response.text())
    .then(data => console.log("✅", data))
    .catch(error => console.error("❌ Error saving routes:", error));
}


// Predefined colors
const predefinedColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
function getRandomColor() {
    return predefinedColors[Math.floor(Math.random() * predefinedColors.length)];
}

// Draggable waypoint marker
const waypoint = L.marker([7.0617824, 125.5929889], { draggable: true, styles: [{color: '#FFFFFF', weight: 5 }] }).addTo(map);
waypoint.on('dragend', findClosestRoutes);
