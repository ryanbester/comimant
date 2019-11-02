/*
Copyright (C) 2019 Bester Intranet
*/

const db = require('../db/db');

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

    saveService(){
        return new Promise((resolve, reject) => {
            if(this.user_id === undefined){
                reject("User ID not set");
            }

            if(this.name === undefined){
                reject("Service name not set");
            }

            // Create a connection to the database
            const connection = db.getConnection('modify');

            // Open the connection
            connection.connect();

            // Execute the query to update the service information
            connection.query("UPDATE services ")
        });
    }
}

module.exports.ServiceManager = class ServiceManager {
    
}