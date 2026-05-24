<?php
require_once 'config/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email']);
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM USER_ACCOUNT WHERE Acct_username = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['Acct_password'])) {
        $_SESSION['user_id'] = $user['Acct_id'];
        $_SESSION['user_name'] = $user['Acct_fname'] . ' ' . $user['Acct_lname'];
        
        // Redirect back to where they came from
        $redirect = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.php';
        header("Location: " . $redirect);
        exit();
    } else {
        $_SESSION['login_error'] = "Invalid email or password.";
        $redirect = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : 'index.php';
        header("Location: " . $redirect);
        exit();
    }
}
?>