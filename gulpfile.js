/*
Copyright (c) 2015 The Polymer Project Authors. All rights reserved.
This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
Code distributed by Google as part of the polymer project is also
subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
*/

// Include Gulp & tools we'll use
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var uglify = require('gulp-uglify');
var merge = require('merge-stream');
var babel = require('gulp-babel');
var linter = require('gulp-eslint');

gulp.task('lint-gulpfile',function () {
    return gulp.src(['gulpfile.js'])
                .pipe(linter({
                        extends: 'eslint:recommended',
                        ecmaFeatures: {
                            'modules': true
                        },                        
                        rules: {                          
                            'no-console':1                              
                        },
                        globals: {
                            'jQuery':false,
                            '$':true                                                           
                        },
                        envs: [
                            'browser','amd','node'
                        ]
              }))
              .pipe(linter.formatEach('compact', process.stderr))
              .pipe(linter.failAfterError());    
});


// Lint JavaScript
gulp.task('lint', function () {
    return gulp.src(['lib/**/*.js','gulpfile.js'])
                .pipe(linter({
                        extends: 'eslint:recommended',
                        ecmaFeatures: {
                            'modules': true
                        },                        
                        rules: {                          
                            'no-console':1,  
                            'strict': [2, "global"]
                        },
                        globals: {
                            'jQuery':false,
                            '$':true                                                                                 
                        },
                        envs: [
                            'browser','es6','amd','node'
                        ]
              }))
              .pipe(linter.formatEach('compact', process.stderr))
              .pipe(linter.failAfterError());
    
});

gulp.task('compile', function () {
  return gulp.src('lib/**/*.js')
    .pipe(babel({
        presets: ['es2015']
    }))
    .pipe(gulp.dest('dist'));
});



// Copy all files at the root level (app)
gulp.task('minify', ['compile'],function () {
  var app = gulp.src(['dist/**/*.js','!dist/**/*.min.js','!dist/bower_components/**'])
    .pipe(uglify())
    .pipe($.rename( { suffix: '.min' }))
    .pipe(gulp.dest('dist'));

  var bower = gulp.src([
    'bower_components/**/*'
  ]).pipe(gulp.dest('dist/bower_components'));
    
  return merge(app, bower)
    .pipe($.size({title: 'minify'}));
});



// Clean output directory
gulp.task('clean', function (cb) {
  del(['.tmp', 'dist'], cb);
});

gulp.task('default', ['clean'], function (cb) {
  // Uncomment 'cache-config' after 'rename-index' if you are going to use service workers.
  runSequence(
    ['lint','lint-gulpfile'],            
    'minify',    
    cb);
});
