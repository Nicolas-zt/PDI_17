// 📌 Centrer la carte sur La Réunion (Piton de la Fournaise)
let map = L.map('map').setView([-21.2449, 55.7089], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let vectorLayer = L.layerGroup().addTo(map); // Pour les vecteurs GNSS
let errorLayer = L.layerGroup().addTo(map); // Pour les erreurs
let stationMarkers = L.layerGroup().addTo(map); // Pour les stations

let dateSlider = document.getElementById("dateSlider");
let selectedDateDisplay = document.getElementById("selectedDate");
let periodRadios = document.querySelectorAll("input[name='period']");

let gnssData = [];
let dates = [];
let selectedPeriod = "90"; // Par défaut : 90 jours

//Charger les données GNSS
function loadGNSSData() {
    fetch("process.php")
        .then(response => response.json())
        .then(data => {

            gnssData = data;
            dates = Object.keys(gnssData).sort();
            
            if (dates.length > 0) {
                dateSlider.min = 0;
                dateSlider.max = dates.length - 1;
                dateSlider.value = 0;
                updateVectors(0);
            }
        })
}

//Mettre à jour les vecteurs GNSS
function updateVectors(index) {

    let selectedDate = dates[index];
    selectedDateDisplay.textContent = `Date sélectionnée : ${selectedDate}`;
    
    let stationsData = gnssData[selectedDate];

    vectorLayer.clearLayers();
    errorLayer.clearLayers();
    stationMarkers.clearLayers();

    for (let station in stationsData) {
        let stationData = stationsData[station];
        let position = stationData.position;
        let [dE, dN, dU] = (selectedPeriod === "90") ? stationData.vector_1.map(Number) : stationData.vector_2.map(Number);
        let [s_dE, s_dN, s_dU] = (selectedPeriod === "90") ? stationData.error_1.map(Number) : stationData.error_2.map(Number);

        let startPoint = [position.lat, position.lon];
        let endPoint = [startPoint[0] + dN/1000, startPoint[1] + dE/1000];

        // Ajouter le vecteur GNSS
        L.polyline([startPoint, endPoint], { color: "red" }).addTo(vectorLayer);

        // Ajouter un cercle d'erreur autour du point final
        let errorRadius = Math.sqrt(s_dE ** 2 + s_dN ** 2) ;
        L.circle(endPoint, {
            radius: errorRadius,
            color: "blue",
            fillOpacity: 0.3
        }).addTo(errorLayer);

        // Ajouter un marqueur pour identifier la station
        L.marker(startPoint).addTo(stationMarkers).bindPopup(`<b>Station:</b> ${station}`);
    }
}

//Gérer les événements du slider
dateSlider.addEventListener("input", function () {
    updateVectors(this.value);
});

//Gérer le changement de période
periodRadios.forEach(radio => {
    radio.addEventListener("change", function () {
        selectedPeriod = this.value;
        updateVectors(dateSlider.value);
    });
});

// Charger les données au démarrage
loadGNSSData();
