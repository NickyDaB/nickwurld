<?php

//Leaving here for later -- Helps with debugging stuff
/*
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
*/

// Endpoint: GET /api/users.php
// Returns all available food journal users.

require_once 'db.php';

header("Content-Type: application/json");
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: 0");

$db = get_db_connection();

// This endpoint only supports GET requests.
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    send_json(
        ['error' => 'Method not allowed.'], 
        405
    );
}

//Check to see if we are looking up a specific user
$username = trim($_GET['username'] ?? '');
//If we can't find anything, then we assume we are looking for someone specific
if($username !== '')
{
    $stmt = $db->prepare('
        SELECT id, name, timezone
        FROM users
        WHERE name = ?
        LIMIT 1
    ');

    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if(!$user)
    {
        send_json(
            ['error' => 'User not found'],
            404
        );
    }

    send_json($user);
}

//If no username was provided, then return all users.
$stmt = $db->query(
    'SELECT id, name 
    FROM users 
    ORDER BY name ASC'
    );
$users = $stmt->fetchAll();

send_json($users);
