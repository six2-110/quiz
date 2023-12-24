// 変数宣言
const $doc = document;
const Scene = {
    playing: 'playing',
    result: 'result'
}
let scene = Scene.playing;
let settings = {};
let now_quiz_num = -1; // 順番通りに始めるとき用に初期値-1
let quizzes_finished_already = [];
let now_quiz = {};
let score = { // 得点状況
    num_quiz: 0,
    num_corr: 0,
    num_wrong: 0
}
let resolveBtnClick = null;
let json, quiz_group, quizzes;

// htmlの要素を取得を簡単にする
function $(elm) {
    switch (elm[0]) {
        case '#':
            return $doc.getElementById(elm.replace('#', '')); // id
        case '.':
            return $doc.getElementsByClassName(elm.replace('.', '')); // class
        default:
            return $doc.getElementsByTagName(elm); // tag
    }
}

// quiz.json を読み込む
async function read_json() {
    var requestURL = "quiz.json"; // 読み込むurl
    var request = new Request(requestURL);
    var response = await fetch(request);
    var jsonTxt = await response.text();
    
    json = JSON.parse(jsonTxt); // 代入
}

// 今回のクイズのグループを取得
function what_quiz_group() {
    // urlのクエリー文字列から設定を取得
    var search = window.location.search.split('?').pop().split('&');
    // 等式の抜き出し
    search.forEach(equ => {
        var foo = equ.split('=');
        settings[foo[0]] = foo[1];
    });
    // 今回のクイズのグループを取得
    quiz_group = json.find((g) => g.Gid == settings['Gid']); // 今回のクイズ群を取得
    quizzes = quiz_group.quizzes; // クイズだけを抜き出し
}

// 次のクイズを選ぶ
function select_q() {
    // (初めて実行されたものでなければ)終わったものにカウントする
    if (now_quiz_num != -1) { // 最初(の問題すら選ばれていない状態)じゃなければ
        quizzes_finished_already.push(now_quiz_num);
    }

    // 問題の出し方の場合分け
    switch (settings.order) {
        case 'in_order':
            // 順番通り
            if (now_quiz_num < quizzes.length - 1) {
                now_quiz_num++;
            } else {
                end(); // 問題をすべて出したので終了させる
            }
            break;

        case 'random':
            // ランダム
            if (quizzes_finished_already.length < quizzes.length) {
                // すでに出た問題を避けるようにランダムな数字を出す
                function random() {
                    var foo = Math.floor(Math.random() * quizzes.length); // ランダムに問題番号を選ぶ
                    if (quizzes_finished_already.includes(foo)) { // すでに出されていたのなら
                        return random(); // もう一回選出する
                    } else {
                        return foo;
                    }
                }
                
                now_quiz_num = random();
            } else {
                end(); // 問題をすべて出したので終了させる
            }
            break;

        case 'endless':
            // エンドレス
            now_quiz_num = Math.floor(Math.random() * quizzes.length); // 完全ランダム
            break;
    }
    
    now_quiz = quizzes[now_quiz_num]; // now_quiz_num からクイズを取得
    console.log(now_quiz_num, now_quiz)
}

// 出題の処理
function set_q() {
    select_q(); // 次の問題を選ぶ
    var ques = quizzes[now_quiz_num] // 出す問題を取得
    $('#question').innerHTML = ques.txt; // 問題を表示する
}

// クイズを終わらせる処理
function end() {
    scene = Scene.result; // sceneをresult(結果表示)にする
    alert('finish!');
}

// 正誤判定
async function is_answer_collect() {
    var ps_ans = $('#answer').value; // プレイヤーの回答
    var corr_ans = now_quiz.ans; // 正答

    if (now_quiz.corr_deci == 'auto') {
        // 正誤判定方法がauto(自動)な場合
        if (corr_ans.includes(ps_ans)) { // 正答の中にプレイヤーの回答がある場合
            return true; // 正解
        } else { // ない場合
            return false; // 不正解
        }

    } else if (now_quiz.corr_deci == 'self') {
        // 正誤判定方法がself(自分で確かめる場合)
        $('#prepared_ans').innerHTML = now_quiz.ans.join(', '); // 準備されていた答えを表示する
        $('#answer').disabled = 'disabled'; // 回答入力欄を変更できないようにする
        $('#self_judge').style.display = 'block'; // 正解と正答・誤答ボタンを表示する

        var corr_btn = $('#true_btn'); // 正答ボタン
        var wrong_btn = $('#false_btn'); // 誤答ボタン
        const result = await wait_selfJudgeBtnClick(corr_btn, wrong_btn); // 正答ボタンか誤答ボタンのどちらかが押されるのを待つ
        $('#self_judge').style.display = 'none'; // 正解と正答・誤答ボタンを非表示する
        $('#answer').disabled = null; // 回答入力欄を変更できるようにする
        return result; // 結果を返す
    }
}

// 正誤判定方法がselfな場合の、ボタンが押されるのを待つ
function wait_selfJudgeBtnClick(corr_btn, wrong_btn) {
    return new Promise(resolve => {
        corr_btn.onclick = () => resolve(true); // 正答ボタンが押されたらtrueを返す
        wrong_btn.onclick = () => resolve(false); // 誤答ボタンが押されたらfalseを返す
    })
}

// 解説を出したあと、okボタンが押されるまで待つ
function wait_desOkBtnClick() {
    return new Promise(resolve => {
        
    })
}

// 回答するときの処理
async function answer() {
    if (scene == Scene.playing) { // プレイ中なら
        var is_collect = await is_answer_collect(); // 正誤判定させる
        $('#answer').value = ''; // 解答欄を空白にさせる
        $('#description_box').style.display = 'block'; // 解説を表示
        set_q(); // 出題
    }
}

// addEventListener
$('#answer_btn').addEventListener('click', answer) // 回答ボタンが押されたときの処理

window.onload = async function() {
    await read_json(); // jsonの読み込み
    what_quiz_group(); // quizらの取得
    $('#group_name').innerHTML = json[settings.Gid].name; // クイズのグループの名前を表示
    console.log(quizzes)

    set_q(); // 最初の出題
}