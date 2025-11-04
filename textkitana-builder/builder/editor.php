<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

?><!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>Kitana Builder – Editor</title>
    <link rel="stylesheet" href="../assets/css/style.css">
</head>
<body class="kb-embed">
    <div class="kb-editor__viewport" id="embedded-editor"></div>
    <script src="../assets/js/monaco/editor.js"></script>
    <script src="../assets/js/monaco/worker.js"></script>
    <script src="../assets/js/ollama.js"></script>
    <script src="../assets/js/ui.js"></script>
    <script>
        window.addEventListener('DOMContentLoaded', () => {
            if (window.KitanaEditor) {
                window.KitanaEditor.attachStandalone('embedded-editor');
            }
        });
    </script>
</body>
</html>
