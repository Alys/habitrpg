import gulp from 'gulp';
import nodemon from 'gulp-nodemon';

import pkg from '../package.json';

gulp.task('nodemon', done => {
  nodemon({
    script: pkg.main,
    ignore: ['node_modules/**', 'website/client/**', 'test/**', '.git/**', '.idea*', '*.log', '*.swp', '*.swx', 'website/raw_sprites/**', 'apidoc_build/**', 'migrations/**', 'webpack/**', 'website/common/locales/**', 'website/static/audio/**', 'website/static/presskit/**', 'website/**'],
    ext: 'yaml',
    watch: ['database_reports/**'],
  });
  done();
});
