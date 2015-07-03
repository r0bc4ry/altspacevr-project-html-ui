var del = require('del');
var gulp = require('gulp');
var mainBowerFiles = require('main-bower-files');
var gulpPlugins = require('gulp-load-plugins')();

var production = false;

// Remove previous build files from the 'dist' directory
gulp.task('clean', function() {
    del.sync([
        'dist/css',
        'dist/js'
    ], {force: true});
});

// Compile vendor JS from Bower files
gulp.task('vendor:js', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulpPlugins.filter([
            '**/*.js',
            '!**/*.min.js'
        ]))
        .pipe(gulpPlugins.concat('vendor.js'))
        .pipe(gulpPlugins.if(production, gulpPlugins.uglify()))
        .pipe(gulp.dest('dist/js'));
});

// Compile vendor CSS from Bower files
gulp.task('vendor:styles', function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulpPlugins.filter([
            '**/*.css',
            '!**/*.min.css'
        ]))
        .pipe(gulpPlugins.concat('vendor.css'))
        .pipe(gulpPlugins.if(production, gulpPlugins.minifyCss()))
        .pipe(gulp.dest('dist/css'));
});

// Build JS
gulp.task('app:js', function() {
    return gulp.src('src/js/**/*.js')
        .pipe(gulpPlugins.ngAnnotate())
        .pipe(gulpPlugins.if(!production, gulpPlugins.sourcemaps.init({loadMaps: true})))
        .pipe(gulpPlugins.concat('app.js'))
        .pipe(gulpPlugins.if(!production, gulpPlugins.sourcemaps.write()))
        .pipe(gulpPlugins.if(production, gulpPlugins.uglify()))
        .pipe(gulp.dest('dist/js'))
        .pipe(gulpPlugins.livereload());
});

// Build CSS
gulp.task('app:styles', function() {
    return gulp.src('src/sass/app.scss')
        .pipe(gulpPlugins.sass({errLogToConsole: true, includePaths: require('node-neat').includePaths}))
        .pipe(gulpPlugins.if(production, gulpPlugins.minifyCss()))
        .pipe(gulp.dest('dist/css'))
        .pipe(gulpPlugins.livereload());
});

// Build HTML
gulp.task('app:views', function() {
    return gulp.src('src/js/**/*.html')
        .pipe(gulpPlugins.if(production, gulpPlugins.minifyHtml({empty: true})))
        .pipe(gulpPlugins.angularTemplatecache({module: 'myApp.templates'}))
        .pipe(gulpPlugins.if(production, gulpPlugins.uglify()))
        .pipe(gulp.dest('dist/js'))
        .pipe(gulpPlugins.livereload());
});

// Default task
gulp.task('default', ['clean'], function() {
    gulp.start([
        'vendor:js',
        'vendor:styles',
        'app:js',
        'app:styles',
        'app:views'
    ]);
});

// Initializes watch task(s) after running default task
gulp.task('watch', ['default'], function() {
    gulp.watch('src/js/**/*.js', ['app:js']);
    gulp.watch('src/sass/**/*.scss', ['app:styles']);
    gulp.watch('src/js/**/*.html', ['app:views']);

    gulpPlugins.livereload.listen();
});

gulp.task('build', function() {
    production = true;
    gulp.start('default');
});
