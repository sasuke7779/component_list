'use strict';

/**
 * GulpおよびGulpプラグインの読み込み
 */
const gulp = require('gulp');
const autoprefixer = require("gulp-autoprefixer");
const cached = require('gulp-cached');
const cleanCSS = require('gulp-clean-css');
const htmlhint = require('gulp-htmlhint');
const plumber = require('gulp-plumber');
const prettier = require('gulp-prettier');
const rename = require('gulp-rename');
const replace = require('gulp-replace');
const sass = require('gulp-sass')(require('sass'));
const uglify = require('gulp-uglify');

/**
 * Gulp以外の依存パッケージの読み込み
 */
const browserSync = require('browser-sync').create();
const colors = require('ansi-colors');
const connectSSI = require('connect-ssi');
const del = require('del');
const fs = require('fs');
const log = require('fancy-log');
const path = require('path');

/**
 * Gulpタスク用の設定
 */
// 各ディレクトリパスおよびディレクトリ名
// ディレクトリのパスは、gulpfile.js(このファイル)からの相対パスで記述する
// gulpfile.jsと同じ階層にあるディレクトリのパスは、先頭に「./」をつけない
const baseDir = {
  src: 'docs', // 監視対象ディレクトリのパス
  dist: 'docs', // 出力先ディレクトリのパス
  build: 'dist', // リリース用出力先ディレクトリのパス
  js: 'js', // JavaScriptを管理するディレクトリのパス
  sass: '_sass', // SASSを管理するディレクトリのパス
  css: 'css', // CSSを出力するディレクトリ名
  img: 'img', // 画像を出力するディレクトリ名
  htmlInclude: '_include' // HTMLインクルードを管理するディレクトリのパス
};

// 監視するファイル名のパターン
const filePattern = {
  html: [
    `${baseDir.src}/**/*.html`,
    `${baseDir.src}/**/*.htm`,
    `${baseDir.src}/**/*.shtml`,
   // メールフォームプロのHTMlを監視対象から除外する場合は、下記1行のコメントアウトを解除する
   //「mailformpro」配下は監視対象から除外する ※実際のディレクトリ名に変更する
   `!${baseDir.src}/mailformpro/**/*.html`
  ],
  css: [
    `${baseDir.src}/**/${baseDir.css}/**/*.css`,
    //「mailformpro」配下は監視対象から除外する ※実際のディレクトリ名に変更する
    `!${baseDir.src}/**/mailformpro/**/*.css`,
    //「Wordpress」配下は監視対象から除外する
    `!${baseDir.src}/**/wp-*/**/*.css`
  ],
  sass: [
    `${baseDir.src}/**/${baseDir.sass}/**/*.scss`,
    //「mailformpro」配下は監視対象から除外する ※実際のディレクトリ名に変更する
    `!${baseDir.src}/**/mailformpro/**/*.scss`,
    //「Wordpress」配下は監視対象から除外する
    `!${baseDir.src}/**/wp-*/**/*.scss`
  ],
  javascript: [
    `${baseDir.src}/**/${baseDir.js}/**/*.js`,
    `!${baseDir.src}/**/${baseDir.js}/lib/**/*.js`,
    //「mailformpro」配下は監視対象から除外する ※実際のディレクトリ名に変更する
    `!${baseDir.src}/**/mailformpro/**/*.js`,
    //「Wordpress」配下は監視対象から除外する
    `!${baseDir.src}/**/wp-*/**/*.js`
  ]
};

/**
 * HTMLバリデーションをかけるタスク
 */
gulp.task('htmlv', () => {
  return gulp.src(filePattern.html)
    .pipe(htmlhint({"doctype-first": false})) // DOCTYPE宣言の有無はバリデーションから除外
    .pipe(htmlhint.reporter());
});

/**
 * SASSをコンパイルし、PostCSSで整形するタスク
 */
gulp.task('sass', () => {
  // SASSのコンパイル設定
  const sassArgs = {
    outputStyle: 'expanded',
    includePaths: ['node_modules', baseDir.src + '/**/' + baseDir.sass], // use・forwardで読み込むパスをルートに統一
    indentWidth: 4,
    indentType: 'space',
    sourceComments: true // CSSにインラインでSASSの対応行を表示する場合はtrueにする
  };

  return gulp.src(filePattern.sass, { base: baseDir.src})
    .pipe(plumber())
    // .pipe(sassGlob())
    .pipe(sass(sassArgs))
    .pipe(autoprefixer())
    .pipe(rename((path) => {
      // SASSファイルのパスのうち、baseDir.sass を baseDir.css に置換する
      path.dirname = path.dirname.replace(baseDir.sass, baseDir.css);
    }))
    .pipe(gulp.dest(baseDir.dist));
});

/**
 * JavaScriptをPrettierで整形するタスク
 */
gulp.task('javascript', () => {
  // Prettierのフォーマット設定
  const prettierArgs = {
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'none',
    bracketSpacing: true
  };

  return gulp.src(filePattern.javascript, { base: baseDir.src })
    .pipe(plumber())
    // 無限ループ回避のため、ファイルをキャッシュする(キャッシュ名はjavascript)
    .pipe(cached('javascript'))
    .pipe(prettier(prettierArgs))
    .pipe(gulp.dest(baseDir.dist));
});

/**
 * 各種ファイルを監視するタスク
 */
gulp.task('watch', gulp.series(gulp.parallel([
  'htmlv', // HTMlバリデーションを無効にする場合は、この行をコメントアウトする
  'sass', // SASSのコンパイルを無効にする場合は、この行をコメントアウトする
  'javascript' // JavaScriptの整形を無効にする場合は、この行をコメントアウトする
  // ファイル監視をはじめる前の処理は、ここに追加する
  ]),
  // ファイルを監視し、変更が検知されるたびに実行するタスク
  function watch() {
    gulp.watch(filePattern.html, gulp.series(['htmlv'])); // HTMlバリデーションを無効にする場合は、この行をコメントアウトする
    gulp.watch(filePattern.sass, gulp.series(['sass'])); // SASSのコンパイルを無効にする場合は、この行をコメントアウトする
    gulp.watch(filePattern.javascript, gulp.series(['javascript'])); // JavaScriptの整形を無効にする場合は、この行をコメントアウトする
    // ファイル変更時の処理は、ここに追加する
  })
);

/**
 * 開発時のタスク（オートリロード対応）
 */
const taskServer = (done) => {
  browserSync.init({
    server: {
      baseDir: baseDir.src,
      index: 'index.html',
      middleware: [
        connectSSI({
          ext: '.html',
          baseDir: baseDir.src
        })
      ],
    },
    port: 523 // 同じIPアドレスを複数人が使用している、または並行案件がある場合は適宜変更すること
  })
  done();
};
const taskReload = (done) => {
  browserSync.reload();
  done();
};
const taskWatch = (done) => {
  gulp.watch(filePattern.html, gulp.series(['htmlv'], taskReload)); // HTMlバリデーションを無効にする場合は、この行をコメントアウトする
  gulp.watch(filePattern.sass, gulp.series(['sass'], taskReload)); // SASSのコンパイルを無効にする場合は、この行をコメントアウトする
  gulp.watch(filePattern.javascript, gulp.series(['javascript'], taskReload)); // JavaScriptの整形を無効にする場合は、この行をコメントアウトする
  done();
}
// 実行タスク
gulp.task('dev', gulp.series(
  gulp.parallel([
  'htmlv', // HTMlバリデーションを無効にする場合は、この行をコメントアウトする
  'sass', // SASSのコンパイルを無効にする場合は、この行をコメントアウトする
  'javascript' // JavaScriptの整形を無効にする場合は、この行をコメントアウトする
  // ファイル監視をはじめる前の処理は、ここに追加する
  ]),taskWatch,taskServer));

/**
 * リリース用タスク
 */
// build用フォルダの削除
const clean = (done) => {
    del(baseDir.build);
    done();
};
// sassの除外や各種ファイルの圧縮を行いbuild用フォルダにコンパイル
const buildset = (done) => {
  setTimeout(function() { // clean後すぐに実行するとbuildフォルダが出力されなくなるため追記
    gulp.src([
      `${baseDir.src}/**/${baseDir.js}/*`,
      `!${baseDir.src}/**/${baseDir.js}/lib/*`,
    ])
    .pipe(uglify()) // lib配下を除くjsファイルの圧縮 ※不要な場合はコメントアウトする
    .pipe(gulp.dest(baseDir.build));

    gulp.src([
      `${baseDir.src}/**/${baseDir.js}/lib/*`,
    ])
    .pipe(gulp.dest(baseDir.build));

    gulp.src([
      `${baseDir.src}/**/*.html`,
      `${baseDir.src}/**/${baseDir.css}/*`,
      `${baseDir.src}/**/${baseDir.img}/*`,
    ])
    .pipe(cleanCSS()) // cssの圧縮 ※不要な場合はコメントアウトする
    .pipe(gulp.dest(baseDir.build));

    done();
  }, 100);
};
// 実行タスク
gulp.task('build', gulp.series(clean, buildset));

/**
 * defaultタスク
 * 誤作動防止のため、タスク名が指定されていない場合は、ヘルプメッセージを表示して終了する
 */
gulp.task('default', (done) => {
  log(`
    使用方法:
        gulp <タスク名>

    タスク名一覧:
        default  - (タスク名を指定しない場合) このメッセージを表示します
        watch    - HTML, SASS, JavaScript ファイルを監視してタスクを実行します
        dev      - HTML, SASS, JavaScript ファイルを監視してタスクを実行します（mamp設定不要・オートリロード対応）
        build    - リリース用のデータを作成します
  `);

  done();
});
