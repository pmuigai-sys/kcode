/*---------------------------------------------------------------------------------------------
 *  Copyright (c) KCode.
 *  Licensed under the MIT License. See License.txt in the project root.
 *--------------------------------------------------------------------------------------------*/

const gulp = require('gulp');
const path = require('path');
const cp = require('child_process');

const repoRoot = path.resolve(__dirname, '..');

function run(command, args = [], opts = {}) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, args, {
      cwd: repoRoot,
      stdio: 'inherit',
      shell: true,
      ...opts
    });
    child.on('exit', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} exited with code ${code}`));
      }
    });
  });
}

gulp.task('compile', () => run('yarn', ['run', 'compile:modules']));

gulp.task('watch', () => run('yarn', ['run', 'watch']));

gulp.task('package-linux', () => run('yarn', ['run', 'dist:linux']));

gulp.task('package-win', () => run('yarn', ['run', 'dist:win']));

gulp.task('package-mac', () => run('yarn', ['run', 'dist:mac']));

gulp.task(
  'package',
  gulp.series('compile', gulp.parallel('package-linux', 'package-win', 'package-mac'))
);

gulp.task('default', gulp.series('compile'));
