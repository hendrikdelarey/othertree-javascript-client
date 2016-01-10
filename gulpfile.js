/*eslint-disable no-var*/
/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Include Gulp & tools we"ll use
var gulp = require("gulp");
var $ = require("gulp-load-plugins")();
var del = require("del");
var runSequence = require("run-sequence");
var linter = require("gulp-eslint");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");
var browserify = require("browserify");
var debowerify = require("debowerify");
var browserSync = require("browser-sync");
var reload = browserSync.reload;
// var merge = require("merge-stream");

var DIST = "test/lib";

var dist = function (subpath) {
    return !subpath ? DIST : path.join(DIST, subpath);
};

gulp.task("lint-gulpfile", function () {
    return gulp.src(["gulpfile.js"])
        .pipe(linter({
            extends: "eslint:recommended",
            ecmaFeatures: {
                "modules": true
            },
            rules: {
            },
            globals: {
                "jQuery": false,
                "$": true
            },
            envs: [
                "browser", "amd", "node"
            ]
        }))
        .pipe(linter.formatEach("compact", process.stderr))
        .pipe(linter.failAfterError());
});


function lint(src,globals) {
    src.pipe(linter({
        extends: "eslint:recommended",
        ecmaFeatures: {
            "modules": true
        },
        envs: [
            "browser", "es6", "amd"
        ],
        globals:globals
    }))
        .pipe(linter.formatEach("compact", process.stderr))
        .pipe(linter.failAfterError());
}


// Lint JavaScript
gulp.task("lint", function () {
    return lint(gulp.src(["lib/**/*.js"]),{});
});

// Clean output directory
gulp.task("clean", function (cb) {
    del([".tmp", "dist"], cb);
});



function compileJS(uglify) {
    var bundler = browserify("lib/othertree.js", { debug: true, standalone: "OtherTree" }).transform("babelify", {
        presets: ["es2015"]
        , plugins: ["transform-es2015-modules-commonjs"]
    }).transform(debowerify);

    var compileStream = bundler.bundle()
        .on("error", $.util.log)
        .pipe(source("lib/othertree.js"))
        .pipe(buffer())
        .pipe($.sourcemaps.init({ loadMaps: true }));


    if (uglify) {
        compileStream = compileStream.pipe($.uglify())
            .pipe($.rename({ dirname: "/", suffix: ".min" }));
    }
    else {
        compileStream = compileStream.pipe($.rename({ dirname: "/" }));
    }

    return compileStream;
}



gulp.task("compile", function () {
    return compileJS(true).pipe($.sourcemaps.write("./")).pipe(gulp.dest("dist"));
});



gulp.task("compress", function () {
    return compileJS(true).pipe($.gzip({ append: true })).pipe(gulp.dest("dist"));
});


gulp.task("default", function (cb) {
    // Uncomment "cache-config" after "rename-index" if you are going to use service workers.
    runSequence(
        ["lint", "lint-gulpfile"],
        "compile",
        cb);
});


gulp.task("release", ["clean"], function (cb) {

    runSequence(
        ["lint", "lint-gulpfile"],
        "compile",
        "compress",
        cb);
});


gulp.task("copy-lib", function () {
    return gulp.src(["./dist/**/*"]).pipe(gulp.dest(dist("")));
});

gulp.task("test-lib-setup",function(cb){
    runSequence(["copy-lib"],cb);
});

    

// Watch files for changes & reload
gulp.task("serve:test", ["test-lib-setup"], function () {    
    browserSync({
        port: 5000,
        notify: true,
        logPrefix: "PSK",
        snippetOptions: {
            rule: {
                match: "<span id=\"browser-sync-binding\"></span>",
                fn: function (snippet) {
                    return snippet;
                }
            }
        },
        // Run as an https by uncommenting 'https: true'
        // Note: this uses an unsigned certificate which on first access
        //       will present a certificate warning in the browser.
        // https: true,
        server: {
            baseDir: ["test"]            
        }              
    });
    gulp.watch(["test/**/*"], reload);
    gulp.watch(["dist/**/*"], "test-lib-setup",reload);
    
    
});