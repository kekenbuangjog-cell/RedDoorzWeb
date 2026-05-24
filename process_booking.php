<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$prop_id   = (int)$_POST['prop_id'];
$check_in  = $_POST['check_in'];
$check_out = $_POST['check_out'];
$total     = (float)$_POST['total'];
$user_id   = $_SESSION['user_id'];

try {
    // 1. Find an available room for this property
    $stmt = $pdo->prepare("SELECT Room_id FROM ROOM WHERE Prop_id = ? LIMIT 1");
    $stmt->execute([$prop_id]);
    $room = $stmt->fetch();

    if (!$room) {
        die("Sorry, no rooms are available for this property at the moment.");
    }

    $room_id = $room['Room_id'];

    // 2. Insert the booking record
    $insertStmt = $pdo->prepare("
        INSERT INTO BOOKING (Room_id, Acct_id, Book_in_date, Book_out_date, Book_total, Book_status) 
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $insertStmt->execute([$room_id, $user_id, $check_in, $check_out, $total, 'Confirmed']);

    $booking_id = $pdo->lastInsertId();

    // 3. (Optional) Insert a payment record for completeness
    $payStmt = $pdo->prepare("
        INSERT INTO PAYMENT (Book_id, Pay_amt, Pay_date, Pay_method) 
        VALUES (?, ?, NOW(), ?)
    ");
    $payStmt->execute([$booking_id, $total, 'Credit Card']);

    // Redirect to a simple success state
    $_SESSION['booking_success'] = "Congratulations! Your booking for " . date('M d', strtotime($check_in)) . " has been confirmed.";
    header("Location: index.php");
    exit();

} catch (PDOException $e) {
    die("Booking Error: " . $e->getMessage());
}
?>