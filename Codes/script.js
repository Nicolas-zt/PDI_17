// 📌 Initialisation des cartes
let map = L.map('map');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let vectorLayer = L.layerGroup().addTo(map);
let errorLayer = L.layerGroup().addTo(map);
let stationMarkers = L.layerGroup().addTo(map);
let verticalVectorLayer = L.layerGroup().addTo(map);
let verticalErrorLayer = L.layerGroup().addTo(map); // Nouveau calque pour l'erreur verticale

// 📌 Définition de l'icône personnalisée en forme de carré noir et plus petit
let squareIcon = L.divIcon({
    className: 'custom-square-icon',
    iconSize: [8, 8],
    html: '<div style="width:8px; height:8px; background:#000; border:1px solid #000;"></div>'
});

// 📌 Gestion des sliders
let dateSlider = document.getElementById("dateSlider");
let periodSlider = document.getElementById("periodSlider");
let selectedDateDisplay = document.getElementById("selectedDate");
let selectedPeriodLabel = document.getElementById("selectedPeriodLabel");
let dateLabel = document.getElementById('dateLabel');

let gnssData = [];
let dates = [];
let availablePeriods = [];
let stationsInfo = [];

// 📌 Chargement des données GNSS
function loadGNSSData() {
    fetch("process.php")
        .then(response => response.json())
        .then(data => {
            let proc = data.proc;
            document.getElementById("PageTitle").textContent = proc;
            document.getElementById("procTitle").textContent = proc;
            gnssData = data.data;
            stationsInfo = data.stations;
            dates = Object.keys(gnssData).sort();
            availablePeriods = Object.values(data.periods);

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
            adjustMapView();
        });
}

function metersToLatLon(lat, lon, deltaE, deltaN) {
    const earthRadius = 6371000; // Rayon de la Terre en mètres
    const deltaLat = deltaN / earthRadius * (180 / Math.PI); // Conversion des mètres à des degrés de latitude
    const deltaLon = deltaE / (earthRadius * Math.cos(Math.PI * lat / 180)) * (180 / Math.PI); // Conversion des mètres à des degrés de longitude

    return {
        lat: lat + deltaLat,
        lon: lon + deltaLon
    };
}
function adjustMapView() {
    // Créer un objet LatLngBounds pour ajuster la vue à toutes les stations
    let bounds = L.latLngBounds();

    // Ajouter les coordonnées de chaque station aux limites
    for (let stationFileName in stationsInfo) {
        let stationInfo = stationsInfo[stationFileName];
        let position = [stationInfo.latitude, stationInfo.longitude];
        bounds.extend(position);
    }

    // Ajuster la vue de la carte pour englober toutes les stations
    map.fitBounds(bounds);
}

// 📌 Mettre à jour les vecteurs
function updateVectors(dateIndex, periodIndex) {
    let selectedDate = dates[dateIndex];
    let selectedPeriod = availablePeriods[periodIndex];
    const dateLabel = document.getElementById('dateLabel');
    // Convertir selectedDate en objet Date
    const endDate = new Date(selectedDate);

    // Calculer la date de début en soustrayant selectedPeriod jours
    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - Number(selectedPeriod));

    // Mettre à jour l'affichage
    dateLabel.textContent = `Start Date : ${startDate.toISOString().split('T')[0]} - End Date : ${selectedDate}`;
    selectedPeriodLabel.textContent = `${selectedPeriod} Days`;

    let stationsData = gnssData[selectedDate];

    vectorLayer.clearLayers();
    errorLayer.clearLayers();
    stationMarkers.clearLayers();
    verticalVectorLayer.clearLayers();


    for (let stationFileName in stationsData) {
        let stationData = stationsData[stationFileName];
        let stationInfo = stationsInfo[stationFileName]; // Récupérer les infos de la station depuis stationsInfo

        if (!stationInfo) continue; // Si aucune info de station n'est trouvée, passer à la suivante

        let position = {
            lat: stationInfo.latitude,
            lon: stationInfo.longitude
        };

        let { vector, error } = stationData.vectors[selectedPeriod] || {};

        if (!vector) continue;

        let startPoint = [position.lat, position.lon];
        let endPoint = metersToLatLon(startPoint[0], startPoint[1], vector[0], vector[1]);

        // 🔴 Ajouter le vecteur horizontal
        L.polyline([startPoint, endPoint], { color: "red" }).addTo(vectorLayer).arrowheads();

        // 🔵 Ajouter une ellipse d'erreur pour la composante horizontale
        let errorRadiusX = Math.sqrt(error[0] ** 2); // Rayon de l'ellipse sur l'axe X
        let errorRadiusY = Math.sqrt(error[1] ** 2); // Rayon de l'ellipse sur l'axe Y
        
        L.ellipse(endPoint, [errorRadiusX, errorRadiusY], 0, { // 0° pour l'angle par défaut
            color: "red",
            fillOpacity: 0.3,
            stroke: false,
        }).addTo(errorLayer);

        // ✅ Ajouter le vecteur vertical
        let verticalEndPoint = metersToLatLon(startPoint[0], startPoint[1], 0, vector[2]);
        L.polyline([startPoint, verticalEndPoint], { color: "green" }).addTo(verticalVectorLayer).arrowheads();

      
        // 🔵 Ajouter un cercle d'erreur pour la composante verticale
        L.circle(verticalEndPoint, {
            radius: error[2], // Le rayon correspond à l'erreur verticale (en mètres)
            color: "green",
            fillOpacity: 0.3,
            stroke: false,
        }).addTo(verticalErrorLayer);

        // Ajouter le marqueur de la station
        L.circleMarker(startPoint, { radius: 4, color: "black" , fillOpacity: 0})
            .addTo(stationMarkers)
            .bindPopup(`
                <b>Station:</b> ${stationInfo.name}<br>
                <b>Code:</b> ${stationInfo.code}<br>
                <b>URL:</b> <a href="${stationInfo.url}" target="_blank">${stationInfo.url}</a>
            `);
    }
}

let toggleHorizontalButton = document.getElementById("toggleHorizontal");
toggleHorizontalButton.addEventListener("click", function(){
    if (map.hasLayer(vectorLayer)) {
      map.removeLayer(vectorLayer);
      map.removeLayer(errorLayer);
      toggleHorizontalButton.textContent = "Show horizontal vectors";
    } else {
      map.addLayer(vectorLayer);
      map.addLayer(stationMarkers);
      map.addLayer(errorLayer);
      toggleHorizontalButton.textContent = "Hide horizontal vectors";
    }
});

let toggleVerticalButton = document.getElementById("toggleVertical");
toggleVerticalButton.addEventListener("click", function(){
    if (map.hasLayer(verticalVectorLayer)) {
        map.removeLayer(verticalVectorLayer);
        map.removeLayer(verticalErrorLayer); // Masquer également l'erreur verticale
        toggleVerticalButton.textContent = "Show vertical vectors";
    } else {
        map.addLayer(verticalVectorLayer);
        map.addLayer(verticalErrorLayer); // Afficher également l'erreur verticale
        map.addLayer(stationMarkers);
        toggleVerticalButton.textContent = "Hide vertical vectors";
    }
});

// 📌 Gestion des sliders
dateSlider.addEventListener("input", function () {
    updateVectors(this.value, periodSlider.value);
});

periodSlider.addEventListener("input", function () {
    updateVectors(dateSlider.value, this.value);
});

// 📌 Charger les données au démarrage
loadGNSSData();
