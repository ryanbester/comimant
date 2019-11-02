/*
Copyright (C) 2019 Bester Intranet
*/

const db = require('../../db/db');

module.exports.Service = class Service {
    constructor(user_id, type, name, title, service_user_id){
        this.user_id = user_id;
        this.type = type;
        this.name = name;
        this.title = title;
        this.service_user_id = service_user_id;
    }

    loadInfo(){
        return new Promise((resolve, reject) => {
            // Check if user ID is set
            if(this.user_id === undefined) {
                reject("User ID not set");
            }

            // Check if service name is set
            if(this.name === undefined){
                reject("Service name not set");
            }

            // Create a connection to the database
            const connection = db.getConnection();
            
            // Open the connection
            connection.connect();

            // Execute the query to obtain the service details
            connection.query("SELECT * FROM services WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ") AND service_name = " + connection.escape(this.name),
            (error, results, fields) => {
                // Close the connection
                connection.end();

                if (error) reject(error);

                // If the user ID and service name matches a record
                if(results.length > 0){
                    // Get the service details
                    this.type = results[0].service_type;
                    this.title = results[0].service_title;
                    this.service_user_id = results[0].service_user_id;

                    resolve(true);
                } else {
                    reject(false);
                }
            });
        });
    }

    saveService(originalName){
        return new Promise((resolve, reject) => {
            if(this.user_id === undefined){
                reject("User ID not set");
            }

            if(this.name === undefined){
                reject("Service name not set");
            }

            var name = this.name;

            if(originalName !== undefined){
                name = originalName;
            }

            // Create a connection to the database
            const connection = db.getConnection('modify');

            // Open the connection
            connection.connect();

            // Execute the query to check if the service is already in the database
            connection.query("SELECT COUNT(*) AS ServiceCount FROM services WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ") AND service_name = " + connection.escape(name),
            (error, results, fields) => {
                if (error) {
                    connection.end();
                    reject(error);
                } else {
                    if(results[0].ServiceCount > 0){
                        // Update the existing service
                        connection.query("UPDATE services "
                        + "SET user_id = UNHEX(" + connection.escape(this.user_id) + "), "
                        + "service_type = " + connection.escape(this.type) + ", "
                        + "service_name = " + connection.escape(this.name) + ", "
                        + "service_title = " + connection.escape(this.title) + ", "
                        + "service_user_id = " + connection.escape(this.service_user_id)
                        + " WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ") AND service_name = " + connection.escape(name),
                        (error, results, fields) => {
                            // Close the connection
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    } else {
                        // Insert the new service
                        connection.query("INSERT INTO services VALUES("
                        + "UNHEX(" + connection.escape(this.user_id) + "), "
                        + connection.escape(this.type) + ", "
                        + connection.escape(this.name) + ", "
                        + connection.escape(this.title) + ", "
                        + connection.escape(this.service_user_id) + ")",
                        (error, results, fields) => {
                            // Close the connection
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    }
                }
            });
        });
    }

    getSubclass(){
        if(this.type === undefined){
            return "Service type not set";
        }

        var service;
        
        switch(this.type){
            case 'bestermail':
                const { BesterMail } = require('../../core/myaccount/services/bestermail');

                service = new BesterMail(this.user_id, this.type, this.name, this.title, this.service_user_id);
                break;
            default:
                return "Service not found"
                break;
        }

        return service;
    }
}

module.exports.ServiceManager = class ServiceManager {
    constructor(user_id){
        this.user_id = user_id;
    }

    getServices(){
        return new Promise((resolve, reject) => {
            // Check if user ID is set
            if(this.user_id === undefined){
                reject("User ID is not set");
            }

            const connection = db.getConnection();

            // Open the connection
            connection.connect();

            connection.query("SELECT HEX(user_id) AS user_id, service_type, service_name, service_title, service_user_id FROM services WHERE user_id = UNHEX(" + connection.escape(this.user_id) + ")",
            (error, results, fields) => {
                // Close the connection
                connection.end();

                if (error) reject(error);

                let services = [];

                Object.keys(results).forEach(key => {
                    services.push(new module.exports.Service(
                        results[key].user_id,
                        results[key].service_type,
                        results[key].service_name,
                        results[key].service_title,
                        results[key].service_user_id
                    ));
                });

                resolve(services);
            });
        });
    }
}