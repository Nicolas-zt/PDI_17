<?php


// Chemin des fichiers GNSS
$folderPath = "../Fichiers_stations/";
$files = glob($folderPath . "*.txt");

// Position du Piton de la Fournaise (Réunion)
$volcanoLat = -21.2449;
$volcanoLon = 55.7089;
$radius = 0.1; // Rayon des stations autour du volcan (~10 km)

// Répartir les stations en cercle 
$stationPositions = [];
$numStations = count($files);
$angleStep = 360 / max($numStations, 1);

$results = [];

foreach ($files as $index => $file) {
    $fileName = basename($file);

    // Calcul de la position en cercle autour du volcan pour les satitons GNSS a modifier plus tard
    $angle = deg2rad($index * $angleStep);
    $latOffset = $radius * cos($angle);
    $lonOffset = $radius * sin($angle);

    $stationPositions[$fileName] = [
        "lat" => $volcanoLat + $latOffset,
        "lon" => $volcanoLon + $lonOffset
    ];

    $fileContent = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    
    foreach ($fileContent as $line) {
        if (strpos($line, "#") === 0) continue; // Ignorer les commentaires
        
        $values = preg_split('/\s+/', trim($line));
        if (count($values) <18) continue;

        list($year, $month, $day, $hour, $minute, $second,
            $dE_1, $dN_1, $dU_1, $s_dE_1, $s_dN_1, $s_dU_1,
            $dE_2, $dN_2, $dU_2, $s_dE_2, $s_dN_2, $s_dU_2) = $values;

        $date = sprintf("%04d-%02d-%02d", $year, $month, $day);

        if (!isset($results[$date])) {
            $results[$date] = [];
        }

        $results[$date][$fileName] = [
            "vector_1" => [(float)$dE_1, (float)$dN_1, (float)$dU_1],
            "error_1" => [(float)$s_dE_1, (float)$s_dN_1, (float)$s_dU_1],
            "vector_2" => [(float)$dE_2, (float)$dN_2, (float)$dU_2],
            "error_2" => [(float)$s_dE_2, (float)$s_dN_2, (float)$s_dU_2],
            "position" => $stationPositions[$fileName]
        ];
    }
}

echo json_encode($results);
?>



