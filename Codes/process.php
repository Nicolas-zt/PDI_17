<?php
// Path to the GNSS files
$folderPath = "../files_stations/";

// Get all .txt files from the folder
$files = glob($folderPath . "*.txt");

// Data storage arrays
$results = [];
$stationInfo = []; // Store station information
$periods = []; 
$proc = "";    // Store processing 

// Iterate over each file
foreach ($files as $file) {
    $fileName = basename($file);  // Get the base name of the file
    $fileContent = file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES); // Read file content, ignore empty lines
    if (!is_dir($folderPath)) {
        die("The specified folder does not exist.");
    }
    
    if (empty($files)) {
        die("No files found in the folder.");
    }

    // Variables to store header information
    $nodeCode = $nodeName = $nodeUrl = null;
    $nodeLat = $nodeLon = $nodeElevation = null;

    // Read the file's header section
    foreach ($fileContent as $line) {
        if (strpos($line, "PROC:") !== false) {
            // Extract the processing information (PROC)
            $proc = trim(explode(":", $line, 2)[1]);
            $proc = str_replace(['{', '}'], '', $proc);  // Clean up the PROC value
        } elseif (strpos($line, "NODE_FID:") !== false) {
            $nodeCode = trim(explode(":", $line, 2)[1]);  // Extract the node code
        } elseif (strpos($line, "NODE_NAME:") !== false) {
            $nodeName = trim(explode(":", $line, 2)[1], ' "');  // Extract node name
        } elseif (strpos($line, "NODE_LATITUDE:") !== false) {
            $nodeLat = floatval(trim(explode(":", $line, 2)[1]));  // Extract latitude
        } elseif (strpos($line, "NODE_LONGITUDE:") !== false) {
            $nodeLon = floatval(trim(explode(":", $line, 2)[1]));  // Extract longitude
        } elseif (strpos($line, "NODE_ELEVATION:") !== false) {
            $nodeElevation = floatval(trim(explode(":", $line, 2)[1]));  // Extract elevation
        } elseif (strpos($line, "NODE_URL:") !== false) {
            $nodeUrl = trim(explode(":", $line, 2)[1]);  // Extract node URL
        } elseif (strpos($line, "TIME_PERIODS:") !== false) {
            // Extract time periods and store them as an array of integers
            $periods = array_map('intval', explode(',', trim(explode(":", $line, 2)[1])));
        } elseif (strpos($line, "yyyy mm dd") !== false) {
            // Column names for the GNSS data
            $columnNames = preg_split('/\s+/', trim($line));  // Split the date column names
            break; // End of header processing
        }
    }

    // Store station information
    $stationInfo[$fileName] = [
        "code" => $nodeCode,
        "name" => $nodeName,
        "latitude" => $nodeLat,
        "longitude" => $nodeLon,
        "elevation" => $nodeElevation,
        "url" => $nodeUrl
    ];

    // Process GNSS data lines
    foreach ($fileContent as $line) {
        // Skip comment lines
        if (strpos($line, "#") === 0) continue;

        // Split the line into individual values
        $values = preg_split('/\s+/', trim($line));
        if (count($values) < count($columnNames)) continue;  // Ensure the line has all expected values

        // Extract year, month, day, hour, minute, second for the date
        list($year, $month, $day, $hour, $minute, $second) = array_slice($values, 0, 6);
        // Format the date as YYYY-MM-DD
        $date = sprintf("%04d-%02d-%02d", $year, $month, $day);

        // Initialize the date in the results array if not already present
        if (!isset($results[$date])) {
            $results[$date] = [];
        }

        // Store vectors and errors for each period
        $vectors = [];
        foreach ($periods as $index => $days) {
            $indexOffset = 6 + $index * 6;  // Calculate the offset for each period's data
            $vectors[$days] = [
                "vector" => array_map('floatval', array_slice($values, $indexOffset, 3)), // Extract vector values
                "error"  => array_map('floatval', array_slice($values, $indexOffset + 3, 3))  // Extract error values
            ];
        }

        // Store the vectors and the station position for the current date
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

// Return the JSON response containing station info, periods, and data
echo json_encode([
    "proc" => $proc,
    "stations" => $stationInfo,
    "periods" => $periods,
    "data" => $results
]);
?>
