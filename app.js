// 変数宣言
const $doc = document;
const Scene = {
    playing: 'playing',
    result: 'result'
}
let settings = {};
let quizzes_finished_already = [];
let selected_btn = [];
let now_quiz = {};
let score = { // 得点状況
    num_quiz: 0, // 問題数
    num_corr: 0, // 正答数
    num_wrong: 0 // 誤答数
}
let json, quiz_group, quizzes, is_collect, now_quiz_num, scene, quizzes_got_wrong, is_showing_desc;

// -----初期化-----
function init() {
    // 得点状況の初期化
    score.num_corr = 0;
    score.num_quiz = 0;
    score.num_wrong = 0;

    now_quiz_num = -1; // 順番通りに始めるとき用に初期値-1
    scene = Scene.playing; // シーンをプレイ中にする
    quizzes_finished_already = []; // すでに終わったクイズを保存する配列を空にする
    is_showing_desc = false; // 解説を見せているか、の変数
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
    quizzes = quiz_group.quizzes; // クイズだけを抜き出す

    get_quizzes_got_wrong(); // 間違えた問題を取得する

    if (settings.range == 'wrong') { // 出題範囲が間違えたところならば
        quizzes = quizzes.filter((q) => quizzes_got_wrong.includes(q.Qid)); // 間違えたところだけを抜き出す
    }
    console.log('今回のクイズ:', quizzes);
}

// 間違えた問題を取得する処理
function get_quizzes_got_wrong() {
    var lStorage = window.localStorage.getItem('quizzes_got_wrong'); // localStorageから間違えたクイズを取得
    if (lStorage == null) { // もしまだなんも保存されていなければ
        quizzes_got_wrong = []; // 空集合で代入
    } else { // なにか保存されていれば
        quizzes_got_wrong = JSON.parse(lStorage); // 文字列から配列にして代入
    }
    console.log('quizzes_got_wrong:', quizzes_got_wrong)
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

        if (now_quiz.corr_deci == 'opt') { // 選択式のクイズの場合
            selected_btn = []; // 押されたボタンの配列を空にする
            $('#opt_box').innerHTML = ''; // ボタンを消去する

            $('#answer_input_div').style.display = 'none'; // 回答入力欄を非表示
            $('#opt_box').style.display = 'block'; // 選択肢が表示されるところを表示する
            // 選択ボタンを作成
            now_quiz.opt.forEach(opt => {
                var new_elm = $doc.createElement('input'); // inputタグ作成
                var parent = $('#opt_box'); // 親要素の設定
                new_elm.type = 'button'; // ボタンに設定する
                new_elm.className = 'opt_btn'; // class設定
                new_elm.value = opt; // ボタンに表示する文字の設定
                new_elm.onclick = optBtnClick; // 押されたときの処理設定
                parent.appendChild(new_elm); // ボタンを親要素の末尾に挿入
            });

        } else { // そうでなければ(回答入力式)
            $('#answer_input_div').innerHTML = ''; // 回答入力欄をすべて削除する

            // 回答入力欄を作成
            now_quiz.ans.forEach(inp => {
                var new_elm = $doc.createElement('input'); // inputタグ作成
                var parent = $('#answer_input_div'); // 親要素の設定
                new_elm.type = 'text'; // テキスト入力ように設定
                new_elm.className = 'answer'; // class設定
                parent.appendChild(new_elm); // 回答入力欄を親要素の末尾に挿入
            })
        }
    }
}

// 選択式クイズの、選択肢のボタンが押されたときの処理
function optBtnClick(e) {
    var pushed_btn = e.target; // 押されたボタンの選択肢を取得

    if (selected_btn.length == 0 || now_quiz.num_select == 'multi') { // まだどのボタンも押されてないか、複数選択可の問題なら
        selected_btn.push(pushed_btn.value); // 押されたボタンリストに追加

        if (pushed_btn.classList.contains('active')) { // 押されたボタンがすでに活性化状態だったら
            pushed_btn.classList.remove('active'); // 押されたボタンを非活性化させる
        } else {
            pushed_btn.classList.add('active'); // 押されたボタンを活性化させる
        }

    } else { // そうでないなら(すでにボタンが押されていて、かつ一つだけ選択する問題なら)
        var opt_btns = Array.from($doc.getElementsByClassName('opt_btn')); // すべての選択肢ボタンを配列で取得
        var btn_pushed_before = opt_btns.filter((btn) => btn.value == selected_btn[0])[0]; // 前に押されたボタンを取得
        console.log(btn_pushed_before)
        btn_pushed_before.classList.remove('active'); // 前に押されたボタンを非活性化させる

        selected_btn = [pushed_btn.value]; // 押されたボタンに設定
        pushed_btn.classList.add('active'); // 押されたボタンを活性化させる
    }
}

// クイズを終わらせる処理
function end() {
    scene = Scene.result; // sceneをresult(結果表示)にする
    $('#question').innerHTML = `お疲れ様でした。<br>
    あなたは<strong>${score.num_quiz}問中、${score.num_corr}問正解</strong>し、正答率は<strong>${$('#corr_rate').innerText}</strong>でした
    。<br>もう一度やりたい場合は、リロードをするか、<strong>回答ボタン</strong>("answer"と書かれているボタン)を押してください。`
    alert('finish!');
}

// -----正誤判定-----
async function is_answer_collect() {
    var corr_ans = now_quiz.ans; // 正答
    var is_collect;
    var ps_ans = [];
    Array.from($doc.getElementsByClassName('answer')).forEach(ipt => {
        ps_ans.push(ipt.value); // プレイヤーの回答リストに挿入
    })

    if (now_quiz.corr_deci == 'auto') {
        // 正誤判定方法がauto(自動)な場合
        if (ps_ans.every((p) => corr_ans.find((c) => c.includes(p)) != undefined)) { // 正答の中にプレイヤーの回答がある場合
            is_collect = true; // 正解
        } else { // ない場合
            is_collect = false; // 不正解
        }

    } else if (now_quiz.corr_deci == 'self') {
        // 正誤判定方法がself(自分で確かめる場合)
        $('#prepared_ans').innerHTML = corr_ans.join(', '); // 準備されていた答えを表示する
        answer_input_disabled('disabled'); // 回答入力欄を変更できないようにする
        $('#self_judge').style.display = 'block'; // 正解と正答・誤答ボタンを表示する

        var corr_btn = $('#true_btn'); // 正答ボタン
        var wrong_btn = $('#false_btn'); // 誤答ボタン
        const result = await wait_selfJudgeBtnClick(corr_btn, wrong_btn); // 正答ボタンか誤答ボタンのどちらかが押されるのを待つ

        $('#self_judge').style.display = 'none'; // 正解と正答・誤答ボタンを非表示する
        answer_input_disabled(null); // 回答入力欄を変更できるようにする
        is_collect = result; // 結果を返す

    } else if (now_quiz.corr_deci == 'opt') {
        // 選択式のクイズの場合
        ps_ans = selected_btn;
        if (ps_ans.length == corr_ans.length && ps_ans.every((e) => corr_ans.includes(e))) { // プレイヤーの回答と正答が一致している場合
            is_collect = true; // 正解
        } else {
            is_collect = false; // 不正解
        }
    }

    return {ps_ans: ps_ans, is_collect: is_collect}; // 返答
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

// 回答入力欄を変更できたりできないようにしたりする処理
function answer_input_disabled(a) {
    Array.from($doc.getElementsByClassName('answer')).forEach(ipt => {
        ipt.style.disabled = a;
    })
}

// -----回答するときの処理-----
async function answer() {
    function setQs_got_wrong() {
        window.localStorage.setItem('quizzes_got_wrong', JSON.stringify(quizzes_got_wrong)); // localStorageに配列を文字列にして保存
    }

    if (scene == Scene.playing) { // プレイ中なら
        if (!is_showing_desc) { // 解説を表示させている途中じゃなければ
            
            var foo = await is_answer_collect(); // 正誤判定させる
            is_collect = foo.is_collect; // 正誤判定の結果を代入
            var ps_ans = foo.ps_ans; // プレイヤーの回答を代入
            score.num_quiz++; // すでにやったクイズの数を増やす
            score[is_collect ? 'num_corr' : 'num_wrong']++; // 正答数もしくは誤答数を増やす
            answer_input_disabled('disabled') // 回答入力欄を変更できないようにする

            // 間違えた問題を保存
            if (!is_collect && settings.save_mistake == 'true') { // 不正解で、間違えた問題を保存する設定なら
                if (!quizzes_got_wrong.includes(now_quiz.Qid)) { // すでに配列に入っていなければ(まだ間違えた問題じゃなければ)
                    quizzes_got_wrong.push(now_quiz.Qid); // クイズidを配列に保存
                }
                setQs_got_wrong(); // localStorageに間違えた問題を保存
            }
            // 間違えた問題を正解したら復習しない
            if (is_collect && settings.remove_if_corr == 'true') { // 正解し、間違え得た問題は復習しない設定なら
                quizzes_got_wrong = quizzes_got_wrong.filter((e) => e != now_quiz.Qid) // 間違えた問題リストからその問題を除く
                setQs_got_wrong(); // localStorageに間違えた問題を保存
            }
            console.log('quizzes_got_wrong:',quizzes_got_wrong, window.localStorage.getItem('quizzes_got_wrong'))

            put_description(ps_ans) // 正答・プレイヤーの回答・解説などを書く
            is_showing_desc = true;
            $('#description_box').style.display = 'block'; // 解説を表示

            var nextQuizBtn = $('#nextQuiz_btn'); // 次のクイズに進むボタン
            await wait_nextQuizBtnClick(nextQuizBtn); // 次のクイズに進むボタンが押されるまで待つ

            $('#description_box').style.display = 'none'; // 解説を非表示にする
            is_showing_desc = false;
            $('#opt_box').style.display = 'none'; // 選択肢が表示されるところを非表示にする
            $('#answer_input_div').style.display = 'block'; // 回答入力欄を表示する
            answer_input_disabled(null) // 回答入力欄を変更できるようにする
            set_q(); // 出題
            }
        
    } else if (scene == Scene.result) { // 結果を表示中なら
        init(); // 初期化
        set_q(); // 出題
    }
}
// 正答・プレイヤーの回答・解説などを書く処理
function put_description(ps_ans) {
    var corr_ans = now_quiz.ans
    $('#is_corr').innerText = is_collect ? '正解' : '不正解'; // 正解家不正解かを表示

    if (now_quiz.corr_deci == 'auto') {
        for (let i = 0; i < corr_ans.length; i++) {
            var elm = corr_ans[i];
            if (elm.length > 1) {
                var foo = elm.shift();
                corr_ans[i] = `${foo}(${elm.join(',')})`;
            }
        }
    }
    

    $('#ps_ans').innerHTML = '<strong>回答:</strong> ' + ps_ans; // プレイヤーの回答を表示
    $('#corr_ans').innerHTML = '<strong>正答:</strong> ' + corr_ans; // 正答を表示
    $('#description').innerHTML = '<strong>解説:</strong> ' + now_quiz.desc; // 解説を表示
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
         // 百分率で表示(小数点2位を四捨五入)
        $('#corr_rate').innerText = String(Math.round(score.num_corr / score.num_quiz * 1000) / 10) + '%';
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
    put_score(); // 得点状況を表示
}, 16)