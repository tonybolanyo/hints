var browserSync = require("browser-sync").create();
var gulp = require("gulp");
var gutil = require("gulp-util");
var rename = require("gulp-rename");
var size = require("gulp-size");
var sourcemaps = require("gulp-sourcemaps");
var template = require("gulp-template");

// define dist route
var distFolder = process.env.BUTACA57_DIST_BASE_URL || "./dist";

// For JSON Server
var jsonServer = require("gulp-json-srv");
var server = jsonServer.create({
    port: 3003,
    baseUrl: "/api",
    static: distFolder
});

// for html
var htmlmin = require("gulp-htmlmin");
var twig = require("gulp-twig");

// for css
var autoprefixer = require("autoprefixer");
var cssnano = require("cssnano");
var postcss = require("gulp-postcss");
var postscss = require("postcss-scss");
var purifycss = require("gulp-purifycss");
var sass = require("gulp-sass");
var stylelint = require('stylelint');

// for images
var imagemin = require("gulp-imagemin");

// font icon
var iconfont = require('gulp-iconfont');
var iconfontCss = require("gulp-iconfont-css");
var runTimestamp = Math.round(Date.now() / 1000);

// for JavaScript
var browserify = require("browserify");
var buffer = require("gulp-buffer");
var tap = require("gulp-tap");
var uglify = require("gulp-uglify");

console.log("Output folder:", distFolder);

gulp.task("default", ["html", "build", "server"], function() {
    browserSync.init({
        proxy: "http://127.0.0.1:3003/"
    });

    // watch html files to reload browser
    gulp.watch(["src/*.html", "src/**/*.html"], ["html"]);

    // watch styles folder to compile sass files
    gulp.watch(["src/styles/*.scss", "src/styles/**/*.scss"], ["sass"]);

    // watch javascript folder to compile script files
    gulp.watch(["src/js/*.js", "src/js/**/*.js"], ["js"]);
});

gulp.task("build", ["fonticon", "sass", "images", "js"]);

gulp.task("server", function () {
    return gulp.src("db.json")
        .pipe(server.pipe());
});

// compile html files
gulp.task("html", function () {
    gulp.src("src/*.html")
        // process template
        .pipe(twig())
        // minimize html files
        .pipe(htmlmin({
            collapseWhitespace: true
        }))
        // copy to dist folder
        .pipe(gulp.dest(distFolder))
        /// and reload browsers
        .pipe(browserSync.stream());
});

// compile css styles from sass files
gulp.task("sass", ["sass:lint"], function () {
    var plugins = [
        // add prefixes to old browsers compatibility
        autoprefixer(),
        // compress compiled css
        cssnano()
    ];
    gulp.src("src/styles/*.scss")
        // capture sourcemaps
        .pipe(sourcemaps.init())
        // compile sass
        .pipe(sass().on("error", sass.logError))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        //.pipe(purifycss(["src/js/*.js", "src/js/**/*.js", "src/*.html", "src/components/*.html", "src/layouts/*.html", "src/includes/*.html"]))
        .pipe(postcss(plugins, { syntax: postscss }))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        // save sourcemaps in css folder
        .pipe(sourcemaps.write("./"))
        // copy to dist folder
        .pipe(gulp.dest(distFolder + "/css/"))
        // and reload browsers
        .pipe(browserSync.stream());
});

// lint scss styles
gulp.task("sass:lint", function () {
    gulp.src(["src/styles/*.scss", "src/styles/**/*.scss", "!src/styles/components/_icons.scss"])
        .pipe(postcss([
            // lint style files
            stylelint()
        ]))
});

// images
gulp.task("images", function() {
    gulp.src(["src/images/*", "src/images/**/*"])
        .pipe(imagemin())
        .pipe(gulp.dest(distFolder + "/img/"));
});

// font icon
gulp.task("fonticon", function () {
    const fontName = "butaca57";

    gulp.src(["src/icons/*.svg"], {base: "src"})
        .pipe(iconfontCss({
            fontName: fontName,
            cssClass: "b57",
            path: "css",
            targetPath: "../../src/styles/components/_icons.scss",
            fontPath: "../fonts/"
        }))
        .pipe(iconfont({
            fontName: fontName,
            prependUnicode: true,
            formats: ["ttf", "eot", "woff", "svg", "woff2"],
            timestamp: runTimestamp,
            normalize: true,
            fontHeight: 1001
        }))
        .on("glyphs", function (glyphs, options) {
            console.log(glyphs);
        })
        .pipe(gulp.dest(distFolder + "/fonts/"));
});

// Generate config file
gulp.task('config', function() {
    return gulp.src('src/js/config.tmpl.js')
        .pipe(template({
            config: JSON.stringify({
                ApiBaseUrl: process.env.BUTACA57_API_BASE_URL || 'http://localhost:8000/api/1.0'
            })
        }))
        .pipe(rename('config.js'))
        .pipe(gulp.dest('src/js/'));
  });

// compile and generate only one js file
gulp.task("js", ["config"], function () {
    gulp.src("src/js/main.js")
        // tap allows to apply a function to every file
        .pipe(tap(function (file) {
            // replace content file with browserify result
            file.contents = browserify(file.path, {
                    debug: true
                }) // new browserify instance
                .transform("babelify", {
                    presets: ["env"]
                }) // ES6 -> ES5
                .bundle() // compile
                .on("error", gutil.log) // treat errors
        }))
        // back file to gulp buffer to apply next pipe
        .pipe(buffer())
        .on("finish", () => gutil.log('Original size:'))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        .pipe(sourcemaps.init({
            loadMaps: true
        }))
        // minimize and ofuscate JavaScript file
        .pipe(uglify())
        .on("finish", () => gutil.log('Size after uglify:'))
        .pipe(size({
            showFiles: true
        }))
        .pipe(size({
            gzip: true,
            showFiles: true
        }))
        // write sourcemap o same directory
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest(distFolder + "/js/"))
        // and reload browsers
        .pipe(browserSync.stream())
});