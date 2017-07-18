const gulp = require('gulp');
const glob = require('glob');
const gulpLoadPlugins = require('gulp-load-plugins');
const browserify = require('browserify');
const watchify = require('watchify');
const runSequence = require('run-sequence');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

let isWatchify = false;
const $ = gulpLoadPlugins();
const bundles = [
  {
      entries: ['./app/*.js'],
      output: 'app.min.js',
      extensions: ['.js'],
      destination: './dist'
  }, {
      entries: ['./components/*.js'],
      output: 'components.min.js',
      extensions: ['.js', '.json'],
      destination: './dist'
  }
];


/**
 * Tasks for JS
 */

// browserify with babelify the JS code, and watchify
const createBundle = options => {
    const opts = Object.assign({}, watchify.args, {
        // browserify does not support wildcards in paths, use glob
        entries: options.entries.reduce((r, entry) => r.concat(glob.sync(entry)), []),
        extensions: options.extensions,
        debug: true
    });

    let b = browserify(opts);
    b.transform(babelify.configure({
        compact: false,
        plugins: ['transform-es2015-modules-commonjs']
    }));

    try {

        const rebundle = () =>
            b.bundle()
            // log errors if they happen
            .on('error', $.util.log.bind($.util, 'Browserify Error'))
            .pipe(source(options.output))
            .pipe(buffer())
            .pipe($.sourcemaps.init({ loadMaps: true }))
            //.pipe($.uglify())
            .pipe($.sourcemaps.write('../maps'))
            .pipe(gulp.dest(options.destination));

        if (isWatchify) {
            b = watchify(b);
            b.on('update', rebundle);
            b.on('log', $.util.log);
        }

        return rebundle();
    } catch (e) {
        console.error(e);
    }
};

gulp.task('scripts', ['scripts:lint'], () =>
    bundles.forEach( bundle =>
        createBundle({
            entries: bundle.entries,
            output: bundle.output,
            extensions: bundle.extensions,
            destination: bundle.destination
        })
    )
);

// Lint JavaScript
gulp.task('scripts:lint', () => {
    //bundles.forEach(bundle => {
    //  gulp.src(bundle.entries)
    //      .pipe($.eslint())
    //      .pipe($.eslint.format())
    //})
});


/**
 * Watch files for changes with watchify
 */

gulp.task('watch', () => {
    isWatchify = true;
    runSequence(['scripts']);
});