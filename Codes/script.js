// 📌 Initialisation des cartes
let map = L.map('map');

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.control.scale({imperial : false}).addTo(map)

let vectorLayer = L.layerGroup().addTo(map);
let errorLayer = L.layerGroup().addTo(map);
let stationMarkers = L.layerGroup().addTo(map);

let scaleLayer = L.layerGroup().addTo(map);

let verticalVectorLayer = L.layerGroup().addTo(map);
let verticalErrorLayer = L.layerGroup().addTo(map); // Nouveau calque pour l'erreur verticale


// 📌 Gestion des sliders
let dateSlider = document.getElementById("dateSlider");
let periodSlider = document.getElementById("periodSlider");
let scaleSlider = document.getElementById("scaleSlider");
let selectedDateDisplay = document.getElementById("selectedDate");
let selectedPeriodLabel = document.getElementById("selectedPeriodLabel");
let selectedScale = document.getElementById("selectedScale");
let dateLabel = document.getElementById('dateLabel');


let gnssData = [];
let dates = [];
let availablePeriods = [];
let echelles = [];
let stationsInfo = [];

let CustomScaleControl = null;
let CustomScale = null;


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
                map.whenReady(() => {
                    updateVectors(0, 0);
                });
            }

            adjustMapView();
        });
}

// 📌 Mise à jour de l'échelle
function getVectorLengthInPixels(startPoint, endPoint) {
    let pixelStart = map.latLngToContainerPoint(startPoint);
    let pixelEnd = map.latLngToContainerPoint(endPoint);
    return pixelStart.distanceTo(pixelEnd);
}

function getRealVectorLength(startPoint, endPoint) {
    return map.distance(startPoint, endPoint);
}

function updateScaleFromVector(vectorStart, vectorEnd,vectorEndReal) {
    if (!vectorStart || !vectorEnd) {
        if (CustomScaleControl) {
            map.removeControl(CustomScaleControl);
            CustomScaleControl = null;
        }
        selectedScale.textContent = ""; // Masquer le texte de l'échelle
        return;
    }

    let vectorLengthPixels = getVectorLengthInPixels(vectorStart, vectorEnd);
    let vectorLengthMeters = getRealVectorLength(vectorStart, vectorEndReal);
    if (vectorLengthMeters === 0) return;

    let scaleInMM = (100 / vectorLengthPixels) * vectorLengthMeters * 1000;
    selectedScale.textContent = `Vectors : ${scaleInMM.toFixed(2)} mm`;

    if (CustomScaleControl) map.removeControl(CustomScaleControl);

    // Création d'un Control leaflet pour en faire une echelle différente de celle de la carte
    let CustomScale = L.Control.extend({
        onAdd: function () {
            let div = L.DomUtil.create('div', 'custom-scale');
            div.innerHTML = `<strong>Vectors : <span id="scaleValue">${scaleInMM.toFixed(2)}</span> mm</strong>`; // Valeur en mm représenté par la barre d'échelle
            let scaleLine = L.DomUtil.create('div', 'scale-line'); // Création de la div HTML pour l'échelle des vecteurs
            scaleLine.style.width = '100px'; // Taille de la barre d'échelle des vecteurs
            div.appendChild(scaleLine); // Ajout de l'échelle dans la div
            return div;
        }
    });

    // Instanciation du Control créé précédemment et ajout à la carte
    CustomScaleControl = new CustomScale({ position: 'bottomleft' });
    map.addControl(CustomScaleControl);
}


function metersToLatLon(lat, lon, deltaE, deltaN) {
    const earthRadius = 6371000; // Rayon de la Terre en mètres
    const deltaLat = (deltaN) / earthRadius * (180 / Math.PI); // Conversion des mètres à des degrés de latitude
    const deltaLon = (deltaE) / (earthRadius * Math.cos(Math.PI * lat / 180)) * (180 / Math.PI); // Conversion des mètres à des degrés de longitude

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

    // Suppression des vecteurs/ellipses d'erreurs avant d'ajouter les versions actualisées
    vectorLayer.clearLayers();
    errorLayer.clearLayers();
    verticalErrorLayer.clearLayers();
    stationMarkers.clearLayers();
    verticalVectorLayer.clearLayers();

    let firstVectorStart = null;
    let firstVectorEnd = null;
    let firstVectorEndReal = null;

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
        let endPoint = metersToLatLon(startPoint[0], startPoint[1], vector[0]*1000*scaleSlider.value*10000, vector[1]*1000*scaleSlider.value*10000);

        if (!firstVectorStart) {
            firstVectorStart = startPoint;
            firstVectorEndReal = metersToLatLon(startPoint[0], startPoint[1], vector[0], vector[1]);
            firstVectorEnd = endPoint;
        }
    
        // 🔴 Ajouter le vecteur horizontal
        L.polyline([startPoint, endPoint], { color: "red" }).addTo(vectorLayer).arrowheads();

        // 🔵 Ajouter une ellipse d'erreur pour la composante horizontale
        let errorRadiusX = Math.sqrt(error[0] ** 2); // Rayon de l'ellipse sur l'axe X
        let errorRadiusY = Math.sqrt(error[1] ** 2); // Rayon de l'ellipse sur l'axe Y
        
        L.ellipse(endPoint, [errorRadiusX/1000*scaleSlider.value*10000, errorRadiusY/1000*scaleSlider.value*10000], 0, { // 0° pour l'angle par défaut
            color: "red",
            fillOpacity: 0.3,
            stroke: false,
        }).addTo(errorLayer);

        // ✅ Ajouter le vecteur vertical
        let verticalEndPoint = metersToLatLon(startPoint[0], startPoint[1], 0, vector[2]*1000*scaleSlider.value*10000);
        L.polyline([startPoint, verticalEndPoint], { color: "green" }).addTo(verticalVectorLayer).arrowheads();


        // 🔵 Ajouter un cercle d'erreur pour la composante verticale
        L.circle(verticalEndPoint, {
            radius: error[2]/1000*scaleSlider.value*10000, // Le rayon correspond à l'erreur verticale (en mètres)
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
    // Mise à jour de l'échelle
    if (firstVectorStart && firstVectorEnd) {
        updateScaleFromVector(firstVectorStart, firstVectorEnd, firstVectorEndReal);
    } else {
        updateScaleFromVector(null, null,null); // Masquer l'échelle si aucun vecteur
    }
}

// Ajout d'un bouton pour Montrer/Cacher les vecteurs horizontaux
// Par défaut 
let toggleHorizontalButton = document.getElementById("toggleHorizontal");
toggleHorizontalButton.addEventListener("click", function(){
    if (map.hasLayer(vectorLayer)) { // Si la carte contient des vecteurs horizontaux, on les retire
      map.removeLayer(vectorLayer);
      map.removeLayer(errorLayer);   // Masquer également l'erreur horizontale
      toggleHorizontalButton.textContent = "Show horizontal vectors";
    } else {                         // Si la carte ne contient pas de vecteurs horizontaux, on les ajoute
      map.addLayer(vectorLayer);
      map.addLayer(stationMarkers);
      map.addLayer(errorLayer);     // Afficher également l'erreur horizontale
      toggleHorizontalButton.textContent = "Hide horizontal vectors";
    }
});

// Ajout d'un bouton pour Montrer/Cacher les vecteurs verticaux
let toggleVerticalButton = document.getElementById("toggleVertical");
toggleVerticalButton.addEventListener("click", function(){
    if (map.hasLayer(verticalVectorLayer)) { // Si la carte contient des vecteurs verticaux, on les retire
        map.removeLayer(verticalVectorLayer);
        map.removeLayer(verticalErrorLayer); // Masquer également l'erreur verticale
        toggleVerticalButton.textContent = "Show vertical vectors";
    } else {                                 // Si la carte ne contient pas de vecteurs verticaux, on les ajoute
        map.addLayer(verticalVectorLayer);
        map.addLayer(verticalErrorLayer);    // Afficher également l'erreur verticale
    }
});
        // 📌 Gestion des sliders
dateSlider.addEventListener("input", function () {      // Sélection date de fin
    updateVectors(this.value, periodSlider.value);
});

periodSlider.addEventListener("input", function () {    // Sélection Fenêtre de temps
    updateVectors(dateSlider.value, this.value);
});

scaleSlider.addEventListener("input", function () {     // Sélection échelle
   
    updateVectors(dateSlider.value,periodSlider.value);
});

// 📌 Mettre à jour quand on zoome sur la carte
map.on('zoomend', function () {
    updateVectors(dateSlider.value,periodSlider.value);
  
});


// 📌 Charger les données au démarrage
loadGNSSData();
