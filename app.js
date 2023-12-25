// 変数宣言
const $doc = document;
const Scene = {
    playing: 'playing',
    result: 'result'
}
let settings = {};
let quizzes_finished_already = [];
let now_quiz = {};
let score = { // 得点状況
    num_quiz: 0, // 問題数
    num_corr: 0, // 正答数
    num_wrong: 0 // 誤答数
}
let json, quiz_group, quizzes, is_collect, now_quiz_num, scene;

// -----初期化-----
function init() {
    // 得点状況の初期化
    score.num_corr = 0;
    score.num_quiz = 0;
    score.num_wrong = 0;

    now_quiz_num = -1; // 順番通りに始めるとき用に初期値-1
    scene = Scene.playing; // シーンをプレイ中にする
    quizzes_finished_already = []; // すでに終わったクイズを保存する配列を空にする
}

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
    console.log('json:', json);
}

// -----今回のクイズのグループを取得-----
function what_quiz_group() {
    var search = window.location.search.split('?').pop().split('&'); // urlのクエリー文字列から設定を取得
    // 等式の抜き出し
    search.forEach(equ => {
        var foo = equ.split('='); // クエリー文字列を'='ごとに分割
        settings[foo[0]] = foo[1]; // settings(type:dict)に、左辺をキー、右辺を値として保存
    });
    // 今回のクイズのグループを取得
    quiz_group = json.find((g) => g.Gid == settings['Gid']); // 今回のクイズ群を取得
    quizzes = quiz_group.quizzes; // クイズだけを抜き出し
    console.log('今回のクイズ:', quizzes);
}

// -----次のクイズを選ぶ-----
function select_q() {
    // (初めて実行されたものでなければ)終わったものにカウントする
    if (now_quiz_num != -1) { // 最初(の問題すら選ばれていない状態)じゃなければ
        quizzes_finished_already.push(now_quiz_num); // quizzes_finished_already(もうすでにやったクイズの配列)にクイズの番号を保存
    }

    // 問題の出し方の場合分け
    switch (settings.order) {
        case 'in_order':
            // 順番通り
            if (now_quiz_num < quizzes.length - 1) { // クイズを全部出してなければ
                now_quiz_num++; // 問題番号を1ずつ増やす
            } else { // クイズを全部出してれば
                end(); // 終了させる
            }
            break;

        case 'random':
            // ランダム
            if (quizzes_finished_already.length < quizzes.length) { //クイズを全部出してなければ
                // すでに出た問題を避けるようにランダムな数字を出す
                function random() {
                    var foo = Math.floor(Math.random() * quizzes.length); // ランダムに問題番号を選ぶ
                    if (quizzes_finished_already.includes(foo)) { // すでに出されていたのなら
                        return random(); // もう一回選出する
                    } else { // まだ出されていないのなら
                        return foo; // それを返り値とする
                    }
                }
                
                now_quiz_num = random(); // 代入
            } else { // クイズを全部出してれば
                end(); // 終了させる
            }
            break;

        case 'endless':
            // エンドレス
            now_quiz_num = Math.floor(Math.random() * quizzes.length); // 完全ランダム
            break;
    }
    
    now_quiz = quizzes[now_quiz_num]; // now_quiz_num からクイズを取得
    console.log('現在の問題番号:', now_quiz_num, '現在の問題:', now_quiz);
}

// 出題の処理
function set_q() {
    select_q(); // 次の問題を選ぶ
    if (scene != Scene.result) { // 終わってなければ
        var ques = quizzes[now_quiz_num] // 出す問題を取得
        $('#question').innerHTML = ques.txt; // 問題を表示する
    }
}

// クイズを終わらせる処理
function end() {
    scene = Scene.result; // sceneをresult(結果表示)にする
    $('#question').innerHTML = `お疲れ様でした。<br>
    あなたは<strong>${score.num_quiz}問中、${score.num_corr}問正解</strong>し、正答率は<strong>${$('#corr_rate').innerText}</strong>でした。<br>
    もう一度やりたい場合は、リロードをするか、<strong>回答ボタン</strong>("answer"と書かれているボタン)を押してください。`
    alert('finish!');
}

// -----正誤判定-----
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

// -----ボタンが押されるまで待つ関数ゾーン-----
// 正誤判定方法がselfな場合の、ボタンが押されるのを待つ
function wait_selfJudgeBtnClick(corr_btn, wrong_btn) {
    return new Promise(resolve => {
        corr_btn.onclick = () => resolve(true); // 正答ボタンが押されたらtrueを返す
        wrong_btn.onclick = () => resolve(false); // 誤答ボタンが押されたらfalseを返す
    })
}
// 解説を出したあと、okボタンが押されるまで待つ
function wait_nextQuizBtnClick(nextQuizBtn) {
    return new Promise(resolve => {
        nextQuizBtn.onclick = () => resolve(); // 次のクイズに進むボタンが押されたらresolve
    })
}

// -----回答するときの処理-----
async function answer() {
    if (scene == Scene.playing) { // プレイ中なら
        is_collect = await is_answer_collect(); // 正誤判定させる
        score.num_quiz++; // すでにやったクイズの数を増やす
        score[is_collect ? 'num_corr' : 'num_wrong']++; // 正答数もしくは誤答数を増やす
        $('#answer').disabled = 'disabled'; // 回答入力欄を変更できないようにする

        put_description() // 正答・プレイヤーの回答・解説などを書く
        $('#description_box').style.display = 'block'; // 解説を表示

        var nextQuizBtn = $('#nextQuiz_btn'); // 次のクイズに進むボタン
        await wait_nextQuizBtnClick(nextQuizBtn); // 次のクイズに進むボタンが押されるまで待つ

        $('#description_box').style.display = 'none'; // 解説を非表示にする
        $('#answer').value = ''; // 解答欄を空白にさせる
        $('#answer').disabled = null; // 回答入力欄を変更できるようにする
        set_q(); // 出題

    } else if (scene == Scene.result) { // 結果を表示中なら
        init(); // 初期化
        set_q(); // 出題
    }
}
// 正答・プレイヤーの回答・解説などを書く処理
function put_description() {
    $('#is_corr').innerText = is_collect ? '正解' : '不正解'; // 正解家不正解かを表示
    $('#ps_ans').innerText = '回答: ' + $('#answer').value; // プレイヤーの回答を表示
    $('#corr_ans').innerText = '正答: ' + now_quiz.ans.join(', '); // 正答を表示
    $('#description').innerHTML = '解説: ' + now_quiz.desc; // 解説を表示
}

// addEventListener
$('#answer_btn').addEventListener('click', answer) // 回答ボタンが押されたときの処理

// 現在の得点状況を書く処理
function put_score() {
    $('#num_quiz').innerText = score.num_quiz; // 問題数
    $('#num_corr').innerText = score.num_corr; // 正答数
    $('#num_wrong').innerText = score.num_wrong; // 誤答数
    // 正答率
    if (score.num_quiz == 0) { // 問題数が0ならば
        $('#corr_rate').innerText = '0%';
    } else { // 問題数が0でなければ
        $('#corr_rate').innerText = String(Math.round(score.num_corr / score.num_quiz * 1000) / 10) + '%'; // 百分率で表示(小数点2位を四捨五入)
    }
}

// ロードされたときに行う
window.onload = async function() {
    init() // 初期化
    await read_json(); // jsonの読み込み
    what_quiz_group(); // quizらの取得
    $('#group_name').innerHTML = json.find((g) => g.Gid == settings['Gid']).name; // クイズのグループの名前を表示

    set_q(); // 最初の出題
}

// ずっと繰り返す(60FPS)
setInterval(() => {
    put_score()
}, 16)