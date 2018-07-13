/**
 * atob
 * @param {String} str
 * @return {*}
 */
function atob(str) {
    if (str) {
        return new Buffer(str, 'base64').toString('binary');
    }
    return null;
}

module.exports = function (grunt) {
    const startTS = Date.now();

    grunt.initConfig({

        /**
         * This will load in our package.json file so we can have access
         * to the project name and appVersion number.
         */
        pkg: grunt.file.readJSON('package.json'),

        /**
         * Use cmd to eslint.
         */
        exec: {
            eslint: {
                cmd: './node_modules/.bin/eslint --ext .js, src',
            },
        },

        /**
         * Copies certain files over from the src folder to the build folder.
         */
        copy: {
            lib: {
                expand: true,
                flatten: true,
                cwd: './',
                src: [
                    'src/index.html',
                    'src/index_legacy.html',
                ],
                dest: './libs/gd/',
            },
        },

        /**
         * Cleans our build folder.
         */
        clean: {
            lib: {
                src: ['./libs/gd/'],
            },
        },

        svgstore: {
            options: {
                svg: {
                    viewBox: '0 0 100 100',
                    xmlns: 'http://www.w3.org/2000/svg',
                },
            },
            default: {
                files: {
                    'libs/gd/sprite.svg': ['src/images/*.svg'],
                },
            },
        },

        /**
         * A code block that will be added to orur minified code files.
         * Gets the name and appVersion and other info from the above loaded
         * 'package.json' file.
         * @example <%= banner.join("\\n") %>
         */
        banner: [
            '/*',
            '* Project: <%= pkg.name %>',
            '* Description: <%= pkg.description %>',
            '* Development By: <%= pkg.author %>',
            '* Copyright(c): <%= grunt.template.today("yyyy") %>',
            '* Version: <%= pkg.version %> ' +
            '(<%= grunt.template.today("dd-mm-yyyy HH:MM") %>)',
            '*/',
        ],

        /**
         * Prepends the banner above to the minified files.
         */
        usebanner: {
            options: {
                position: 'top',
                banner: '<%= banner.join("\\n") %>',
                linebreak: true,
            },
            files: {
                src: [
                    'libs/gd/gd.js',
                    'libs/gd/gd.css',
                ],
            },
        },

        /**
         * Compiles SASS stylesheets into CSS.
         */
        sass: {
            options: {
                sourcemap: 'none',
                style: 'nested', // no need for config.rb
            },
            build: {
                src: 'src/styles/plyr.scss',
                dest: 'libs/.tmp/sass.css',
            },
        },

        /**
         * Do some CSS post processing, like minifying, removing comments and
         * adding cross browser prefixes.
         */
        postcss: {
            options: {
                map: false,
                processors: [
                    require('autoprefixer')({
                        browsers: 'last 2 version',
                    }), // vendor prefixes. for more: https://github.com/ai/browserslist
                    require('cssnano')({
                        reduceIdents: false,
                    }),
                ],
            },
            build: {
                src: 'libs/.tmp/sass.css',
                dest: 'libs/gd/gd.css',
            },
        },

        /**
         * Browserify is used to support the latest version of javascript.
         * We also concat it while we're at it.
         * We only use Browserify for the mobile sites.
         */
        browserify: {
            options: {
                transform: [[
                    'babelify',
                    {
                        presets: [[
                            'env',
                            {
                                targets: {
                                    browsers: [
                                        '> 1%',
                                    ],
                                },
                                debug: false,
                                useBuiltIns: true,
                            },
                        ]],
                    },
                ]],
            },
            lib: {
                src: 'src/scripts/**/*.js',
                dest: 'libs/.tmp/babel.js',
            },
        },

        /**
         * Add the md5 javascript library.
         */
        concat: {
            options: {
                separator: ';',
            },
            lib: {
                src: [
                    'src/libraries/md5.js',
                    'libs/.tmp/babel.js',
                ],
                dest: 'libs/.tmp/concat.js',
            },
        },

        /**
         * Do some javascript post processing, like minifying and
         * removing comments.
         */
        uglify: {
            options: {
                position: 'top',
                linebreak: true,
                sourceMap: false,
                sourceMapIncludeSources: false,
                compress: {
                    sequences: true,
                    dead_code: true,
                    conditionals: true,
                    booleans: true,
                    unused: true,
                    if_return: true,
                    join_vars: true,
                },
                mangle: true,
                beautify: false,
                warnings: false,
            },
            lib: {
                src: 'libs/.tmp/concat.js',
                dest: 'libs/gd/gd.js',
            },
        },

        /**
         * Setup a simple watcher.
         */
        watch: {
            options: {
                spawn: false,
                debounceDelay: 250,
            },
            scripts: {
                files: ['src/scripts/**/*.js'],
                tasks: ['exec:eslint', 'browserify', 'concat', 'uglify', 'duration'],
            },
            css: {
                files: ['src/styles/**/*.scss'],
                tasks: ['sass', 'postcss', 'duration'],
            },
            html: {
                files: ['src/index.html', 'src/index_legacy.html'],
                tasks: ['copy'],
            },
            grunt: {
                files: ['gruntfile.js'],
            },
        },

        /**
         * Start browser sync, which setups a local node server based on the
         * server root location. This task helps with cross browser testing
         * and general workflow.
         */
        browserSync: {
            bsFiles: {
                src: [
                    'libs/gd/',
                ],
            },
            options: {
                server: './libs/gd',
                watchTask: true,
                port: 8081,
            },
        },
    });

    // General tasks.
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-google-cloud');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-svgstore');
    grunt.loadNpmTasks('grunt-contrib-sass');
    grunt.loadNpmTasks('grunt-postcss');

    // Register all tasks.
    grunt.registerTask('duration',
        'Displays the duration of the grunt task up until this point.',
        function () {
            const date = new Date(Date.now() - startTS);
            let hh = date.getUTCHours();
            let mm = date.getUTCMinutes();
            let ss = date.getSeconds();
            if (hh < 10) {
                hh = '0' + hh;
            }
            if (mm < 10) {
                mm = '0' + mm;
            }
            if (ss < 10) {
                ss = '0' + ss;
            }
            console.log('Duration: ' + hh + ':' + mm + ':' + ss);
        });
    grunt.registerTask('sourcemaps',
        'Build with sourcemaps',
        function () {
            grunt.config.set('svgstore.options.includedemo', true);
            grunt.config.set('uglify.options.sourceMap', true);
            grunt.config.set('uglify.options.sourceMapIncludeSources', true);
            grunt.config.set('postcss.options.map', {
                inline: false,
                annotation: 'libs/gd/',
            });
        });
    grunt.registerTask('default',
        'Start BrowserSync and watch for any changes so we can do live ' +
        'updates while developing.',
        function () {
            const tasksArray = [
                'copy',
                'sass',
                'postcss',
                'exec:eslint',
                'browserify',
                'concat',
                'sourcemaps',
                'uglify',
                'usebanner',
                'svgstore',
                'duration',
                'browserSync',
                'watch'];
            grunt.task.run(tasksArray);
        });
    grunt.registerTask('build',
        'Build and optimize the js.',
        function () {
            const tasksArray = [
                'clean',
                'sass',
                'postcss',
                'exec:eslint',
                'browserify',
                'concat',
                'uglify',
                'usebanner',
                'svgstore',
                'copy',
                'duration'];
            grunt.task.run(tasksArray);
        });
    grunt.registerTask('deploy',
        'Upload the build files.',
        function () {
            const project = grunt.option('project');
            const bucket = grunt.option('bucket');
            const folderIn = grunt.option('in');
            const folderOut = grunt.option('out');

            // The key is saved as a system parameter within Team City.
            // The service account key of our google cloud account for
            // uploading to storage is stringified and then encoded as
            // base64 using btoa()
            console.log(grunt.option('key'));
            let keyObj = grunt.option('key');
            let key = JSON.parse(atob(keyObj));
            console.log(key);

            if (project === undefined) {
                grunt.fail.warn('Cannot upload without a project name');
            }

            if (bucket === undefined) {
                grunt.fail.warn('OW DEAR GOD THEY ARE STEALING MAH BUCKET!');
            }

            if (key === undefined || key === null) {
                grunt.fail.warn('Cannot upload without an auth key');
            } else {
                console.log('Key loaded...');
            }

            grunt.config.merge({
                gcs: {
                    options: {
                        credentials: key,
                        project: project,
                        bucket: bucket,
                        gzip: true,
                        metadata: {
                            'surrogate-key': 'gcs',
                        },
                    },
                    dist: {
                        cwd: './libs/',
                        src: ['**/*'],
                        dest: '',
                    },
                },
            });

            console.log('Project: ' + project);
            console.log('Bucket: ' + bucket);

            if (folderIn === undefined && folderOut === undefined) {
                console.log('Deploying: ./libs/ to gs://' + bucket + '/');
            } else {
                if (folderIn !== undefined) {
                    if (folderOut === undefined) {
                        grunt.fail.warn(
                            'No use in specifying "in" without "out"');
                    }
                    console.log('Deploying: ../' + folderIn + ' to gs://' +
                        bucket + '/' + folderOut);
                    grunt.config.set('gcs.dist', {
                        cwd: '../' + folderIn, src: ['**/*'], dest: folderOut,
                    });
                } else if (folderOut !== undefined) {
                    grunt.fail.warn('No use in specifying "out" without "in"');
                }
            }

            grunt.task.run('gcs');
        });
};
