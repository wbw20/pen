/* global module: false */
module.exports = function(grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/**/*.js'],
      options: {
        globals: { 'console': false },
        bitwise: true,
        camelcase: false,
        curly: false,
        eqeqeq: true,
        forin: true,
        immed: true,
        indent: 2,
        latedef: true,
        laxcomma: true,
        newcap: true,
        noarg: true,
        nonew: true,
        noempty: true,
        undef: true,
        unused: true,
        strict: false,
        trailing: true,
        maxlen: 200,
        browser: true
      }
    },

    uglify: {
      build: {
        src: 'src/**/*.js',
        dest: 'build/pen-<%= pkg.version %>.min.js'
      },
    },

    concat: {
      /* 1.  build source into pen.js */
      pen: {
        src: ['src/pen.js', 'src/js/**/*'],
        dest: 'build/temp/pen.js',
        options: {
          banner: '(function(doc) {',
          footer: '} (document));'
        }
      },
      /* 2.  build dependencies into vendor.js */
      vendor: {
        src: ['bower_components/underscore/underscore.js', 'bower_components/jquery/dist/jquery.js'],
        dest: 'build/temp/vendor.js',
      },
      /* 3.  concat pen.js and vendor into a single file */
      build: {
        src: ['build/temp/vendor.js', 'build/temp/pen.js'],
        dest: 'build/pen.js'
      },
      css: {
        src: 'src/css/**/*',
        dest: 'build/pen.css'
      }
    },

    /* 4.  remove build/temp */
    clean: ['build/temp'],

    watch: {
      files: ['src/**/*.js', 'bower_components'],
      tasks: ['default']
    }
  });

  // Plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['concat:css', 'concat:pen', 'concat:vendor', 'concat:build', 'clean']);
};
