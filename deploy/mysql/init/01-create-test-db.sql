CREATE DATABASE IF NOT EXISTS `campus_forum_test`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

GRANT ALL PRIVILEGES ON `campus_forum_test`.* TO 'campus_forum'@'%';
FLUSH PRIVILEGES;
