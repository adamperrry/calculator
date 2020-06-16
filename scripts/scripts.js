
window.addEventListener('keydown', checkKey);
window.addEventListener('keydown', toggleActive);
window.addEventListener('keyup', toggleActive);

const displayText = document.querySelector('.display-text');
const display = document.querySelector('.display');

let currentMath = [];
let answer = '0';
let decimalUsed = false;

let btns = [...document.querySelectorAll('.btn')];

btns.forEach(btn => {
    btn.addEventListener('transitionend', e => {
        if (e.propertyName !== 'background-color') return;
        e.target.classList.remove('btn-error')
    })
    btn.addEventListener('click', e => enter(e.target.textContent))
})

clearAll();

function toggleActive(e) {
    let key = e.key;
    if (key === '=') key = 'Enter';
    if (key.toUpperCase() === 'X') key = '*';
    let button = document.getElementById(key);
    if (button) e.type === 'keydown' ? button.classList.add('btn-active') : button.classList.remove('btn-active');
}

function checkKey(e) {
    let pattern = /^[0-9\.\*\/\-\+x\=]|Enter|Backspace|Delete/i;
    let entry = e.key;
    if (pattern.test(entry)) {
        //Correct operators
        if (entry === 'Enter') entry = '=';
        else if (entry.toUpperCase() === 'X' || entry === '*') entry = '×';
        else if (entry === '/') entry = '÷';
        else if (entry === 'Backspace') entry = '←';
        else if (entry === 'Delete') entry = 'C';
        enter(entry);
    }
}

function enter(entry) {
    //Do nothing if entry is the equals operator and default text is showing
    if ((entry === '=' || entry === '←') && displayText.lastElementChild.classList.contains('default')) return;

    if (entry === 'C') {
        clearAll();
        return;
    }

    if (entry === 'CE') {
        clearEntry();
        return;
    }

    if (entry === '←') {
        backspace();
        return;
    }

    //Clear default text or start a new line of math
    if (!currentMath.length) {
        displayText.lastElementChild.classList.toggle('display-text-main');
        displayText.lastElementChild.classList.toggle('display-text-old');
        if (displayText.lastElementChild.classList.contains('default')) displayText.innerHTML = '';
        let newLine = document.createElement('SPAN');
        newLine.innerText = '';
        newLine.classList.add('display-text-main');
        displayText.appendChild(newLine);
    }

    //check if math has already been entered before entering an operator
    //no longer allowing operator to be first button pushed after default
    if (isOperator(entry) && !currentMath.length) {
        if (displayText.childElementCount === 1 || answer === 'Division Error!') {
            if (entry !== '-') {
                answer !== 'Division Error!' ? clearAll() : clearEntry();
                return;
            } else if (entry === '-') currentMath = [entry];
        } else currentMath = [answer];
    }

    //Carry out entry - this is super messy but it works
    let previous = currentMath[currentMath.length - 1];
    if (!(isOperator(entry) && (currentMath.length === 1 && currentMath[0] === '-'))) {
        if (isOperator(entry)) {
            if (isOperator(previous)) {
                if (entry === '-' && !isOperator(currentMath[currentMath.length - 2])) currentMath.push(entry);
                else return;
            } else {
                if (previous[previous.length - 1] === '.') currentMath[currentMath.length - 1] = previous.slice(0, previous.length - 1);
                currentMath.push(entry);
                decimalUsed = false;
            }
        } else if (isOperator(previous) || !currentMath.length) {
            if (isOperator(currentMath[currentMath.length - 2]) || (currentMath.length === 1 && currentMath[0] === '-')) {
                entry === '.' ? currentMath[currentMath.length - 1] += '0.' : currentMath[currentMath.length - 1] += entry;
            } else entry === '.' ? currentMath.push('0.') : currentMath.push(entry);
        } else if (entry === '.' && decimalUsed) return;
        else {
            if ((previous === '0' || previous === '-0') && entry !== '.') currentMath[currentMath.length - 1] = previous.slice(0, previous.length - 1);
            currentMath[currentMath.length - 1] += entry;
        }
    }

    if (entry === '.') decimalUsed = true;

    displayText.lastElementChild.innerText = currentMath.join(' ');
    display.scrollTop = display.scrollHeight;

    //final check to see if equals was hit, evaluate math/add the answer to the output screen
    if (entry === '=' && !(currentMath.length === 1 && currentMath[0] === '-')) {
        operate();
        return;
    }
}

function isOperator(entry) {
    return entry === "=" || entry === '-' || entry === '÷' || entry === '×' || entry === '+';
}

function operate() {
    let evaluating = currentMath.slice(0, currentMath.length - 1);
    while (evaluating.length > 1) {
        if (evaluating.indexOf('×') > 0) {
            evaluating = doMath(evaluating, evaluating.indexOf('×'));
        } else if (evaluating.indexOf('÷') > 0) {
            evaluating = doMath(evaluating, evaluating.indexOf('÷'));
        } else {
            evaluating = doMath(evaluating, 1);
        }
    }
    answer = parseFloat(evaluating[0]).toFixed(5); //round it (to fix long decimals and bad math)
    answer = parseFloat(answer).toString(); //fixes trailing zeros
    if (answer === 'Infinity' || answer === '-Infinity' || answer === 'NaN') {
        error();
        answer = 'Division Error!';
    }
    displayText.lastElementChild.innerText = currentMath.join(' ') + ' ' + answer;
    display.scrollTop = display.scrollHeight;
    currentMath = [];
}

function doMath(evaluating, operatorPosition) {
    let a = parseFloat(evaluating[operatorPosition - 1]);
    let b = parseFloat(evaluating[operatorPosition + 1]);
    let result;
    switch (evaluating[operatorPosition]) {
        case '+':
            result = a + b;
            break;
        case '-':
            result = a - b;
            break;
        case '×':
            result = a * b;
            break;
        case '÷':
            result = a / b;
    }
    return evaluating.slice(0, operatorPosition - 1).concat([result.toString()], evaluating.slice(operatorPosition + 2));
}

function backspace() {
    if (!currentMath.length || (currentMath.length === 1 && currentMath[currentMath.length - 1].length === 1)) {
        clearEntry();
        return;
    }
    let lastEntry = currentMath[currentMath.length - 1];
    if (lastEntry.length === 1) currentMath.pop();
    else currentMath[currentMath.length - 1] = lastEntry.slice(0, lastEntry.length - 1);
    if (currentMath.length === 1 && currentMath[0] === '-' && displayText.childElementCount !== 1) {
        clearEntry();
        return;
    }
    currentMath[currentMath.length - 1].indexOf('.') === -1 ? decimalUsed = false : decimalUsed = true;
    displayText.lastElementChild.innerText = currentMath.join(' ');
    display.scrollTop = display.scrollHeight;
}

function clearEntry() {
    displayText.removeChild(displayText.lastElementChild);
    if (!displayText.lastElementChild) {
        clearAll();
        return;
    }
    displayText.lastElementChild.classList.toggle('display-text-main');
    displayText.lastElementChild.classList.toggle('display-text-old');
    answer = displayText.lastElementChild.innerText.slice(displayText.lastElementChild.innerText.indexOf('=') + 2);
    currentMath = [];
    decimalUsed = false;
}

function clearAll() {
    answer = '0';
    currentMath = [];
    decimalUsed = false;
    displayText.innerHTML = '';
    let defaultText = document.createElement('SPAN');
    defaultText.innerText = 'Press a button to get your math on!';
    defaultText.classList.add('display-text-main', 'default');
    displayText.appendChild(defaultText);
}

function error() {
    btns.forEach(btn => btn.classList.add('btn-error'));
}
