<?php
declare(strict_types=1);

require_once __DIR__ . '/../config.php';

class KitanaDB
{
    private static ?PDO $pdo = null;

    public static function conn(): PDO
    {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        if (!is_dir(dirname(KITANA_DB_PATH))) {
            mkdir(dirname(KITANA_DB_PATH), 0775, true);
        }

        $dsn = 'sqlite:' . KITANA_DB_PATH;
        self::$pdo = new PDO($dsn);
        self::$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        self::$pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

        self::$pdo->exec('PRAGMA foreign_keys = ON;');
        self::$pdo->exec('PRAGMA journal_mode = WAL;');
        self::$pdo->exec('PRAGMA synchronous = NORMAL;');

        return self::$pdo;
    }

    public static function query(string $sql, array $params = []): PDOStatement
    {
        $stmt = self::conn()->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(is_int($key) ? $key + 1 : (str_starts_with((string)$key, ':') ? $key : ':' . $key), $value);
        }
        $stmt->execute();

        return $stmt;
    }

    public static function fetchAll(string $sql, array $params = []): array
    {
        return self::query($sql, $params)->fetchAll();
    }

    public static function fetchOne(string $sql, array $params = []): ?array
    {
        $stmt = self::query($sql, $params);
        $row = $stmt->fetch();

        return $row === false ? null : $row;
    }

    public static function execTransaction(callable $callback): void
    {
        $pdo = self::conn();
        $pdo->beginTransaction();

        try {
            $callback($pdo);
            $pdo->commit();
        } catch (Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}

