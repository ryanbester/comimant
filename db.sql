DROP TABLE IF EXISTS `access_tokens`;

CREATE TABLE `access_tokens` (
  `access_token` binary(32) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `expires` datetime NOT NULL,
  PRIMARY KEY (`access_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `nonces`;

CREATE TABLE `nonces` (
  `id` binary(32) NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `expires` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `passwd`;

CREATE TABLE `passwd` (
  `user_id` binary(16) NOT NULL,
  `password` text NOT NULL,
  `salt` binary(32) NOT NULL,
  `salt_iv` binary(16) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `privilege_templates`;

CREATE TABLE `privilege_templates` (
  `name` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `privileges` text,
  `default_template` tinyint(1) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `services`;

CREATE TABLE `services` (
  `user_id` binary(16) NOT NULL,
  `service_type` varchar(255) NOT NULL,
  `service_name` varchar(255) NOT NULL,
  `service_title` varchar(255) NOT NULL,
  `service_user_id` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `sudo_access_tokens`;

CREATE TABLE `sudo_access_tokens` (
  `access_token` binary(32) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `expires` datetime NOT NULL,
  PRIMARY KEY (`access_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `user_id` binary(16) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email_address` varchar(255) NOT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `dob` date DEFAULT NULL,
  `privileges` text NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `widget_layouts`;

CREATE TABLE `widget_layouts` (
  `user_id` binary(16) NOT NULL,
  `layout` text,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `widgets`;

CREATE TABLE `widgets` (
  `widget_id` binary(16) NOT NULL,
  `user_id` binary(16) NOT NULL,
  `type` text,
  `title` text,
  `data` text,
  PRIMARY KEY (`widget_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;