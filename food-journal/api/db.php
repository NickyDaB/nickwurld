<?php
//Replace with credentials and do not track!
$DB_HOST = "YOUR_HOSTNAME_HERE";   // e.g. mysql.yourdomain.com (DreamHost shows this)
$DB_NAME = "YOUR_DB_NAME_HERE";
$DB_USER = "YOUR_DB_USER_HERE";
$DB_PASS = "YOUR_DB_PASSWORD_HERE";

function get_db_connection() {
    global $db_host, $db_name, $db_user, $db_pass;

    $dsn = "mysql:host=$db_host;dbname=$db_name;charset=utf8mb4";

    try {
        return new PDO($dsn, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    } catch (PDOException $error) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed.']);
        exit;
    }
}

function send_json($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
