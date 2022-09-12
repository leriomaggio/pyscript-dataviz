// Typing animation
function setupTypewriter(t) {
    let HTML = t.innerHTML;

    t.innerHTML = '';

    let cursorPosition = 0,
        tag = '',
        writingTag = false,
        tagOpen = false,
        typeSpeed = 1,
        tempTypeSpeed = 0;

    let type = function () {

        if (writingTag === true) {
            tag += HTML[cursorPosition];
        }

        if (HTML[cursorPosition] === '<') {
            tempTypeSpeed = 0;
            if (tagOpen) {
                tagOpen = false;
                writingTag = true;
            } else {
                tag = '';
                tagOpen = true;
                writingTag = true;
                tag += HTML[cursorPosition];
            }
        }
        if (!writingTag && tagOpen) {
            tag.innerHTML += HTML[cursorPosition];
        }
        if (!writingTag && !tagOpen) {
            if (HTML[cursorPosition] === ' ') {
                tempTypeSpeed = 0;
            } else {
                tempTypeSpeed = (Math.random() * typeSpeed) + 1;
            }
            t.innerHTML += HTML[cursorPosition];
        }
        if (writingTag === true && HTML[cursorPosition] === '>') {
            tempTypeSpeed = (Math.random() * typeSpeed) + 1;
            writingTag = false;
            if (tagOpen) {
                var newSpan = document.createElement('span');
                t.appendChild(newSpan);
                newSpan.innerHTML = tag;
                tag = newSpan.firstChild;
            }
        }

        cursorPosition += 1;
        if (cursorPosition < HTML.length - 1) {
            setTimeout(type, tempTypeSpeed);
        }
    };

    return {
        type: type
    };
}

function typewriter_fn() {
    let typer = document.getElementById('typewriter');
    typewriter = setupTypewriter(typewriter);
    typewriter.type();
}

$(document).ready(function() {
    $('a[href="#s8"]').click(typewriter_fn);
});
