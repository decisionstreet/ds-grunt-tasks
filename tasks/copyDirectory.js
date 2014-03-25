var fs = require('fs-extra'),
    async = require('async');

module.exports = function (grunt) {

    grunt.registerMultiTask('copyDirectory', 'Recursively copies a directory', function() {

        var files = this.data.files || [this.data],
            done = this.async();

        async.eachSeries(files, function(item, callback) {
            var source = item.src.toString(), // Why is this an OBJECT?
                destination = item.dest;

            if (source === undefined) {
                callback('source not defined');
            }
            if (destination === undefined) {
                callback('destination not defined');
            }

            grunt.log.writeln('Copying directory "' + source + '" to "' + destination + '"');
            fs.mkdirs(destination, function (err) {
                if (err) {
                    callback (err);
                }

                fs.copy(source, destination, function (err) {
                    if (err) {
                        callback (err);
                    }

                    callback(null);
                });
            });
        }, function (err) {
            if (err) {
                grunt.log.error(err);
                done(false);
            }

            done(true);
        });

    });

};