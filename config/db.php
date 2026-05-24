<?php
/**
 * Database Connection Configuration
 * Uses PDO for secure and flexible database access.
 */
session_start();

$host     = 'localhost';
$dbname   = 'BUANGJOG_REDDOORZ';
$username = 'root'; // Default XAMPP username
$password = '';     // Default XAMPP password is empty

try {
    // Create a new PDO instance with UTF-8 support
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    
    // Set the PDO error mode to exception to catch errors during development
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Set default fetch mode to associative array for easier data handling
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch(PDOException $e) {
    // In a production environment, you would log this error and show a generic message
    die("Database Connection Error: " . $e->getMessage());
}
?>