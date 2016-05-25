module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    paths: {
      src: {
        js: "src/**/*.js",
      },
      dest: {
        js: "public/js/built.js",
        minJs: "public/js/built.min.js",
      }
    },
    copy: {
      js: {
        files: [
          {
            expand: true,
            cwd: "node_modules/jquery/dist",
            src: "jquery.slim.min.js",
            dest: "public/js/vendor"
          }
        ]
      }
    },
    concat: {
      dist: {
        src: "<%= paths.src.js %>",
        dest: "<%= paths.dest.js %>",
      }
    },
    watch: {
      scripts: {
        files: ['src/js/**/*.js'],
        tasks: ['concat', 'uglify']
      },
      sass: {
        files: ['src/sass/**/*.scss'],
        tasks: ['sass']
      }
    },
    uglify: {
      options: {
        mangle: true,
        screwIE8: true,
        sourceMap: true,
        compress: true
      },
      build: {
        src: "public/js/built.js",
        dest: "public/js/built.min.js"
      }
    },
    sass: {
      options: {
          outputStyle: 'compressed',
          includePaths: [
            './node_modules/normalize-scss/sass/'
          ]
      },
      dist: {
          files: {
              'public/css/main.css': 'src/sass/main.scss'
          }
      }
    }
  });

  grunt.loadNpmTasks("grunt-sass");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");


  // Default task(s)
  grunt.registerTask("default", ["copy", "sass", "concat", "uglify"]);

};