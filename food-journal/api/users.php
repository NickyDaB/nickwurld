<?php
require_once 'db.php';

$db = get_db_connection();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json(['error' => 'Method not allowed.'], 405);
}

$stmt = $db->query('SELECT id, name FROM users ORDER BY name ASC');
$users = $stmt->fetchAll();

send_json($users);
