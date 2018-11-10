'use strict';

const gulp = require('gulp'),
    browserSync = require("browser-sync"),
    htmlInjector = require("bs-html-injector"),
    runSequence = require('run-sequence'),
    regen = require('../'),
    del = require('del');

// Start browserSync server
gulp.task('browserSync', function () {
    var settings = {
        server: {
            baseDir: 'app'
        },
    };
    // we don't want to open the browser-sync server
    // amok will open a browser through chrome's remote debugger
    settings.open = false;
    browserSync.use(htmlInjector);
    return browserSync(settings);
});

var onError = function(error) {
    const logError =  regen.logError.bind(this);
    logError(error);
    browserSync.notify(error.message);
};

gulp.task('regen', function () {
    return gulp.src('app/*.html') // Gets all files ending with .html in app/ and children dirs
        .pipe(regen().on('error', onError)) // Passes it through a regen, log errors to console
        .pipe(gulp.dest('app/css'))
        .pipe(browserSync.stream()); // Outputs it in the css folder
});

gulp.task('html-reload', ['regen'], function (done) {
    htmlInjector();
    done();
});

// Watchers
gulp.task('watch', function () {
    gulp.watch('app/*.html', ['regen', htmlInjector]);
})

gulp.task('default', function (callback) {
    runSequence(['regen', 'browserSync'], 'watch',
        callback
    )
})