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
      build: {
        src: ['bower_components/underscore/underscore.js', 'bower_components/jquery/dist/jquery.js', 'src/**/*.js'],
        dest: 'build/pen.js',
      },
    },

    watch: {
      files: ['src/**/*.js', 'bower_components'],
      tasks: ['concat']
    }
  });

  // Plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-watch');

  // Default task(s).
  grunt.registerTask('default', ['concat']);
};
