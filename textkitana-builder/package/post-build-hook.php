<?php
declare(strict_types=1);

$base = dirname(__DIR__);
$cache = $base . '/tmp';
if (is_dir($cache)) {
    $objects = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($cache, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($objects as $object) {
        if ($object->isFile()) {
            @unlink($object->getPathname());
        } elseif ($object->isDir()) {
            @rmdir($object->getPathname());
        }
    }
    @rmdir($cache);
}

file_put_contents($base . '/package/build.log', '[' . date('c') . "] Packaged successfully\n", FILE_APPEND);
