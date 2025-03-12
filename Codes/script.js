// Initialisation de la première carte (vecteurs horizontaux)
let map = L.map('map').setView([-21.2449, 55.7089], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let vectorLayer = L.layerGroup().addTo(map);
let errorLayer = L.layerGroup().addTo(map);
let stationMarkers = L.layerGroup().addTo(map);

// Initialisation de la deuxième carte (vecteurs verticaux)
let verticalMap = L.map('verticalMap').setView([-21.2449, 55.7089], 11);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(verticalMap);

let verticalVectorLayer = L.layerGroup().addTo(verticalMap);
let verticalStationMarkers = L.layerGroup().addTo(verticalMap);

let dateSlider = document.getElementById("dateSlider");
let selectedDateDisplay = document.getElementById("selectedDate");
let periodRadios = document.querySelectorAll("input[name='period']");

let gnssData = [];
let dates = [];
let selectedPeriod = "90"; // Période par défaut

// Charger les données GNSS depuis process.php
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
                updateVerticalVectors(0);
            }
        });
}

// Mettre à jour les vecteurs horizontaux
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
        // Selon la période choisie, on sélectionne le vecteur 1 ou 2
        let [dE, dN, dU] = (selectedPeriod === "90") ? stationData.vector_1.map(Number) : stationData.vector_2.map(Number);
        let [s_dE, s_dN, s_dU] = (selectedPeriod === "90") ? stationData.error_1.map(Number) : stationData.error_2.map(Number);

        let startPoint = [position.lat, position.lon];
        // Pour les vecteurs horizontaux, on modifie latitude (dN) et longitude (dE)
        let endPoint = [startPoint[0] + dN / 1000, startPoint[1] + dE / 1000];

        // Afficher le vecteur horizontal en rouge
        L.polyline([startPoint, endPoint], { color: "red" }).addTo(vectorLayer);

        // Afficher le cercle d'erreur autour du point final
        let errorRadius = Math.sqrt(s_dE ** 2 + s_dN ** 2);
        L.circle(endPoint, {
            radius: errorRadius,
            color: "blue",
            fillOpacity: 0.3
        }).addTo(errorLayer);

        // Ajouter un marqueur pour la station
        L.marker(startPoint).addTo(stationMarkers).bindPopup(`<b>Station:</b> ${station}`);
    }
}

// Mettre à jour les vecteurs verticaux
function updateVerticalVectors(index) {
    let selectedDate = dates[index];
    let stationsData = gnssData[selectedDate];
    verticalVectorLayer.clearLayers();
    verticalStationMarkers.clearLayers();

    for (let station in stationsData) {
        let stationData = stationsData[station];
        let position = stationData.position;
        // Récupération de la composante verticale (dU)
        let dU = (selectedPeriod === "90") ? stationData.vector_1[2] : stationData.vector_2[2];

        let startPoint = [position.lat, position.lon];
        // Utiliser un facteur de conversion pour rendre visible le vecteur vertical
        let verticalScale = 1 / 1000;
        // Le vecteur vertical est représenté en modifiant la latitude :
        // si dU positif → vers le nord (haut de la carte), sinon vers le sud
        let endPoint = [startPoint[0] + dU * verticalScale, startPoint[1]];

        // Afficher le vecteur vertical en vert
        L.polyline([startPoint, endPoint], { color: "green" }).addTo(verticalVectorLayer);
        // Ajouter un marqueur pour la station
        L.marker(startPoint).addTo(verticalStationMarkers).bindPopup(`<b>Station:</b> ${station}`);
    }
}

// Gérer les événements du slider
dateSlider.addEventListener("input", function () {
    updateVectors(this.value);
    updateVerticalVectors(this.value);
});

// Gérer le changement de période
periodRadios.forEach(radio => {
    radio.addEventListener("change", function () {
        selectedPeriod = this.value;
        updateVectors(dateSlider.value);
        updateVerticalVectors(dateSlider.value);
    });
});

// Charger les données au démarrage
loadGNSSData();
