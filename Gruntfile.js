const sass = require('node-sass');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano')({
    reduceIdents: false,
});

/**
 * atob
 * @param {String} str
 * @return {*}
 */
function atob(str) {
    if (str) {
        return Buffer.alloc(str).toString('binary');
    }
    return null;
}

module.exports = function gruntMain (grunt) {
    const startTS = Date.now();

    grunt.initConfig({

        /**
         * This will load in our package.json file so we can have access
         * to the project name and appVersion number.
         */
        pkg: grunt.file.readJSON('package.json'),

        /**
         * ESlint.
         */
        eslint: {
            options: {
                configFile: '.eslintrc.js',
            },
            target: ['src'],
        },

        /**
         * Copies certain files over from the src folder to the build folder.
         */
        copy: {
            dist: {
                expand: true,
                flatten: true,
                cwd: './',
                src: [
                    './index.html',
                    'examples/iframe.html',
                    'examples/legacy.html',
                    'examples/publisher.html',
                    'examples/portal.html',
                    'walkthroughnotification/walkthroughnotification.html',
                    './favicon.ico',
                ],
                dest: './dist',
            },
            animations: {
                src: './src/animations/**/*',
                dest: './dist/animations',
                flatten: true,
                expand: true,
            },
            scripts: {
                src:    ['./node_modules/lottie-web/build/player/lottie.min.js'],
                dest: './dist/scripts',
                flatten: true,
                expand: true,
                // eslint-disable-next-line func-names, object-shorthand
                rename: function (dest, src) {
                    let filename;
                    if (src.charAt(0) === '.') {
                        filename = src.substring(1, src.length);
                    } else {
                        filename = src;
                    }
                    // eslint-disable-next-line prefer-template
                    return `./dist/scripts/${filename}`;
                },
            },
            fonts: {
                src: ['./src/styles/fonts/**/*'],
                dest: './dist/fonts',
                flatten: true,
                expand: true,
            },
            walkthroughnotification: {
                src: 'walkthroughnotification/walkthroughnotification.js',
                dest: 'dist/libs/gd/walkthroughnotification.js',
            },
        },

        /**
         * Replace our relative paths to absolute paths, just to be sure.
         */
        replace: {
            dist: {
                options: {
                    usePrefix: false,
                    patterns: [{
                        match: './',
                        replacement: 'https://player.tubia.com/',
                    }],
                },
                files: [{
                    expand: true,
                    flatten: true,
                    src: [
                        'examples/iframe.html',
                        'examples/legacy.html',
                        'examples/publisher.html',
                        'examples/portal.html',
                        'examples/walkthroughnotification.html',
                    ],
                    dest: './dist',
                }],
            },
        },

        /**
         * Cleans our build folder.
         */
        clean: {
            dist: {
                src: ['./dist'],
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
                    'dist/libs/gd/sprite.svg': ['src/images/*.svg'],
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
                    'dist/libs/gd/gd.js',
                    'dist/libs/gd/gd.min.js',
                    'dist/libs/gd/main.min.css',
                    'dist/libs/gd/main.min.js',
                ],
            },
        },

        /**
         * Compiles SASS stylesheets into CSS.
         */
        sass: {
            options: {
                implementation: sass,
                sourcemap: false,
            },
            build: {
                files: {
                    'dist/libs/gd/main.css': 'src/styles/plyr.scss',
                },
            },
            notify: {
                files: {
                    'dist/libs/gd/walkthroughnotification.css': 'walkthroughnotification/walkthroughnotification.scss',
                },
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
                    autoprefixer, // vendor prefixes. for more: https://github.com/ai/browserslist
                    cssnano,
                ],
            },
            build: {
                src: 'dist/libs/gd/main.css',
                dest: 'dist/libs/gd/main.min.css',
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
                            '@babel/preset-env',
                            {
                                debug: false,
                            },
                        ]],
                    },
                ]],
            },
            build: {
                src: 'src/scripts/**/*.js',
                dest: 'dist/libs/gd/main.js',
            },
            entry: {
                src: 'src/entry/entry.js',
                dest: 'dist/libs/gd/entry.js',
            },
        },

        /**
         * Add the md5 javascript library.
         */
        concat: {
            options: {
                separator: ';',
            },
            build: {
                src: [
                    'src/libraries/md5.js',
                    'dist/libs/gd/main.js',
                ],
                dest: 'dist/libs/gd/main.js',
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
                sourceMap: true,
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
            build: {
                src: 'dist/libs/gd/main.js',
                dest: 'dist/libs/gd/main.min.js',
            },
            legacy: {
                src: 'dist/libs/gd/entry.js',
                dest: 'dist/libs/gd/gd.js',
            },
            entry: {
                src: 'dist/libs/gd/entry.js',
                dest: 'dist/libs/gd/gd.min.js',
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
                files: [
                    'src/scripts/**/*.js',
                    'src/entry/**/*.js',
                    'walkthroughnotification/**/*',
                ],
                tasks: [
                    'eslint',
                    'browserify',
                    'concat',
                    'uglify',
                    'usebanner',
                    'duration',
                ],
            },
            css: {
                files: ['src/styles/**/*.scss'],
                tasks: [
                    'sass',
                    'postcss',
                    'usebanner',
                    'duration',
                ],
            },
            html: {
                files: [
                    'index.html',
                    'examples/iframe.html',
                    'examples/legacy.html',
                    'examples/publisher.html',
                    'examples/portal.html',
                    'walkthroughnotification/walkthroughnotification.html',
                ],
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
                src: ['./src/'],
            },
            options: {
                server: './dist',
                watchTask: true,
                port: 8081,
            },
        },
    });

    // General tasks.
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-google-cloud');
    grunt.loadNpmTasks('grunt-browser-sync');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-banner');
    grunt.loadNpmTasks('grunt-svgstore');
    grunt.loadNpmTasks('grunt-sass');
    grunt.loadNpmTasks('grunt-postcss');

    // Register all tasks.
    grunt.registerTask('duration',
        'Displays the duration of the grunt task up until this point.',
        () => {
            const date = new Date(Date.now() - startTS);
            let hh = date.getUTCHours();
            let mm = date.getUTCMinutes();
            let ss = date.getSeconds();
            if (hh < 10) {
                hh = `0${hh}`;
            }
            if (mm < 10) {
                mm = `0${mm}`;
            }
            if (ss < 10) {
                ss = `0${ss}`;
            }
            console.warn(`Duration: ${hh}:${mm}:${ss}`);
        });
    grunt.registerTask('sourcemaps',
        'Build with sourcemaps',
        () => {
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
        () => {
            const tasksArray = [
                'copy',
                'sass',
                'postcss',
                'eslint',
                'browserify',
                'concat',
                'sourcemaps',
                'uglify',
                'usebanner',
                'svgstore',
                'duration',
                'browserSync',
                'watch',
            ];
            grunt.task.run(tasksArray);
        });
    grunt.registerTask('build',
        'Build and optimize the js.',
        () => {
            const tasksArray = [
                'clean',
                'copy',
                'replace',
                'sass',
                'postcss',
                'eslint',
                'browserify',
                'concat',
                'uglify',
                'usebanner',
                'svgstore',
                'duration',
            ];
            grunt.task.run(tasksArray);
        });
    grunt.registerTask('deploy',
        'Upload the build files.',
        () => {
            const project = grunt.option('project');
            const bucket = grunt.option('bucket');
            const folderIn = grunt.option('in');
            const folderOut = grunt.option('out');

            // The key is saved as a system parameter within Team City.
            // The service account key of our google cloud account for
            // uploading to storage is stringified and then encoded as
            // base64 using btoa()
            console.warn(grunt.option('key'));
            const keyObj = grunt.option('key');
            const key = JSON.parse(atob(keyObj));
            console.warn(key);

            if (project === undefined) {
                grunt.fail.warn('Cannot upload without a project name');
            }

            if (bucket === undefined) {
                grunt.fail.warn('OW DEAR GOD THEY ARE STEALING MAH BUCKET!');
            }

            if (key === undefined || key === null) {
                grunt.fail.warn('Cannot upload without an auth key');
            } else {
                console.warn('Key loaded...');
            }

            grunt.config.merge({
                gcs: {
                    options: {
                        credentials: key,
                        project,
                        bucket,
                        gzip: true,
                        metadata: {
                            'surrogate-key': 'gcs',
                        },
                    },
                    dist: {
                        cwd: './dist/',
                        src: ['**/*'],
                        dest: '',
                    },
                },
            });

            console.warn('Project:', project);
            console.warn('Bucket: ', bucket);

            if (folderIn === undefined && folderOut === undefined) {
                console.warn(`Deploying: ./dist/ to gs://${bucket}/`);
            } else if (folderIn !== undefined) {
                if (folderOut === undefined) {
                    grunt.fail.warn(
                        'No use in specifying "in" without "out"');
                }
                console.warn(`Deploying: ../${folderIn} to gs:// ${bucket}/${folderOut}`);
                grunt.config.set('gcs.dist', {
                    cwd: `../${folderIn}`, src: ['**/*'], dest: folderOut,
                }); 
            } else if (folderOut !== undefined) {
                grunt.fail.warn('No use in specifying "out" without "in"');
            }

            grunt.task.run('gcs');
        });
};
