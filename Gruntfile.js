/* global module: false */
module.exports = function(grunt) {
  "use strict";

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    jshint: {
      files: ['Gruntfile.js', 'src/js/**/*.js'],
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
        src: 'src/js/**/*.js',
        dest: 'build/pen.min.js'
      }
    },

    sass: {
      dist: {
        options: {
          noCache: true
        },
        files: {
          'build/pen.css': 'src/sass/pen.scss'
        }
      }
    },

    copy: {
      main: {
        flatten: true,
        expand: true,
        filter: 'isFile',
        src: 'src/font/*',
        dest: 'build/font/',
      },
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint', 'uglify', 'sass', 'copy']
    }
  });

  // Plugins
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-sass');
  grunt.loadNpmTasks('grunt-contrib-copy');

  // Default task(s).
  grunt.registerTask('default', ['jshint', 'uglify', 'sass', 'copy']);

};
