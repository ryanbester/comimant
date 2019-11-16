/*
Copyright (C) 2019 Bester Intranet
*/

const db = require('../../db/db');

module.exports.PrivilegeTemplate = class PrivilegeTemplate {
    constructor(name, title, privileges, default_template){
        this.name = name;
        this.title = title;
        this.privileges = privileges;
        this.default_template = default_template;
    }

    loadInfo(){
        return new Promise((resolve, reject) => {
            if(this.name === undefined){
                reject("Privilege Template name is not set");
            }

            // Create a connection to the database
            const connection = db.getConnection();

            // Open the connection
            connection.connect();

            // Execute the query to obtain the privilege template details
            connection.query("SELECT * FROM privilege_templates WHERE name = " + connection.escape(this.name),
            (error, results, fields) => {
                // Close the connection
                connection.end();

                if (error) reject(error);

                if(results.length > 0){
                    this.title = results[0].title;
                    this.privileges = JSON.parse(results[0].privileges);
                    this.default_template = results[0].default_template;

                    resolve(true);
                } else {
                    reject(false);
                }
            });
        });
    }

    savePrivilegeTemplate(originalName){
        return new Promise((resolve, reject) => {
            if(this.name === undefined){
                reject("Privilege Template name is not set");
            }

            var name = this.name;
            
            if(originalName !== undefined){
                name = originalName;
            }

            const connection = db.getConnection('modify');

            connection.connect();

            connection.query("SELECT COUNT(*) AS PrivilegeTemplateCount FROM privilege_templates WHERE name = " + connection.escape(name),
            (error, results, fields) => {
                if (error){
                    connection.end();
                    reject(error);
                } else {
                    if(results[0].PrivilegeTemplateCount > 0){
                        connection.query("UPDATE privilege_templates "
                        + "SET name = " + connection.escape(this.name) + ", "
                        + "title = " + connection.escape(this.title) + ", "
                        + "privileges = " + connection.escape(JSON.stringify(this.privileges)) + ", "
                        + "default_template = " + connection.escape(this.default_template)
                        + " WHERE name = " + connection.escape(name),
                        (error, results, fields) => {
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    } else {
                        connection.query("INSERT INTO privilege_templates VALUES("
                        + connection.escape(this.name) + ", "
                        + connection.escape(this.title) + ", "
                        + connection.escape(JSON.stringify(this.privileges)) + ", "
                        + connection.escape(this.default_template) + ")",
                        (error, results, fields) => {
                            connection.end();

                            if (error) reject(error);

                            resolve(true);
                        });
                    }
                }
            });
        });
    }

    deletePrivilegeTemplate(){
        return new Promise((resolve, reject) => {
            if(this.name === undefined){
                reject("Privilege Template name is not set");
            }

            // Create a connection to the database
            const connection = db.getConnection('delete');

            // Open the connection
            connection.connect();

            connection.query("DELETE FROM privilege_templates WHERE name = " + connection.escape(this.name),
            (error, results, fields) => {
                // Close the connection
                connection.end();

                if (error) reject(error);

                resolve(true);
            });
        });
    }

    hasPrivilege(privilege){
        if(this.name === undefined){
            return false;
        }

        if(this.privileges === undefined){
            return false;
        }

        if(this.privileges.hasOwnProperty(privilege)){
            if(this.privileges[privilege] == 1){
                return true;
            }
        }

        return false;
    }

    addPrivilege(privilege){
        if(this.name === undefined){
            return false;
        }

        if(this.privileges === undefined){
            return false;
        }

        this.privileges[privilege] = 1;

        return true;
    }

    revokePrivilege(privilege){
        if(this.name === undefined){
            return false;
        }

        if(this.privileges === undefined){
            return false;
        }

        this.privileges[privilege] = 0;

        return true;
    }

    deletePrivilege(privilege){
        if(this.name === undefined){
            return false;
        }

        if(this.privileges === undefined){
            return false;
        }

        delete this.privileges[privilege];

        return true;
    }

    getPrivileges(){
        if(this.name === undefined){
            return false;
        }

        if(this.privileges === undefined){
            return false;
        }

        return this.privileges;
    }

    countGrantedPrivileges(){
        if(this.name === undefined){
            return false;
        }

        if(this.privileges === undefined){
            return false;
        }

        var count = 0;
        Object.keys(this.privileges).forEach(name => {
            if(this.privileges[name] == 1){
                count++;
            }
        });

        return count;
    }
}

module.exports.PrivilegeTemplates = class PrivilegeTemplates {
    static getPrivilegeTemplates(){
        return new Promise((resolve, reject) => {
            const connection = db.getConnection();

            connection.connect();

            connection.query("SELECT * FROM privilege_templates",
            (error, results, fields) => {
                connection.end();

                if (error) reject(error);

                let privilegeTemplates = [];

                Object.keys(results).forEach(key => {
                    privilegeTemplates.push(new module.exports.PrivilegeTemplate(
                        results[key].name,
                        results[key].title,
                        JSON.parse(results[key].privileges),
                        results[key].default_template
                    ));
                });

                resolve(privilegeTemplates);
            });
        });
    }
}