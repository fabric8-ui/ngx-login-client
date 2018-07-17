
const gulp = require('gulp'),
  changed = require('gulp-changed'),
  del = require('del'),
  ngc = require('gulp-ngc'),
  path = require('path'),
  replace = require('gulp-string-replace'),
  runSequence = require('run-sequence'),
  sourcemaps = require('gulp-sourcemaps'),
  util = require('gulp-util');

const appSrc = 'src';
const libraryDist = 'dist';
const watchDist = 'dist-watch';
const globalExcludes = [ '!./**/examples/**', '!./**/examples' ];

/**
 * FUNCTION LIBRARY
 */

function copyToDist(srcArr) {
  return gulp.src(srcArr.concat(globalExcludes))
    .pipe(gulp.dest(function (file) {
      return libraryDist + file.base.slice(__dirname.length); // save directly to dist
    }));
}

function updateWatchDist() {
  return gulp
    .src([libraryDist + '/**'].concat(globalExcludes))
    .pipe(changed(watchDist))
    .pipe(gulp.dest(watchDist));
}

/**
 * TASKS
 */

// Put the LESS files back to normal
gulp.task('build-library',
  [
    'transpile',
    'post-transpile',
    'copy-static-assets'
  ]);

gulp.task('transpile', function () {
  // Stick with v0.2.1 due to "function calls are not supported in decorators" issue
  // See: https://github.com/angular/angular/issues/23609
  // See: https://github.com/dherges/ng-packagr/issues/727

  // Change for v0.3.0 https://github.com/filipesilva/angular-quickstart-lib/issues/61
  // return ngc(['--project', 'tsconfig.json']);
  return ngc('tsconfig.json')
});

// require transpile to finish before the build starts the post-transpile task
gulp.task('post-transpile', ['transpile'], function () {
  return gulp.src(['dist/src/app/**/*.js'])
    .pipe(replace(/templateUrl:\s/g, "template: require("))
    .pipe(gulp.dest(function (file) {
      return file.base; // because of Angular's encapsulation, it's natural to save the css where the less-file was
    }));
});

gulp.task('copy-static-assets', function () {
  return gulp.src([
    'LICENSE',
    'README.adoc',
    'package.json',
  ])
    .pipe(gulp.dest(libraryDist));
});

gulp.task('copy-watch', ['post-transpile'], function() {
  return updateWatchDist();
});

gulp.task('copy-watch-all', ['build-library'], function() {
  return updateWatchDist();
});

gulp.task('watch', ['build-library', 'copy-watch-all'], function () {
  gulp.watch([appSrc + '/app/**/*.ts', '!' + appSrc + '/app/**/*.spec.ts'], ['transpile', 'post-transpile', 'copy-watch']).on('change', function (e) {
    util.log(util.colors.cyan(e.path) + ' has been changed. Compiling.');
  });
  util.log('Now run');
  util.log('');
  util.log(util.colors.red('    npm link', path.resolve(watchDist), ' --production'));
  util.log('');
  util.log('in the npm module you want to link this one to');
});
