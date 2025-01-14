const map = L.map('map').setView([7.1072857, 125.5946292], 11);
L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
         
var zoomOptions = {
    position: 'bottomright'
};

var zoom = L.control.zoom(zoomOptions);
zoom.addTo(map); 

function openNav(sidepanel){
    document.getElementById(sidepanel).style.width = "250px";
}
function closeNav(sidebar){
    document.getElementById(sidebar).style.width = "0px";
}

let jsonData = [];

document.addEventListener('DOMContentLoaded', function() {
    fetch('Routes.json') // Replace with your JSON file path or API endpoint
        .then(response => response.json())
        .then(data => {
        // Store the data in a variable or use it directly
        jsonData = data;
        // Call a function to use the data
        populateDropdown();
    })
    .catch(error => console.error('Error fetching JSON:', error));
});

function showCheckboxes() {
    var checkboxes = document.getElementById("routes-dropdown");
     checkboxes.style.display = checkboxes.style.display === "block" ? "none" : "block";
}
function populateDropdown() {
    const dropdown = document.getElementById('routes-dropdown');
    // Clear existing options (if any)
    dropdown.innerHTML = '';
    // Loop through the JSON data and create options
    jsonData.forEach((item, index) => {
        const li  = document.createElement('li');
        const checkbox = document.createElement('input')
        const label = document.createElement('label')
        checkbox.type = 'checkbox';
        checkbox.id = item.X1;
        checkbox.addEventListener('change', updateRoutes);
        label.textContent = item.X1; 
        label.htmlFor = item.X1;
        li.appendChild(checkbox);
        li.appendChild(label);
        dropdown.appendChild(li);
});
}
let activeRoutes = [];
// Update routes when checkboxes are checked/unchecked
function updateRoutes(){
    activeRoutes.forEach((route)=> map.removeControl(route));
    activeRoutes = [];
    // Get all checked checkboxes
    const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked');
    // Create new routes for checked checkboxes
    checkedCheckboxes.forEach((checkbox) => {
        const routeData = jsonData[jsonData.findIndex(function(item, i ){
            return item.X1 === checkbox.id
        })];
        // Convert routeData to waypoint object
        const filtered = routeData.lat_long.filter(([lat, lng]) => lat && lng);
        const waypoints = filtered.map(([lat, lng, name]) => {
            return L.Routing.waypoint(L.latLng(parseFloat(lat), parseFloat(lng)), name);
        });
        // Create a new route and add it to the map
        const route = L.Routing.control({
            waypoints: waypoints,
            router: L.Routing.osrmv1({
            serviceUrl: 'https://router.project-osrm.org/route/v1',
            }),
            lineOptions: {
            styles: [{ color: getRandomColor(), weight: 5 }], // Random color for each route
            },
            createMarker: (i, waypoints, n) => {
            return L.marker(waypoints.latLng).bindPopup(waypoints.name).openPopup();
            }//return null if waypoint marker is not needed.
        }).addTo(map);
        // Store the route for later removal
        activeRoutes.push(route);
    });
}
const predefinedColors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'];
// Randomly select one of the 5 colors
function getRandomColor() {
    return predefinedColors[Math.floor(Math.random() * 5)];
}
//Randomize all colors
function getRandomColor2() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}