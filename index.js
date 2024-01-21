let quizes;
const $doc = document;

// htmlの要素を取得を簡単にする
function $(elm) {
    switch (elm[0]) {
        case '#':
            return $doc.getElementById(elm.replace('#', ''));
        case '.':
            return $doc.getElementsByClassName(elm.replace('.', ''));
        default:
            return $doc.getElementsByTagName(elm);
    }
}

// quiz.json を読み込む
async function read_json() {
    var requestURL = "quiz.json";
    var request = new Request(requestURL);
    var response = await fetch(request);
    var jsonTxt = await response.text();
    var json = JSON.parse(jsonTxt);

    quizes = json;
}

// div#menu に app.html へ飛ぶボタンを作る
function set_qGroup_selector() {
    var parent = $('#menu');
    quizes.forEach(qGroup => {
        var new_elm = $doc.createElement('a');
        new_elm.id = 'group_' + qGroup.Gid;
        new_elm.innerText = qGroup.name;
        new_elm.className = 'menu_btn';
        parent.appendChild(new_elm);
    });
    menu_btn_href_set();
}

// app.html へ飛ぶボタンのurl設定
function menu_btn_href_set() {
    var settings = document.getElementsByName('settings');
    quizes.forEach(qGroup => {
        var $btn = $('#group_' + qGroup.Gid);
        $btn.href = `app.html?Gid=${qGroup.Gid}`;

        settings.forEach(set => {
            $btn.href += `&${set.id}=${set.value}`
        });
    })
}

$doc.getElementsByName('settings').forEach(elm => {
    elm.addEventListener('change', menu_btn_href_set);
})

window.onload = async function() {
    await read_json();
    set_qGroup_selector();
}
