// 📌 Initialisation des cartes
let map = L.map('map').setView([-21.2449, 55.7089], 11);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

L.control.scale({imperial : false}).addTo(map)




let vectorLayer = L.layerGroup().addTo(map);
let errorLayer = L.layerGroup().addTo(map);
let stationMarkers = L.layerGroup().addTo(map);

let scaleLayer = L.layerGroup().addTo(map);

let verticalVectorLayer = L.layerGroup().addTo(map);
let verticalStationMarkers = L.layerGroup().addTo(map);

// 📌 Définition de l'icône personnalisée en forme de carré noir et plus petit
let squareIcon = L.divIcon({
    className: 'custom-square-icon',
    iconSize: [8, 8],
    html: '<div style="width:8px; height:8px; background:#000; border:1px solid #000;"></div>'
});

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


// 📌 Chargement des données GNSS
function loadGNSSData() {
    fetch("process.php")
        .then(response => response.json())
        .then(data => {
            gnssData = data.data;
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
        });
}

// 📌 Gestion de l'echelle

scaleSlider.min = 1 
scaleSlider.max = 15
scaleSlider.value = 1

function getScaleLength(zoomLevel,baseLength) {
    // Exemple : 1 km à zoom = 13, ajustez les facteurs selon vos besoins
    //var baseLength = 100; longueur de base du segment en pixels (1 km)
    var zoomFactor = Math.pow(2, 13 - zoomLevel); // Factorisation basée sur le zoom (plus le zoom est grand, plus le segment est court)
    return baseLength / zoomFactor;
  }

var CustomScale = L.Control.extend({
    onAdd: function(map) {
      let div = L.DomUtil.create('div', 'custom-scale');
      let scaleLength = getScaleLength(map.getZoom(),scaleSlider.value*6);
      div.innerHTML = "<strong>Size of 10 millimeter :</strong> ";


      let scaleLine = L.DomUtil.create('div', 'scale-line');
        scaleLine.style.width = scaleLength*10 + 'px'; // La largeur du segment est définie par la fonction getScaleLength
        div.style.width = (scaleLength*10+20) + 'px';
        
        div.appendChild(scaleLine); // Ajouter la ligne au contrôle

        // Écouter les changements de zoom pour mettre à jour l'échelle
        map.on('zoomend', function() {
          let scaleLength = getScaleLength(map.getZoom(),scaleSlider.value*6);
          scaleLine.style.width = scaleLength*10 + 'px'; // Mettre à jour la longueur du segment
          div.style.width = (scaleLength*10+20) + 'px';
          console.log(map.getZoom());
        });


      return div;
    },

    onRemove: function (map) {

    }
  });


  // Ajout du contrôle personnalisé à la carte
    let CustomScaleControl = new CustomScale({ position: 'bottomleft' })
    map.addControl(CustomScaleControl);


// 📌 Mettre à jour l'echelle
function updateScale(scale) {

    map.removeControl(CustomScaleControl);
    

    selectedScale.textContent = `${'1 : '+scale+'00000'}`;

    // création d'un control 
    CustomScale = L.Control.extend({
        onAdd: function(map) {
        let div = L.DomUtil.create('div', 'custom-scale');
        let scaleLength = getScaleLength(map.getZoom(),scale*6);
        div.innerHTML = "<strong>Size of 10 millimeter :</strong> ";
    
    
        let scaleLine = L.DomUtil.create('div', 'scale-line');
        scaleLine.style.width = scaleLength*10 + 'px'; // La largeur du segment est définie par la fonction getScaleLength
        div.style.width = (scaleLength*10+20) + 'px';
        
        div.appendChild(scaleLine); // Ajouter la ligne au contrôle

        // Écouter les changements de zoom pour mettre à jour l'échelle
        map.on('zoomend', function() {
            let scaleLength = getScaleLength(map.getZoom(),scale*6);
            scaleLine.style.width = scaleLength*10 + 'px'; // Mettre à jour la longueur du segment
            div.style.width = (scaleLength*10+20) + 'px';
            console.log(map.getZoom());
        });
    
    
        return div;
        }
      });
     
      //Instanciation du control créé précédemment
      CustomScaleControl = new CustomScale({ position: 'bottomleft' })

      map.addControl(CustomScaleControl);

      
}

function metersToLatLon(lat, lon, deltaE, deltaN) {
    const earthRadius = 6371000; // Rayon de la Terre en mètres
    const deltaLat = (deltaN/1000) / earthRadius * (180 / Math.PI); // Conversion des mètres à des degrés de latitude
    const deltaLon = (deltaE/1000) / (earthRadius * Math.cos(Math.PI * lat / 180)) * (180 / Math.PI); // Conversion des mètres à des degrés de longitude

    return {
        lat: lat + deltaLat*1000*scaleSlider.value*100,
        lon: lon + deltaLon*1000*scaleSlider.value*100
    };
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
    dateLabel.textContent = `Date de début : ${startDate.toISOString().split('T')[0]} - Date de fin : ${selectedDate}`;
    selectedPeriodLabel.textContent = `${selectedPeriod} jours`;

    let stationsData = gnssData[selectedDate];

    vectorLayer.clearLayers();
    errorLayer.clearLayers();
    stationMarkers.clearLayers();
    verticalVectorLayer.clearLayers();
    verticalStationMarkers.clearLayers();

    for (let station in stationsData) {
        let stationData = stationsData[station];
        let position = stationData.position;
        let { vector, error } = stationData.vectors[selectedPeriod] || {};

        if (!vector) continue;

        let startPoint = [position.lat, position.lon];
        let endPoint = metersToLatLon(startPoint[0], startPoint[1], vector[0], vector[1]);


        // 🔴 Ajouter le vecteur horizontal

        L.polyline([startPoint, endPoint], { color: "red" }).addTo(vectorLayer).arrowheads();



  
        // 🔵 Ajouter une ellipse d'erreur
        let errorRadiusX = Math.sqrt(error[0] ** 2); // Rayon de l'ellipse sur l'axe X
        let errorRadiusY = Math.sqrt(error[1] ** 2); // Rayon de l'ellipse sur l'axe Y
        
        L.ellipse(endPoint, [errorRadiusX, errorRadiusY], 0, { // 0° pour l'angle par défaut
            color: "blue",
            fillOpacity: 0.3
        }).addTo(errorLayer);


        // ✅ Ajouter le vecteur vertical
        let verticalEndPoint = metersToLatLon(startPoint[0], startPoint[1], 0, vector[2]);
        L.polyline([startPoint, verticalEndPoint], { color: "green" }).addTo(verticalVectorLayer).arrowheads();

        L.marker(startPoint, { icon: squareIcon })
            .addTo(stationMarkers)
            .bindPopup(`<b>Station:</b> ${station}`);

        L.marker(startPoint, { icon: squareIcon })
            .addTo(verticalStationMarkers)
            .bindPopup(`<b>Station:</b> ${station}`);
    }
}








// 📌 Gestion des sliders
dateSlider.addEventListener("input", function () {
    updateVectors(this.value, periodSlider.value);
});

periodSlider.addEventListener("input", function () {
    updateVectors(dateSlider.value, this.value);
});

scaleSlider.addEventListener("input", function () {
   
    updateScale(this.value);
    updateVectors(dateSlider.value,periodSlider.value);
});

// 📌 Charger les données au démarrage
loadGNSSData();
