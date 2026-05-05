<?php
// VULNERABILITY 3: Insecure File Permissions / Path Traversal
// CWE-22: Improper Limitation of a Pathname to a Restricted Directory

$file = $_GET['file']; // e.g., ?file=../../../etc/passwd

// Dangerous: Directly reading a file based on user input without validation
if (isset($file)) {
    $content = file_get_contents('/var/www/html/docs/' . $file);
    echo $content;
} else {
    echo "Please specify a file.";
}
?>
