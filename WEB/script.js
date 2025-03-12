let map = L.map('map').setView([-21.2449, 55.7089], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let vectorLayer = L.layerGroup().addTo(map);
let errorLayer = L.layerGroup().addTo(map);
let stationMarkers = L.layerGroup().addTo(map);

let dateSlider = document.getElementById("dateSlider");
let selectedDateDisplay = document.getElementById("selectedDate");
let periodSelection = document.getElementById("periodSelection");

let gnssData = [];
let dates = [];
let availablePeriods = [];
let selectedPeriod = 0;

function loadGNSSData() {
    fetch("process.php")
        .then(response => response.json())
        .then(data => {
            gnssData = data.data;
            dates = Object.keys(gnssData).sort();
            availablePeriods = Object.values(data.periods); // Récupérer les périodes triées

            if (availablePeriods.length > 0) {
                periodSlider.min = 0;
                periodSlider.max = availablePeriods.length - 1;
                periodSlider.value = 0;
                selectedPeriodLabel.textContent = `${availablePeriods[0]} jours`;
            }

            if (dates.length > 0) {
                dateSlider.min = 0;
                dateSlider.max = dates.length - 1;
                dateSlider.value = 0;
                updateVectors(0, 0);
            }
        });
}

// Mettre à jour les vecteurs GNSS
function updateVectors(dateIndex, periodIndex) {
    let selectedDate = dates[dateIndex];
    let selectedPeriod = availablePeriods[periodIndex];
    selectedDateDisplay.textContent = `Date sélectionnée : ${selectedDate}`;
    selectedPeriodLabel.textContent = `${selectedPeriod} jours`;

    let stationsData = gnssData[selectedDate];

    vectorLayer.clearLayers();
    errorLayer.clearLayers();
    stationMarkers.clearLayers();

    for (let station in stationsData) {
        let stationData = stationsData[station];
        let position = stationData.position;
        let { vector, error } = stationData.vectors[selectedPeriod] || {};

        if (!vector) continue;

        let startPoint = [position.lat, position.lon];
        let endPoint = [startPoint[0] + vector[1] / 1000, startPoint[1] + vector[0] / 1000];

        // Ajouter le vecteur GNSS
        L.polyline([startPoint, endPoint], { color: "red" }).addTo(vectorLayer);

        // Ajouter un cercle d'erreur
        let errorRadius = Math.sqrt(error[0] ** 2 + error[1] ** 2);
        L.circle(endPoint, {
            radius: errorRadius,
            color: "blue",
            fillOpacity: 0.3
        }).addTo(errorLayer);

        L.marker(startPoint).addTo(stationMarkers).bindPopup(`<b>Station:</b> ${station}`);
    }
}

// Gérer les événements du slider de date
dateSlider.addEventListener("input", function () {
    updateVectors(this.value, periodSlider.value);
});

// Gérer les événements du slider de période
periodSlider.addEventListener("input", function () {
    updateVectors(dateSlider.value, this.value);
});

// Charger les données au démarrage
loadGNSSData();