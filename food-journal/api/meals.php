<?php

// Endpoint: /api/meals.php
// GET    - Load meals for a user
// POST   - Create a new meal with uploaded photo
// DELETE - Delete a meal and its photo

require_once 'db.php';

$db = get_db_connection();
$method = $_SERVER['REQUEST_METHOD'];

// Load meals for one user.
if ($method === 'GET') {
    $user_id = filter_input(INPUT_GET, 'user_id', FILTER_VALIDATE_INT);

    if (!$user_id) {
        send_json(['error' => 'Missing or invalid user_id.'], 400);
    }

    $stmt = $db->prepare('
        SELECT id, user_id, photo_path, notes, protein, veggies, carbs, fats,
               DATE_FORMAT(created_at, "%Y-%m-%dT%H:%i:%sZ") AS created_at
        FROM meals
        WHERE user_id = ?
        ORDER BY id DESC
    ');
    $stmt->execute([$user_id]);

    send_json($stmt->fetchAll());
}

// Create a new meal entry and save the uploaded photo.
if ($method === 'POST') {
    $user_id = filter_input(INPUT_POST, 'user_id', FILTER_VALIDATE_INT);
    $notes = trim($_POST['notes'] ?? '');
    $protein = filter_input(INPUT_POST, 'protein', FILTER_VALIDATE_INT) ?? 0;
    $veggies = filter_input(INPUT_POST, 'veggies', FILTER_VALIDATE_INT) ?? 0;
    $carbs = filter_input(INPUT_POST, 'carbs', FILTER_VALIDATE_INT) ?? 0;
    $fats = filter_input(INPUT_POST, 'fats', FILTER_VALIDATE_INT) ?? 0;

    if (!$user_id || $notes === '') {
        send_json(['error' => 'Missing required meal information.'], 400);
    }

    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
        send_json(['error' => 'Photo upload failed.'], 400);
    }

    $allowed_types = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/webp' => 'webp',
        'image/gif' => 'gif'
    ];

    $mime_type = mime_content_type($_FILES['photo']['tmp_name']);

    if (!array_key_exists($mime_type, $allowed_types)) {
        send_json(['error' => 'Unsupported image type. Use JPG, PNG, WEBP, or GIF.'], 400);
    }

    $upload_dir = __DIR__ . '/../media/uploads/meals/';

    if (!is_dir($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    $extension = $allowed_types[$mime_type];
    $filename = 'meal_' . bin2hex(random_bytes(16)) . '.' . $extension;
    $destination = $upload_dir . $filename;

    if (!move_uploaded_file($_FILES['photo']['tmp_name'], $destination)) {
        send_json(['error' => 'Could not save uploaded photo.'], 500);
    }

    $photo_path = 'media/uploads/meals/' . $filename;

    $stmt = $db->prepare('
        INSERT INTO meals (user_id, photo_path, notes, protein, veggies, carbs, fats)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ');

    $stmt->execute([$user_id, $photo_path, $notes, $protein, $veggies, $carbs, $fats]);

    send_json(['success' => true, 'id' => $db->lastInsertId()], 201);
}

// Update an existing meal entry.
if ($method === 'PATCH') {

    // PATCH data does not automatically populate $_POST,
    // so read and decode the raw JSON request body.
    $data = json_decode(file_get_contents('php://input'), true);

    if (!is_array($data)) {
        send_json(['error' => 'Invalid request data.'], 400);
    }

    $meal_id = filter_var($data['id'] ?? null, FILTER_VALIDATE_INT);
    $user_id = filter_var($data['user_id'] ?? null, FILTER_VALIDATE_INT);

    $notes = trim($data['notes'] ?? '');

    $protein = filter_var($data['protein'] ?? 0, FILTER_VALIDATE_INT);
    $veggies = filter_var($data['veggies'] ?? 0, FILTER_VALIDATE_INT);
    $carbs = filter_var($data['carbs'] ?? 0, FILTER_VALIDATE_INT);
    $fats = filter_var($data['fats'] ?? 0, FILTER_VALIDATE_INT);

    if (!$meal_id || !$user_id || $notes === '') {
        send_json(['error' => 'Missing required meal information.'], 400);
    }

    //See if the meal that wants to be edited is owned by the correct user
    $check = $db->prepare('
        SELECT id
        FROM meals
        WHERE id = ?
        AND user_id = ?
    ');

    $check->execute([
        $meal_id,
        $user_id
    ]);

    // Wrong user / nonexistent meal
    if (!$check->fetch()) {
        send_json([
            'error' => 'Meal not found for this user.'
        ], 404);
    }

    // Prevent one user from editing another user's meal.
    // by clarifying user_id
    $stmt = $db->prepare('
        UPDATE meals
        SET notes = ?,
            protein = ?,
            veggies = ?,
            carbs = ?,
            fats = ?
        WHERE id = ?
          AND user_id = ?
    ');

    $stmt->execute([
        $notes,
        $protein,
        $veggies,
        $carbs,
        $fats,
        $meal_id,
        $user_id
    ]);

    // Valid meal, values unchanged
    if ($stmt->rowCount() === 0) {
        send_json([
            'success' => true,
            'id' => $meal_id,
            'message' => 'No changes were necessary.'
        ]);
    }

    // Valid meal, values changed
    send_json([
        'success' => true,
        'id' => $meal_id
    ]);
}

// Delete a meal record and remove its uploaded photo file.
if ($method === 'DELETE') {
    $meal_id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);

    if (!$meal_id) {
        send_json(['error' => 'Missing or invalid meal id.'], 400);
    }

    $stmt = $db->prepare('SELECT photo_path FROM meals WHERE id = ?');
    $stmt->execute([$meal_id]);
    $meal = $stmt->fetch();

    if (!$meal) {
        send_json(['error' => 'Meal not found.'], 404);
    }

    $delete = $db->prepare('DELETE FROM meals WHERE id = ?');
    $delete->execute([$meal_id]);

    $photo_file = __DIR__ . '/../' . $meal['photo_path'];

    if (is_file($photo_file)) {
        unlink($photo_file);
    }

    send_json(['success' => true]);
}

send_json(['error' => 'Method not allowed.'], 405);
