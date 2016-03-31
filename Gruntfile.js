module.exports = function (grunt) {

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.initConfig({

        // Configure a mochaTest task
        mochaTest: {
            test: {
                options: {
                    reporter: 'spec',
                    captureFile: 'test/test_sonuclari.txt', // Optionally capture the reporter output to a file
                    quiet: false, // Optionally suppress output to standard out (defaults to false)
                    clearRequireCache: false // Optionally clear the require cache before running tests (defaults to false)
                },
                src: ['test/**/*.js']
            }
        },
        watch: {
            js: {
                options: {
                    spawn: false,
                },
                files: ['src/*.js','test/*.js'],
                tasks: ['mochaTest']
            }
        }
    });

    // On watch events, if the changed file is a test file then configure mochaTest to only
    // run the tests from that file. Otherwise run all the tests
    var defaultTestSrc = grunt.config('mochaTest.test.src');
    grunt.event.on('watch', function(action, filepath) {
        grunt.config('mochaTest.test.src', defaultTestSrc);
        if (filepath.match('test/')) {
            grunt.config('mochaTest.test.src', filepath);
        }
    });

    grunt.registerTask('mocha',['mochaTest']);
    grunt.registerTask('default', ['watch','mochaTest']);
};