let quizes = {}
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
function read_json() {
    fetch('quiz.json')
        .then(responce =>  responce.json())
        .then(data => {
            aa(data)
        })
        .catch((e) => {
            console.error(e);
        })
        console.log(quizes)
}

function aa(data) {
    quizes = 3;
    console.log(quizes, data)
}

// div#menu に app.html へ飛ぶボタンを作る
function set_qGroup_selector() {
    var parent = $('#menu');
    quizes.forEach(qGroup => {
        var new_elm = $doc.createElement('a');
        new_elm.id = 'group_' + qGroup.group_id;
        new_elm.innerText = qGroup.name;
        new_elm.className = 'menu_btn';
        parent.appendChild(new_elm);
    });
    menu_btn_href_set();
}

// app.html へ飛ぶボタンのurl設定
function menu_btn_href_set() {
    quizes.forEach(qGroup => {
        var $btn = $('#group_' + qGroup.group_id);
        console.log($btn)
        $btn.href = `app.html?group_id=${qGroup.group_id}&order=${$('#order').value}`;
    })
}

$doc.getElementsByName('settings').forEach(elm => {
    elm.addEventListener('change', menu_btn_href_set);
})

window.onload = function() {
    read_json();
    // console.log(quizes)
    // set_qGroup_selector();
}
