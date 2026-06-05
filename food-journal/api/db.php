<?php

// Shared database helper functions used by all API endpoints.

require_once 'db-config.php';

/**
 * Create or reuse a PDO database connection for the current request.
 */
function get_db_connection() {
    global $db_host, $db_name, $db_user, $db_pass;

    //Create a PDO (PHP Data Object) - This object represents an active connection to the database.
    //Static variables persist between function calls during the current PHP request.
    // aka - not recreated every time the function runs.
    static $pdo = null;

    //So if there is already a connection and info, then exit early
    if ($pdo !== null) {
        return $pdo;
    }
    //If not, then we will try to connect

    // dsn - Data Source Name
    // Describes how PDO should connect to the database.
    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";

    try {
        $pdo = new PDO(
            $dsn,
            $db_user,
            $db_pass,
            [
                // Configure PDO behavior:
                // - Throw exceptions when database errors occur.
                // - Return query results as associative arrays.
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            ]
        );

        return $pdo;
    } catch (PDOException $error) {
        // Return a generic error to the client.
        // Avoid exposing database credentials or connection details.
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed.']);
        exit;
    }
}

/**
 * Send a JSON response and immediately stop script execution.
 */
function send_json($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
