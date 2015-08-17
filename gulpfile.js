var gulp = require('gulp'),
  // extra input formats we want to support, to let
  // people add comments and drop extra gunk from stylesheets.
  json5 = require('gulp-json5'),
  yaml = require('gulp-yaml'),
  toml = require('gulp-toml'),
  through2 = require('through2'),
  exec = require('gulp-exec'),
  rename = require('gulp-rename'),
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
    case '.js':
      return gulp.src(options.style)
        .pipe(exec('<%= file.path %>', { pipeStdout: true, continueOnError: true }))
        .pipe(through2.obj(function(file, enc, cb) {
          if (!file.exec.stdout && file.exec.stderr) {
            file.contents = new Buffer(JSON.stringify({ error: file.exec.stderr }));
          }
          cb(null, file);
        }))
        .pipe(rename({ basename: 'style', extname: '.json' }))
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
