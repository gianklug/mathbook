import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js"
const editor = ace.edit("editor");
let timeout = null;
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/markdown");

const defaultText = "# MathBook\nYou can use **any** markdown, even `code` blocks.\n\nTo use math, prefix lines with `$`. You can use simplified [ASCIIMath](https://asciimath.org/) or LaTex!\n$(-b \\pm sqrt(b^2 -4ac))/(2a)\nTry it out now!";

function loadCache() {
    const cache = localStorage.getItem('cache');
    if (cache) {
        editor.setValue(cache, 1);
    } else {
        editor.setValue(defaultText, 1);
        saveCache();
        window.location.reload();
    }
}

function saveCache() {
    localStorage.setItem('cache', editor.getValue());
}

function diffUpdate() {
    let oldContent = document.getElementById('preview').innerHTML;
    let newContent = marked(document.getElementById('render').innerHTML.replaceAll('!$!', '`'));
    if (oldContent !== newContent) {
        saveCache();
        document.getElementById('preview').innerHTML = newContent;
    }
}


function render() {
    var render = document.getElementById('render');
    let lines = editor.getValue().split('\n');
    lines = lines.map((line) => {
        // $ -> Math, otherwise render as MD
        if (line.startsWith('$')) {
            // place in ` and remove initial $ + strip
            let mathLine = '<br>`' + line.replace(/^\$/, '').trim() + '`<br>';
            return mathLine;
        } else {
            return line.replaceAll('`', '!$!');
        }
    });
    render.innerHTML = lines.join('\n');
    MathJax.Hub.Typeset(render, diffUpdate)

}
editor.getSession().on('change', function () {
    if (timeout) {
        clearTimeout(timeout);
    }
    timeout = setTimeout(render, 200);
});
document.getElementById('fileInput').addEventListener('change', function (event) {
    const file = event.target.files[0];
    console.log(file);
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            editor.setValue(e.target.result, 1); // 1 here is for moving cursor to start
        };
        reader.readAsText(file);
    }
});

document.getElementById('download').onclick = function () {
    const text = editor.getValue();
    const blob = new Blob([text], { type: 'text/plain' });
    const anchor = document.createElement('a');
    const timestamp = new Date().toISOString();
    anchor.download = `mathbook-${timestamp}.md`;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.click();
    window.URL.revokeObjectURL(anchor.href);
}

document.getElementById('wolfram').onclick = function () {
    const selectionRange = editor.getSelectionRange();

    // if selectionrange is zero, use current line
    const startLine = selectionRange.start.row;
    const endLine = selectionRange.end.row;
    let content;
    if (startLine === endLine) {
        const currline = editor.getSelectionRange().start.row;
        content = editor.session.getLine(currline);
    } else {
        content = editor.session.getTextRange(selectionRange);
    }
    const query = content.replace(/^\$/, '').trim()
    const url = `https://www.wolframalpha.com/input/?i=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
}


loadCache();
render();
