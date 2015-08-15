var gulp = require('gulp'),
  // extra input formats we want to support, to let
  // people add comments and drop extra gunk from stylesheets.
  json5 = require('gulp-json5'),
  yaml = require('gulp-yaml'),
  toml = require('gulp-toml'),
  connect = require('gulp-connect');

var path = require('path'),
  minimist = require('minimist');

var options = minimist(process.argv.slice(2), {
  string: 'style',
  default: { style: 'style.json' }
});

gulp.task('connect', function() {
  connect.server({
    root: 'app',
    livereload: true
  });
});

gulp.task('html', function() {
  gulp.src(['./app/*.html', options.style])
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch(['./app/*.html', options.style],
    ['compile', 'html']);
});

gulp.task('compile', function() {
  switch (path.extname(options.style)) {
    case '.json5':
      return gulp.src(options.style)
        .pipe(json5())
        .pipe(gulp.dest('app'));
    case '.yaml':
    case '.yml':
      return gulp.src(options.style)
        .pipe(yaml({ space: 4 }))
        .pipe(gulp.dest('app'));
    case '.toml':
      return gulp.src(options.style)
        .pipe(toml())
        .pipe(gulp.dest('app'));
    case '.json':
    default:
      return gulp.src(options.style)
        .pipe(gulp.dest('app'));
  }
});

gulp.task('default', ['connect', 'watch', 'compile']);