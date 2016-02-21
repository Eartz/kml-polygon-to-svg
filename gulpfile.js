const gulp = require('gulp');
const babel = require('gulp-babel');
var mocha = require('gulp-mocha');
 
var files = [
    "src/*.js"
];
gulp.task('default', () => {
    return gulp.src(files)
        .pipe(babel({
            presets: ['es2015']
        }))
        .pipe(gulp.dest('dist'));
});
gulp.task('watch', () => {
    var watcher = gulp.watch(files, ["default"]);
});
gulp.task('test', () => {
    return gulp.src('test/test.js')
        .pipe(mocha());
});
