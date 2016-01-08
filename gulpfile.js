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


// Lint JavaScript
gulp.task("lint", function () {
    return gulp.src(["lib/**/*.js"])
        .pipe(linter({
            extends: "eslint:recommended",
            ecmaFeatures: {
                "modules": true
            },          
            envs: [
                "browser", "es6", "amd", "node"
            ]
        }))
        .pipe(linter.formatEach("compact", process.stderr))
        .pipe(linter.failAfterError());

});

// Clean output directory
gulp.task("clean", function (cb) {
    del([".tmp", "dist"], cb);
});



function compileJS(uglify) {
    var bundler = browserify("lib/othertree.js", { debug: true }).transform("babelify",{
        presets: ["es2015"],plugins:["transform-es2015-modules-commonjs"]
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


gulp.task("default", ["clean"], function (cb) {
    // Uncomment "cache-config" after "rename-index" if you are going to use service workers.
    runSequence(
        ["lint", "lint-gulpfile"],
        "compile",
        cb);
});


gulp.task("release", ["clean"], function (cb) {
    // Uncomment "cache-config" after "rename-index" if you are going to use service workers.
    runSequence(
        ["lint", "lint-gulpfile"],
        "compile",
        "compress",
        cb);
});
/*eslint-disable no-var*/
