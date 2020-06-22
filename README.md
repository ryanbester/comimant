# Comimant

Comimant is a fully customisable, open source platform for creating intranet systems.

## Requirements

Comimant requires the following to run:

- Node.js 12 or later
- PM2
- A web server to use as a reverse proxy
- MySQL 8 or later
- Redis

## Installation

At the moment, Comimant can only be installed manually, but an automatic installation script is in development.

### Automatic Installation

The automatic installation script will guide you through installing Comimant on your server.

1. Download the install.sh script from the root of this repo.
2. Place this script in the root of your intranet site, and run ./install.sh. This will clone the repo into the same directory as the script.
3. The script will ask you for required information such as port numbers and database credentials, then will guide you through setting up the database and basic customisations, such as your intranet name.

### Manual Installation

Installing Comimant manually will give you more control over how you install it.

1. Clone the repo into your site root. Make sure the files are in a directory named comimant.
2. Create a PM2 ecosystem file containing your port numbers, and database credentials (see below for more details).
3. Create a config.json file in the comimant directory, or the location your specify in the ecosystem file. See below for a configuration template.

## Configuration files

Below are some configuration file templates. For more details, see the docs.

### PM2 Ecosystem

```json
{
  "apps": [
    {
      "script": "/pat/to/comimant/app.js",
      "name": "comimant",
      "env": {
        "NODE_ENV": "production",
        "PORT": "[port number]",
        "DB_HOST": "127.0.0.1",
        "DB_PORT": "3306",
        "DB_DATABASE": "comimant",
        "DB_USER": "comimant_user",
        "DB_PASS": "Some secure password",
        "DB_USER_MODIFY": "comimant_modify_user",
        "DB_PASS_MODIFY": "Another secure password",
        "DB_USER_DELETE": "comimant_delete_user",
        "DB_PASS_DELETE": "Yet another secure password",
        "REDIS_HOST": "127.0.0.1",
        "REDIS_PORT": "6379",
        "PEPPER": "8 char string",
        "SECRET_1": "64 char hex string",
        "SECRET_2": "64 char hex string",
        "COOKIE_SECRET": "64 char hex string",
        "DATABASE_KEY": "32 char hex string"
      }
    }
  ]
}
```

### Comimant config.json

```json
{
  "title": "Acme Intranet",
  "keywords": "acme intranet",
  "description": "Some description about the Acme Intranet",
  "email_domains": [
    "@acme.com"
  ],
  "domains": [
    {
      "root": {
        "domain": "example.com"
      },
      "main": {
        "domain": "www.example.com"
      },
      "static": {
        "domain": "static.example.com"
      },
      "accounts": {
        "domain": "accounts.example.com"
      },
      "auth": {
        "domain": "auth.example.com"
      }
    }
  ],
  "plugins_dir": "/path/to/comimant/root/plugins"
}
```