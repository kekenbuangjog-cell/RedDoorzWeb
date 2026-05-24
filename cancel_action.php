<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_SESSION['user_id'])) {
    header("Location: index.php");
    exit();
}

$book_id = (int)$_POST['book_id'];
$user_id = $_SESSION['user_id'];

try {
    // Security check: Ensure this booking belongs to the current user
    $stmt = $pdo->prepare("SELECT Book_id FROM BOOKING WHERE Book_id = ? AND Acct_id = ?");
    $stmt->execute([$book_id, $user_id]);
    $booking = $stmt->fetch();

    if (!$booking) {
        $_SESSION['cancel_error'] = "Booking not found or you do not have permission to cancel it.";
    } else {
        // Update status to Cancelled
        $updateStmt = $pdo->prepare("UPDATE BOOKING SET Book_status = 'Cancelled' WHERE Book_id = ?");
        $updateStmt->execute([$book_id]);
        $_SESSION['cancel_success'] = "Your booking has been successfully cancelled.";
    }

    header("Location: my_bookings.php");
    exit();

} catch (PDOException $e) {
    $_SESSION['cancel_error'] = "An error occurred: " . $e->getMessage();
    header("Location: my_bookings.php");
    exit();
}
?>