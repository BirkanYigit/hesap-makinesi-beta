const topDisplay = document.getElementById("calculator-top-display");
const display = document.getElementById("calculator-display");
const memoryClear = document.getElementById("memory-clear");
const memoryRecall = document.getElementById("memory-recall");
const memoryPlus = document.getElementById("memory-cumulative-add");
const memoryMinus = document.getElementById("memory-remove");
const memoryStore = document.getElementById("memory-store");
const memoryDrawerButton = document.getElementById("memory-drawer-button");
const memoryDrawer = document.getElementById("memory-drawer");

// Butonların başlangıç durumları
memoryClear.disabled = true;
memoryClear.setAttribute("style", "color: grey;");
memoryRecall.disabled = true;
memoryRecall.setAttribute("style", "color: grey;");
memoryPlus.disabled = false;
memoryMinus.disabled = false;
memoryStore.disabled = false;
memoryDrawerButton.disabled = true;
memoryDrawerButton.setAttribute("style", "color: grey;");

let topDisplayQueue = [];
let displayQueue = [];
let justCalculated = false;

// Sayı basamakları arttıkça otomatik olarak "." eklenmeli, hallet
function notifyDisplay(data) {
    if (!isNaN(data)) {  
        if (justCalculated) {
            displayQueue = [];
            topDisplayQueue = [];
            justCalculated = false;
        }

        if (displayQueue.length > 0 && !isNaN(displayQueue[displayQueue.length - 1])) {
            displayQueue[displayQueue.length - 1] += data.toString();
        } else {
            displayQueue.push(data.toString());
        }
    } else {  
        if (!isNaN(displayQueue[displayQueue.length - 1])) {
            topDisplayQueue = [displayQueue[0], data];
            displayQueue = [];
        } else {
            topDisplayQueue[topDisplayQueue.length - 1] = data;
        }
        topDisplay.value = displayQueue;
        justCalculated = false;
    }
    updateDisplay();
}

function updateDisplay() {
    topDisplay.value = topDisplayQueue.join(" ");
    display.value = displayQueue.join(" ");
}

function calculate() {
    if (topDisplayQueue.length < 2) {
        return;
    }

    let num1 = parseFloat(topDisplayQueue[0]);
    let operator = topDisplayQueue[1];
    let num2 = parseFloat(displayQueue[0]);

    let result;
    let singleNumberOp = false

    switch (operator) {
        case '+':
            result = num1 + num2;
            break;
        case '-':
            result = num1 - num2;
            break;
        case '*':
            result = num1 * num2;
            break;
        case '/':
            result = num1 / num2;
            break;
        case '%':                   // Burada bir mantık hatası var, düzelt
            result = num1 % num2;
            break;
        case '1/x':
            singleNumberOp = true;
            num2 = num1;
            result = 1 / num2;
            break;
        case 'x²':
            singleNumberOp = true;
            result = num1 * num1;
            break;
        case '√x':
            singleNumberOp = true;
            result = Math.sqrt(num1);
            break;
    }

    // Tek sayı ile çalışan operasyonlar için geçici çözüm, sonra tekrar bak
    if (singleNumberOp) {
        topDisplayQueue = [num1, operator, "="];
        displayQueue = [result.toString()];
        singleNumberOp = false;
        justCalculated = true;
        updateDisplay();
        return;
    }
    // Gereksiz kod tekrarı oldu, bunları fonksiyon içine at
    topDisplayQueue = [num1, operator, num2, "="];
    displayQueue = [result.toString()];
    justCalculated = true;
    updateDisplay();
}

// displayQueue boşken flip yapınca NaN dönüyor, düzelt
// calculate ettikten sonra hemen delete tuşuna basılınca topDisplay'deki ikinci sayı ve display'deki sayı NaN dönüyor, düzelt
function flipSign() {
    if (!(displayQueue.length < 0)) {
        let num = parseFloat(displayQueue[0]); 
        let numToString = (num *= -1).toString();
        displayQueue[0] = numToString;
        updateDisplay();
        return numToString;
    }
}

// Bunu hallet
function addDecimal() {
    updateDisplay();
}

function deleteLastAction() {
    let temp = displayQueue[0];
    displayQueue[0] = temp.slice(0, -1);
    updateDisplay();
}

function resetCalculator() {
    topDisplayQueue = [];
    displayQueue = [];
    updateDisplay();
}

function clearEntry() {
    displayQueue.pop();
    updateDisplay();
}

// memoryClearFunc memory drawer açıkkan çalışınca drawer temizleniyor ama ekranda kalıyor, düzelt
// Bu fonksiyonu sadeleştir
function setMemoryButtonState() {
    if (memoryDrawer.childElementCount > 0) {
        memoryClear.disabled = false;
        memoryClear.setAttribute("style", "color: white;");
        memoryRecall.disabled = false;
        memoryRecall.setAttribute("style", "color: white;");
        memoryDrawerButton.disabled = false;
        memoryDrawerButton.setAttribute("style", "color: white;");
    }

    if (memoryDrawer.childElementCount <= 0) {
        memoryClear.disabled = true;
        memoryClear.setAttribute("style", "color: grey;");
        memoryRecall.disabled = true;
        memoryRecall.setAttribute("style", "color: grey;");
        memoryDrawerButton.disabled = true;
        memoryDrawerButton.setAttribute("style", "color: grey;");
    }
}

function memoryClearFunc() {
    memoryDrawer.innerHTML = "";
    setMemoryButtonState();
}

function memoryRecallFunc() {
    const firstElement = memoryDrawer.children[0]
    const storedNumber = firstElement.textContent
    displayQueue[0] = storedNumber;
    updateDisplay();
    setMemoryButtonState();
}

function memoryPlusFunc() {
    if (memoryDrawer.children[0] == null) {
        memoryStoreFunc(displayQueue[0]);
        setMemoryButtonState();
        return;
    }
    const storedNumber = parseFloat(memoryDrawer.children[0].textContent);
    const displayedNumber = parseFloat(displayQueue[0]);
    const sum = storedNumber + displayedNumber;
    memoryDrawer.children[0].textContent = sum.toString();
    updateDisplay();
    setMemoryButtonState();
}

// displayQueue içinde değer olmadan kullanılınca hem memoryStore içine hem displayQueue içine NaN yazılıyor, düzelt
function memoryMinusFunc() {
    if (memoryDrawer.children[0] == null) {
        console.log("D: " + displayQueue[0] + "\n" + typeof displayQueue[0]);
        flipSign(displayQueue[0]);
        memoryStoreFunc(displayQueue[0]);
        flipSign(displayQueue[0]);
        setMemoryButtonState();
        return;
    }
    const storedNumber = parseFloat(memoryDrawer.children[0].textContent);
    const displayedNumber = parseFloat(displayQueue[0]);
    const sum = storedNumber - displayedNumber;
    memoryDrawer.children[0].textContent = sum.toString();
    console.log(memoryDrawer.children[0]);
    updateDisplay();
    setMemoryButtonState();
}

function memoryStoreFunc() {
    let temp = displayQueue[0];
    memoryDrawerRowBuilder(temp);
    setMemoryButtonState();
}

let isDrawerOpen = false;
function memoryDrawerButtonFunc() {
    isDrawerOpen = !isDrawerOpen;

    if (isDrawerOpen) {
        memoryDrawer.classList.remove("hidden");
    } else {
        memoryDrawer.classList.add("hidden");
    }
    setMemoryButtonState();
}

function memoryDrawerRowBuilder(num) {
    const drawerRow = document.createElement("p");
    const storedNumber = document.createTextNode(num.toString());
    drawerRow.append(storedNumber);
    drawerRow.classList.add("memory-row-style");
    memoryDrawer.append(drawerRow);
}
