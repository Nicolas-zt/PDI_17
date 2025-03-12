<?php

// Chemin des fichiers GNSS
$folderPath = "../Fichiers_stations/";
$files = glob($folderPath . "*.txt");

// Position du Piton de la Fournaise (Réunion)
$volcanoLat = -21.2449;
$volcanoLon = 55.7089;
$radius = 0.1; // Rayon des stations autour du volcan (~10 km)

// Répartition des stations en cercle
$stationPositions = [];
$numStations = count($files);
$angleStep = 360 / max($numStations, 1);

// Stockage des données
$results = [];
$periods = [];  // Stocker dynamiquement les périodes disponibles

foreach ($files as $index => $file) {
    $fileName = basename($file);

    // Calcul de la position en cercle autour du volcan
    $angle = deg2rad($index * $angleStep);
    $latOffset = $radius * cos($angle);
    $lonOffset = $radius * sin($angle);

    $stationPositions[$fileName] = [
        "lat" => $volcanoLat + $latOffset,
        "lon" => $volcanoLon + $lonOffset
    ];

    $fileContent = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    // Lire les périodes depuis l’en-tête
    foreach ($fileContent as $line) {
        if (strpos($line, "Time period") !== false) {
            preg_match('/#\s+Time period #(\d+) = (\d+) days/', $line, $matches);
            if ($matches) {
                $periods[$matches[1]] = $matches[2]; // Ex: $periods["1"] = "90"
            }
        }
        if (strpos($line, "yyyy mm dd") !== false) {
            $columnNames = preg_split('/\s+/', trim($line));
            break; // Fin de l’en-tête
        }
    }

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
        foreach ($periods as $periodKey => $days) {
            $indexOffset = 6 + ($periodKey - 1) * 6;
            $vectors[$days] = [
                "vector" => array_map('floatval', array_slice($values, $indexOffset, 3)),
                "error"  => array_map('floatval', array_slice($values, $indexOffset + 3, 3))
            ];
        }

        $results[$date][$fileName] = [
            "vectors" => $vectors,
            "position" => $stationPositions[$fileName]
        ];
    }
}

// Retourner les périodes disponibles et les résultats
echo json_encode(["periods" => $periods, "data" => $results]);

?>
