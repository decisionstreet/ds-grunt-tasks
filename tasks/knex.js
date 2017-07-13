var path = require('path');

module.exports = function (grunt) {


    /*

     config.knex = {
         options: {
             client: 'pg',
             database: appConfig.db.database,
             host: appConfig.db.host,
             user: appConfig.db.user,
             password: appConfig.db.password,
             migrationPath: './db/migrations',
             seedPath: './db/seeds',
             logging: grunt.log.writeln
         }
     };


     */
    grunt.registerTask('knex', 'Run knex tasks', function (cmd, arg1) {
        var done;

        var options = this.options({
            migrationPath: './db/migrations',
            seedPath: './db/seeds',
            logging: false
        });

        var knex = require('knex')({
            client: 'pg',
            connection: {
                host : options.host,
                user : options.user,
                password : options.password,
                database : options.database
            }
        });

        var migrationName;

        if (cmd === 'migrate') {
            done = this.async();

            knex.migrate.latest({
                directory: options.migrationPath
            }).spread(function (batch, log) {
                grunt.log.writeln(log.join('\n'));
            }).catch(function (err) {
                console.error(err.stack || err);
                throw err;
            }).nodeify(done);

        } else if (cmd === 'rollback') {
            done = this.async();

            knex.migrate.rollback({
                directory: options.migrationPath
            }).spread(function (batch, log) {
                grunt.log.writeln(log.join('\n'));
            }).catch(function (err) {
                console.error(err.stack || err);
                throw err;
            }).nodeify(done);
        } else if (cmd === 'createMigration') {
            done = this.async();
            migrationName = arg1 || 'newMigration';

            knex.migrate.make(migrationName, {
                directory: options.migrationPath
            }).nodeify(done);
        } else {
            throw new Error('Unknown command: ' + cmd);
        }
    });

};