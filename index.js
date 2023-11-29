import quizes from './quiz.json' assert {type: 'json'}
const $doc = document;

function set_qGroup_selector() {
    var parent = $doc.getElementById('menu');
    quizes.forEach(qGroup => {
        var new_elm = $doc.createElement('a');
        new_elm.id = qGroup.group_id;
        new_elm.innerText = qGroup.name;
        new_elm.className = 'menu_btn';
        new_elm.href = 'app.html?' + qGroup.group_id;
        parent.appendChild(new_elm)
    });
}

window.onload = () => {
    set_qGroup_selector()
    console.log(quizes);
}