/* ==========================================================
[ 目次 ]

<body>クラス設定
スムース スクロール

========================================================== */

/* ---------------------------------------------
*   <body>クラス設定
--------------------------------------------- */
/**
 * <body>要素に、ユーザーのOS・デバイスとブラウザ等に関数情報をクラスとして付与する
 * OS・デバイス: iphone, ipad, android, androidphone, androidtablet, windows, mac
 * ブラウザ: ie, edge, chrome, firefox, safari
 */
$(function () {
    'use strict';

    $('body').addClass(function () {
        const ua = window.navigator.userAgent.toLowerCase();
        let bodyClasses = '';

        // プラットフォーム判定
        if (is.ios()) {
            if (is.iphone()) {
                bodyClasses += ' iphone';
            } else if (is.ipad()) {
                bodyClasses += ' ipad';
            }
        } else if (ua.indexOf('macintosh') > -1 && 'ontouchend' in document) {
            bodyClasses += ' ipad';
        } else if (is.android()) {
            bodyClasses += ' android';

            if (is.androidPhone()) {
                bodyClasses += ' androidphone';
            } else if (is.androidTablet()) {
                bodyClasses += ' androidtablet';
            }
        } else if (is.windows()) {
            bodyClasses += ' windows';
        } else if (is.mac()) {
            bodyClasses += ' mac';
        }

        // ブラウザ判定
        if (is.ie()) {
            bodyClasses += ' ie';

            if (is.ie(11)) {
                bodyClasses += ' ie11';
            }
        } else if (is.edge() || ua.indexOf('edg') > -1) {
            bodyClasses += ' edge';
        } else if (is.chrome() || ua.indexOf('crios') > -1) {
            bodyClasses += ' chrome';
        } else if (is.firefox()) {
            bodyClasses += ' firefox';
        } else if (is.safari()) {
            bodyClasses += ' safari';
        }

        return bodyClasses;
    });
});

/* ---------------------------------------------
*   スムース スクロール
--------------------------------------------- */
$(function () {
    'use strict';

    $('a[href^="#"]').on('click.smoothScroll', function () {
        const href = $(this).attr('href'),
            $target = $(href === '#' ? 'html' : href);

        if (!$target.length) return;

        let offset = 0; // スクロール位置をずらす場合は、条件分岐等を行う

        const position = $target.offset().top + offset;
        $('html, body').animate({ scrollTop: position }, 400, 'swing');

        return false;
    });
});
