var fs = require('fs-extra');
var Sequelize = require('sequelize');
var path = require('path');
var _ = require('lodash');
var moment = require('moment');

module.exports = function (grunt) {

    grunt.registerTask('sequelize', 'Run Sequelize tasks', function(cmd, arg1) {
        var done;

        var options = this.options({
            migrationsPath: './migrations',
            logging: false
        });

        var sequelize = new Sequelize(options.database, options.username, options.password, options);

        var migratorOptions = {
            // migrator expects an absolute path
            path: path.resolve(options.migrationsPath)
        };
        var migrator = sequelize.getMigrator(migratorOptions);

        var migrationName, migrationContent;

        if (cmd === 'migrate') {
            done = this.async();

            migrator
                .migrate({ method: 'up' })
                .then(_.noop, function (err) {
                    throw new Error(err);
                })
                .done(done, done);
        } else if (cmd === 'undo') {
            done = this.async();

            // migrator.migrate({ method: 'down' }) doesn't work, though docs say it should
            // This is taken from the Sequelize source - it's magic.
            migrator.findOrCreateSequelizeMetaDAO().then(function(Meta) {
                return Meta.find({ order: 'id DESC' });
            }).then(function (meta) {
                if (meta) {
                    migrator = sequelize.getMigrator(_.extend(migratorOptions, meta.values), true);
                    return migrator.migrate({ method: 'down' });
                } else {
                    grunt.log.writeln('There are no pending migrations.');
                }
            }).then(_.noop, function (err) {
                throw new Error(err);
            })
            .done(done, done);

        } else if (cmd === 'createMigration') {
            migrationName = [
                    moment().format('YYYYMMDDHHmmss'),
                    arg1 || 'newMigration'
                ].join('-') + '.js';

            migrationContent = [
                "module.exports = {",
                "  up: function(migration, DataTypes, done) {",
                "    // add altering commands here, calling 'done' when finished",
                "    done()",
                "  },",
                "  down: function(migration, DataTypes, done) {",
                "    // add reverting commands here, calling 'done' when finished",
                "    done()",
                "  }",
                "}"
            ].join('\n') + "\n";

            fs.writeFileSync(migratorOptions.path + '/' + migrationName, migrationContent);
            grunt.log.writeln('New migration "' + migrationName + '" was added to "' +
                path.relative(process.cwd(), migratorOptions.path) + '/".');
        } else if (cmd === 'createSqlMigration') {
            var timestamp = moment().format('YYYYMMDDHHmmss');
            var title = arg1 || 'newMigration';
            migrationName = [
                timestamp,
                title
            ].join('-') + '.js';

            migrationContent = [
                "var sqlRunner = require('./helpers/sqlRunner');",
                "module.exports = sqlRunner.buildMigration(__filename);"
            ].join('\n') + "\n";


            fs.mkdirSync(migratorOptions.path + '/' + timestamp);
            fs.writeFileSync(migratorOptions.path + '/' + timestamp + '/up-001-' + title + '.sql', '');
            fs.writeFileSync(migratorOptions.path + '/' + timestamp + '/down-001-' + title + '.sql', '');
            fs.writeFileSync(migratorOptions.path + '/' + migrationName, migrationContent);
            grunt.log.writeln('New migration "' + migrationName + '" was added to "' +
                path.relative(process.cwd(), migratorOptions.path) + '/".');
        } else {
            throw new Error('Unknown command: ' + cmd);
        }
    });

};