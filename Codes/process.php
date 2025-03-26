<?php
// Chemin des fichiers GNSS
$folderPath = "../Fichiers_stations/";
$files = glob($folderPath . "*.txt");

// Stockage des données
$results = [];
$stationInfo = []; // Informations des stations
$periods = []; 
$proc = "";    // Stocker dynamiquement les périodes disponibles

foreach ($files as $file) {
    $fileName = basename($file);
    $fileContent = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_dir($folderPath)) {
        die("Le dossier spécifié n'existe pas.");
    }
    
    if (empty($files)) {
        die("Aucun fichier trouvé dans le dossier.");
    }

    // Variables pour stocker les informations de l'en-tête
    $nodeCode = $nodeName = $nodeUrl = null;
    $nodeLat = $nodeLon = $nodeElevation = null;

    // Lire l'en-tête
    foreach ($fileContent as $line) {
        if (strpos($line, "PROC:") !== false) {
            $proc = trim(explode(":", $line, 2)[1]);
            $proc = str_replace(['{', '}'], '', $proc);  // Extraire PROC
        } elseif (strpos($line, "NODE_FID:") !== false) {
            $nodeCode = trim(explode(":", $line, 2)[1]);
        } elseif (strpos($line, "NODE_NAME:") !== false) {
            $nodeName = trim(explode(":", $line, 2)[1], ' "');
        } elseif (strpos($line, "NODE_LATITUDE:") !== false) {
            $nodeLat = floatval(trim(explode(":", $line, 2)[1]));
        } elseif (strpos($line, "NODE_LONGITUDE:") !== false) {
            $nodeLon = floatval(trim(explode(":", $line, 2)[1]));
        } elseif (strpos($line, "NODE_ELEVATION:") !== false) {
            $nodeElevation = floatval(trim(explode(":", $line, 2)[1]));
        } elseif (strpos($line, "NODE_URL:") !== false) {
            $nodeUrl = trim(explode(":", $line, 2)[1]);
        } elseif (strpos($line, "TIME_PERIODS:") !== false) {
            $periods = array_map('intval', explode(',', trim(explode(":", $line, 2)[1])));
        } elseif (strpos($line, "yyyy mm dd") !== false) {
            $columnNames = preg_split('/\s+/', trim($line));
            break; // Fin de l'en-tête
        }
    }

    // Stocker les informations de la station
    $stationInfo[$fileName] = [
        "code" => $nodeCode,
        "name" => $nodeName,
        "latitude" => $nodeLat,
        "longitude" => $nodeLon,
        "elevation" => $nodeElevation,
        "url" => $nodeUrl
    ];

    // Lire les données GNSS
    foreach ($fileContent as $line) {
        if (strpos($line, "#") === 0) continue; // Ignorer les commentaires

        $values = preg_split('/\s+/', trim($line));
        if (count($values) < count($columnNames)) continue;

        list($year, $month, $day, $hour, $minute, $second) = array_slice($values, 0, 6);
        $date = sprintf("%04d-%02d-%02d", $year, $month, $day);

        if (!isset($results[$date])) {
            $results[$date] = [];
        }

        $vectors = [];
        foreach ($periods as $index => $days) {
            $indexOffset = 6 + $index * 6;
            $vectors[$days] = [
                "vector" => array_map('floatval', array_slice($values, $indexOffset, 3)),
                "error"  => array_map('floatval', array_slice($values, $indexOffset + 3, 3))
            ];
        }

        $results[$date][$fileName] = [
            "vectors" => $vectors,
            "position" => [
                "lat" => $nodeLat,
                "lon" => $nodeLon,
                "elevation" => $nodeElevation
            ]
        ];
    }
}

// Retourner les informations des stations, les périodes disponibles et les résultats
echo json_encode([
    "proc" => $proc,
    "stations" => $stationInfo,
    "periods" => $periods,
    "data" => $results
]);
?>