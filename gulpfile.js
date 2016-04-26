var gulp = require('gulp')
var babel = require('gulp-babel')
var newer = require('gulp-newer')
var plumber = require('gulp-plumber')
var watch = require('gulp-watch')
var through = require('through2')
var log = require('gulp-util').log
var colors = require('gulp-util').colors
var relative = require('path').relative

var src = 'src/**/*.js'
var dest = 'lib/'

gulp.task('default', ['build'])

gulp.task('build', function () {
  return gulp.src(src)
    .pipe(plumber())
    .pipe(newer(dest))
    .pipe(through.obj(function (file, enc, cb) {
      const path = relative(__dirname, file.path)
      log('Compiling \'' + colors.cyan(path) + '\'...')
      cb(null, file)
    }))
    .pipe(babel())
    .pipe(gulp.dest(dest))
})

gulp.task('watch', ['build'], function (cb) {
  watch(src, function () {
    gulp.start('build')
  })
})
