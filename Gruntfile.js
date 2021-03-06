module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON("package.json"),
    paths: {
      src: {
        js: "src/**",
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
            dest: "src/js/vendor"
          },
          {
            expand: true,
            cwd: "node_modules/dragula/dist",
            src: "dragula.js",
            dest: "src/js/vendor"
          }
        ]
      },
      assets: {
        files: [
          {
            src: "index.html",
            dest: "public/",
            expand: true
          },
          {
            cwd: 'assets/img',
            src: '*',
            dest: 'public/img',
            expand: true
          }
        ]
      }
    },
    concat: {
      dist: {
        src: [
          "<%= paths.src.js %>/jquery.slim.min.js",
          "<%= paths.src.js %>/dragula.js",
          "<%= paths.src.js %>/kygotchi.animation.js",
          "<%= paths.src.js %>/kygotchi.state-machine.js",
          "<%= paths.src.js %>/kygotchi.js",
          "<%= paths.src.js %>/index.js"
        ],
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
        sourceMap: false,
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
            './node_modules/normalize-scss/sass/',
            './node_modules/dragula/dist/'
          ]
      },
      dist: {
          files: {
              'public/css/main.css': 'src/sass/main.scss'
          }
      }
    },
    postcss: {
      options: {
        map: false, // inline sourcemaps

        processors: [
          require('autoprefixer')({browsers: 'last 2 versions'}), // add vendor prefixes
        ]
      },
      dist: {
        src: 'public/css/main.css'
      }
    }
  });

  grunt.loadNpmTasks("grunt-sass");
  grunt.loadNpmTasks("grunt-contrib-watch");
  grunt.loadNpmTasks("grunt-contrib-copy");
  grunt.loadNpmTasks("grunt-contrib-concat");
  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-postcss");


  // Default task(s)
  grunt.registerTask("default", ["copy", "sass", "concat", "uglify", "postcss"]);

};