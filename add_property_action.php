<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['partner_id'])) {
    header("Location: index.php");
    exit();
}

$partner_id = $_SESSION['partner_id'];
$name       = trim($_POST['name']);
$desc       = trim($_POST['desc']);
$image      = trim($_POST['image']);
$amenities  = trim($_POST['amenities']);
$street     = trim($_POST['street']);
$city       = trim($_POST['city']);
$zip        = trim($_POST['zip']);
$price      = (float)$_POST['price'];

try {
    $pdo->beginTransaction();

    // 1. Insert Property
    $stmt = $pdo->prepare("INSERT INTO PROPERTY (Part_id, Prop_name, Prop_desc, Prop_image, Prop_amenities, Prop_street, Prop_city, Prop_zip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$partner_id, $name, $desc, $image, $amenities, $street, $city, $zip]);
    $prop_id = $pdo->lastInsertId();

    // 2. Insert Room Type (Base pricing)
    $rtStmt = $pdo->prepare("INSERT INTO ROOM_TYPE (Type_desc, Type_base_price, Type_max_occu) VALUES (?, ?, ?)");
    $rtStmt->execute(['Standard Room', $price, 2]);
    $type_id = $pdo->lastInsertId();

    // 3. Insert initial Room
    $rStmt = $pdo->prepare("INSERT INTO ROOM (Prop_id, Type_id, Room_number, Room_floor_lvl) VALUES (?, ?, ?, ?)");
    $rStmt->execute([$prop_id, $type_id, '101', 1]);

    $pdo->commit();
    header("Location: partner_dashboard.php");
    exit();

} catch (PDOException $e) {
    $pdo->rollBack();
    die("Error listing property: " . $e->getMessage());
}
?>