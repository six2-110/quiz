import quizes from './quiz.json' assert {type: 'json'}
let settings = {};
let quiz_group;

function what_quiz_group() {
    // urlのクエリー文字列から設定を取得
    var search = window.location.search.split('?').pop().split('&');
    search.forEach(equ => {
        var foo = equ.split('=')
        settings[foo[0]] = foo[1];
    });
    quiz_group = quizes.find((g) => g.group_id == settings['group_id']) // 今回のクイズのグループを取得
}

window.onload = () => {
    what_quiz_group();
    console.log(settings, quiz_group)
}
