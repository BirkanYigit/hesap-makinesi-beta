/* 
TODO:
- Bir işlem sonuçlandıktan hemen sonra sayı girmek yerine tekrar operator butonuna basınca garip bir sonuç üretiliyor, mantık hatası var
- Bir operand ve bir operator girdikten sonra tek operand'lı bir butona basınca invalid input dönüyor ama girilen operator göz ardı edilip işlem tamamlansa daha iyi olur, düzeltilecek
- Bazı butonlarda hover state yok, eklenecek
- Memory drawer animasyonu yok, eklenecek
- Header ikonları düzeltilecek
- Buton ikonlarının ebatlarıtutarsız, düzeltilecek
- App mobile responsive değil, düzeltilecek
- Lighthouse'da accessibility puanı düşük, düzeltilecek
- Uygulamanın sayfa içinde draggable ve resizable olması güzel olur, eklenecek
- CSS dağınık, düzeltilecek
*/

const topDisplay = document.getElementById("calculator-top-display");
const display = document.getElementById("calculator-display");
const memoryClear = document.getElementById("memory-clear");
const memoryRecall = document.getElementById("memory-recall");
const memoryPlus = document.getElementById("memory-cumulative-add");
const memoryMinus = document.getElementById("memory-remove");
const memoryStore = document.getElementById("memory-store");
const memoryDrawerButton = document.getElementById("memory-drawer-button");
const memoryDrawer = document.getElementById("memory-drawer");

// State değerleri
let memoryValues = [];
let topDisplayQueue = [];
let displayQueue = [];
let justCalculated = false;
let isDrawerOpen = false;

// Memory butonlarının başlangıç durumları
memoryClear.disabled = true;
memoryClear.setAttribute("style", "color: grey;");
memoryRecall.disabled = true;
memoryRecall.setAttribute("style", "color: grey;");
memoryPlus.disabled = false;
memoryMinus.disabled = false;
memoryStore.disabled = false;
memoryDrawerButton.disabled = true;
memoryDrawerButton.setAttribute("style", "color: grey;");

function updateDisplay() {
    topDisplay.value = topDisplayQueue.join(" ").replace(/\./g, ',');
    let displayValue = displayQueue.join(" ");

    if (!isNaN(parseFloat(displayValue))) {
        displayValue = displayValue.replace(/\./g, ',');
    }

    display.value = displayValue;

    setMemoryButtonState();
}

function notifyDisplay(data) {
    const lastDisplayItem = displayQueue[displayQueue.length - 1];
    const isLastError = isNaN(parseFloat(lastDisplayItem)) && displayQueue.length === 1;

    if (!isNaN(data) || data === '.') {
        if (justCalculated || isLastError) {
            displayQueue = [];
            topDisplayQueue = [];
            justCalculated = false;
        }

        // Noktayı içeride virgüle dönüyor
        if (data === '.') {
            addDecimal();
            return;
        }

        if (displayQueue.length > 0 && !isNaN(lastDisplayItem) && lastDisplayItem !== undefined) {
             if (lastDisplayItem === '0' && data.toString() === '0' && !lastDisplayItem.includes('.')) {
                 // Sıfıra sıfır ekleniyorsa bir şey yapmıyoruz
             } else if (lastDisplayItem === '0' && data.toString() !== '0' && !lastDisplayItem.includes('.')) {
                 displayQueue[displayQueue.length - 1] = data.toString();
             } else {
                 displayQueue[displayQueue.length - 1] += data.toString();
             }
        } else {
             displayQueue.push(data.toString());
        }
    } else {
        // Ekranda sayı yoksa operator göz ardı ediliyor
        if (displayQueue.length === 0 || isLastError || isNaN(lastDisplayItem)) {
             if (topDisplayQueue.length >= 2 && isNaN(displayQueue[0]) && displayQueue.length === 0) {
                  topDisplayQueue[topDisplayQueue.length - 1] = data;
                  updateDisplay();
             }
            return;
        }

        if (topDisplayQueue.length >= 2) {
            calculateInternal();
             if (isNaN(parseFloat(displayQueue[0]))) {
                updateDisplay();
                return;
             }
        }

        topDisplayQueue = [displayQueue[0], data];
        displayQueue = [];
        justCalculated = false;
    }
    updateDisplay();
}

function calculateInternal() {
    if (topDisplayQueue.length < 2 || displayQueue.length === 0) {
        return; // Hesap yapmaya yetecek data yok
    }

    let num1 = parseFloat(topDisplayQueue[0]);
    let operator = topDisplayQueue[1];
    let num2 = parseFloat(displayQueue[0]);
    let result;

    if (isNaN(num1) || isNaN(num2)) {
        displayQueue = ['Invalid input']; // Hatalar Türkçe mi olsa bilemiyorum
        topDisplayQueue = [];
        justCalculated = true;
        return;
    }

    switch (operator) {
        case '+': result = num1 + num2; break;
        case '-': result = num1 - num2; break;
        case '*': result = num1 * num2; break;
        case '/':
            if (num2 === 0) {
                displayQueue = ['Cannot divide by zero'];
                topDisplayQueue = [];
                justCalculated = true;
                return;
            }
            result = num1 / num2;
            break;
        case '%': // Hesap hatası düzeltildi
             result = num1 * (num2 / 100);
             break;
        // Tek operand'lı işlemler başka yerde halledilecek
        default:
            console.error("Unknown operator in calculateInternal:", operator); // Bu uyarıyı popup'la ekrana taşı, sonrası için lazım
            return;
    }

     if (isNaN(result) || !isFinite(result)) {
        displayQueue = ['Invalid result'];
        topDisplayQueue = [];
        justCalculated = true;
        return;
    }

    displayQueue = [result.toString()];
    topDisplayQueue = [];
}

function calculate() {
    // Tek operand'lı işlemler
     const operator = topDisplayQueue.length > 1 ? topDisplayQueue[1] : null;
     const num1Str = topDisplayQueue.length > 0 ? topDisplayQueue[0] : null;
     let num1 = parseFloat(num1Str);

      if (topDisplayQueue.length === 0 && displayQueue.length > 0) {
           topDisplayQueue = [];
           justCalculated = true;
           updateDisplay();
           return;
      }

     let singleNumberOp = false;
     let result;
     let numToDisplay = parseFloat(displayQueue[0]) || num1;

     if (isNaN(numToDisplay)) {
        if (!isNaN(num1) && ['1/x', 'x²', '√x'].includes(operator)) {
             numToDisplay = num1; // Display boşken operator'ın sayıya ihtiyacı varsa sayıyı kullansın
        } else {
              if (topDisplayQueue.length === 0) {
                resetCalculator();
              }
             return;
        }
     }

     // Tek operand
     switch (operator) {
         case '1/x':
             singleNumberOp = true;
             if (numToDisplay === 0) {
                 result = NaN;
                 displayQueue = ['Cannot divide by zero'];
                 topDisplayQueue = [];
                 justCalculated = true;
                 updateDisplay();
                 return;
             }
             result = 1 / numToDisplay;
             topDisplayQueue = [`1/(${num1Str || displayQueue[0]})`, "="];
             break;
         case 'x²':
             singleNumberOp = true;
             result = numToDisplay * numToDisplay;
             topDisplayQueue = [`sqr(${num1Str || displayQueue[0]})`, "="];
             break;
         case '√x':
             singleNumberOp = true;
              if (numToDisplay < 0) {
                   result = NaN;
                   displayQueue = ['Invalid input'];
                   topDisplayQueue = [];
                   justCalculated = true;
                   updateDisplay();
                   return;
              }
             result = Math.sqrt(numToDisplay);
             topDisplayQueue = [`sqrt(${num1Str || displayQueue[0]})`, "="];
             break;
         default:

              if (topDisplayQueue.length < 2 || displayQueue.length === 0) {
                  // İşlem sonunda eşittire bastıkça son işlem tekrarlanacak, Windows'ta böyle
                  if(justCalculated && topDisplayQueue.length > 2 && !isNaN(parseFloat(topDisplayQueue[2]))) {
                     const lastNum2 = topDisplayQueue[2];
                     const lastOp = topDisplayQueue[1];
                     displayQueue = [lastNum2];
                     topDisplayQueue = [topDisplayQueue[0], lastOp];
                     calculateInternal();

                      if (isNaN(parseFloat(displayQueue[0]))) {
                          updateDisplay();
                          return;
                      }

                  } else {

                      if(topDisplayQueue.length === 0 && displayQueue.length > 0){
                         justCalculated = true;
                         updateDisplay();
                      }

                      return;
                  }
              } else {
                   const num2Str = displayQueue[0];
                   calculateInternal();

                   if (isNaN(parseFloat(displayQueue[0]))) {
                       updateDisplay();
                       return;
                   }

                   topDisplayQueue = [num1Str, operator, num2Str, "="];
                   result = parseFloat(displayQueue[0]);
              }
             break;
     }

     if (isNaN(result) || !isFinite(result)) {

         if (!displayQueue[0].includes("Cannot divide by zero") && !displayQueue[0].includes("Invalid input")) {
             displayQueue = ['Invalid result'];
         }

         if (!singleNumberOp && topDisplayQueue.length < 4) {
              const num2Str = displayQueue[0] || topDisplayQueue[2];
              if (num1Str && operator && num2Str) {
                topDisplayQueue = [num1Str, operator, num2Str, "="];
              } else {
                 topDisplayQueue = [];
              }
         } else if (singleNumberOp && topDisplayQueue.length < 2) {
              topDisplayQueue = [];
         }
         justCalculated = true;
         updateDisplay();
         return;
     }

     displayQueue = [result.toString()];
     justCalculated = true;
     updateDisplay();
}

function handleSingleOp(op) {
     const currentDisplayVal = displayQueue[0];
     const num1Str = topDisplayQueue[0];
     let targetNumberStr = currentDisplayVal;
     let targetNumber;

     // Display boş ama topDisplay doluysa sayıyı oradan çek
      if ((!currentDisplayVal || currentDisplayVal === '') && num1Str && topDisplayQueue.length < 2 ) {
         targetNumberStr = num1Str;
         displayQueue = [num1Str];
     }

     targetNumber = parseFloat(targetNumberStr);

     if (isNaN(targetNumber)) {
         displayQueue = ['Invalid input'];
         topDisplayQueue = [];
         justCalculated = true;
         updateDisplay();
         return;
     }

     let result;
     let topDisplayExpression = "";

     switch (op) {
         case '1/x':
             if (targetNumber === 0) {
                 displayQueue = ['Cannot divide by zero'];
                 topDisplayQueue = [];
                 justCalculated = true;
                 updateDisplay();
                 return;
             }
             result = 1 / targetNumber;
             topDisplayExpression = `1/(${targetNumberStr})`;
             break;
         case 'x²':
             result = targetNumber * targetNumber;
             topDisplayExpression = `sqr(${targetNumberStr})`;
             break;
         case '√x':
             if (targetNumber < 0) {
                  displayQueue = ['Invalid input'];
                  topDisplayQueue = [];
                  justCalculated = true;
                  updateDisplay();
                  return;
             }
             result = Math.sqrt(targetNumber);
             topDisplayExpression = `sqrt(${targetNumberStr})`;
             break;
         default: return;
     }

      if (isNaN(result) || !isFinite(result)) {
         displayQueue = ['Invalid result'];
         topDisplayQueue = [];
     } else {
        displayQueue = [result.toString()];
        topDisplayQueue = [topDisplayExpression, "="];
     }

     justCalculated = true;
     updateDisplay();
 }

function flipSign() {
    if (displayQueue.length === 0 || displayQueue[0] === '' || isNaN(parseFloat(displayQueue[0]))) {
        // Display boşsa pas geç
        return;
    }
    let num = parseFloat(displayQueue[0]);
    displayQueue[0] = (num * -1).toString();
    updateDisplay();
}

function addDecimal() {
    const isLastError = isNaN(parseFloat(displayQueue[0])) && displayQueue.length === 1;
    if (justCalculated || isLastError) {
        displayQueue = ['0.'];
        topDisplayQueue = [];
        justCalculated = false;
    } else if (displayQueue.length === 0 || isNaN(displayQueue[displayQueue.length - 1])) {
        displayQueue.push('0.');
    } else {
        let currentNumber = displayQueue[displayQueue.length - 1];
        if (typeof currentNumber === 'string' && !currentNumber.includes('.')) {
            displayQueue[displayQueue.length - 1] += '.';
        }
    }
    updateDisplay();
}

function deleteLastAction() {

    if (justCalculated || displayQueue.length === 0) {
         if (justCalculated) {
            clearEntry();
            justCalculated = false;
         }
        return;
    }

    let currentEntry = displayQueue[displayQueue.length - 1];
    if (typeof currentEntry === 'string' && currentEntry.length > 0) {
        currentEntry = currentEntry.slice(0, -1);
        if (currentEntry === '' || currentEntry === '-') {
              if(displayQueue.length === 1) {
                  displayQueue = [];
              } else {
                  displayQueue.pop();
              }

        } else {
            displayQueue[displayQueue.length - 1] = currentEntry;
        }
    } else {
       displayQueue.pop();
    }
    updateDisplay();
}

function resetCalculator() {
    topDisplayQueue = [];
    displayQueue = [];
    justCalculated = false;
    updateDisplay();
}

function clearEntry() {
     if(displayQueue.length > 0){
        displayQueue = [];
        justCalculated = false;
        updateDisplay();
     }
}

// Memory Butonları
function setMemoryButtonState() {
    const hasMemory = memoryValues.length > 0;
    const canParseDisplay = displayQueue.length > 0 && !isNaN(parseFloat(displayQueue[0]));

    memoryClear.disabled = !hasMemory;
    memoryClear.style.color = hasMemory ? "white" : "grey";
    memoryRecall.disabled = !hasMemory;
    memoryRecall.style.color = hasMemory ? "white" : "grey";
    memoryDrawerButton.disabled = !hasMemory;
    memoryDrawerButton.style.color = hasMemory ? "white" : "grey";
    memoryPlus.disabled = !canParseDisplay;
    memoryMinus.disabled = !canParseDisplay;
    memoryStore.disabled = !canParseDisplay;
    const memOpColor = canParseDisplay ? "white" : "grey";
    memoryPlus.style.color = memOpColor;
    memoryMinus.style.color = memOpColor;
    memoryStore.style.color = memOpColor;
}

function memoryClearFunc() {
    memoryValues = [];
    memoryDrawer.innerHTML = "";
    if (isDrawerOpen) {
        memoryDrawer.classList.add("hidden");
        isDrawerOpen = false;
    }
    setMemoryButtonState();
}

function memoryRecallFunc() {
    if (memoryValues.length > 0) {
        displayQueue = [memoryValues[memoryValues.length - 1]];
        justCalculated = true;
        updateDisplay();
    }
}

function memoryPlusFunc() {
    if (displayQueue.length === 0 || isNaN(parseFloat(displayQueue[0]))) return;

    const displayedNumber = parseFloat(displayQueue[0]);

    if (memoryValues.length === 0) {
        memoryStoreFunc();
    } else {
        const lastMemoryIndex = memoryValues.length - 1;
        const storedNumber = parseFloat(memoryValues[lastMemoryIndex]);

        if (isNaN(storedNumber)) return;

        const sum = storedNumber + displayedNumber;
        memoryValues[lastMemoryIndex] = sum.toString();

        if (memoryDrawer.children[lastMemoryIndex]) {
            memoryDrawer.children[lastMemoryIndex].textContent = sum.toString().replace(/\./g, ',');
        }
    }
    justCalculated = true;
    setMemoryButtonState();
}

function memoryMinusFunc() {
    if (displayQueue.length === 0 || isNaN(parseFloat(displayQueue[0]))) return;

    const displayedNumber = parseFloat(displayQueue[0]);

    if (memoryValues.length === 0) {
        memoryValues.push((displayedNumber * -1).toString());
        memoryDrawerRowBuilder(memoryValues[0]);
    } else {
        const lastMemoryIndex = memoryValues.length - 1;
        const storedNumber = parseFloat(memoryValues[lastMemoryIndex]);
         if (isNaN(storedNumber)) return;

        const difference = storedNumber - displayedNumber;
        memoryValues[lastMemoryIndex] = difference.toString();

        if (memoryDrawer.children[lastMemoryIndex]) {
            memoryDrawer.children[lastMemoryIndex].textContent = difference.toString().replace(/\./g, ',');
        }
    }
    justCalculated = true;
    setMemoryButtonState();
}

function memoryStoreFunc() {
    if (displayQueue.length === 0 || isNaN(parseFloat(displayQueue[0]))) return;

    const valueToStore = displayQueue[0];

    memoryValues.push(valueToStore);
    memoryDrawerRowBuilder(valueToStore);

    if (isDrawerOpen) {
        memoryDrawer.scrollTop = memoryDrawer.scrollHeight;
    }

    justCalculated = true;
    setMemoryButtonState();
}


function memoryDrawerButtonFunc() {
    if (memoryValues.length === 0) return;

    isDrawerOpen = !isDrawerOpen;
    memoryDrawer.classList.toggle("hidden", !isDrawerOpen);
}

function memoryDrawerRowBuilder(numStr) {
    const drawerRow = document.createElement("p");
    const formattedNum = numStr.replace(/\./g, ',');
    const storedNumber = document.createTextNode(formattedNum);
    drawerRow.append(storedNumber);
    drawerRow.classList.add("memory-row-style");
    memoryDrawer.prepend(drawerRow);
}

// Listener setup
function setupEventListeners() {
    memoryClear.addEventListener('click', memoryClearFunc);
    memoryRecall.addEventListener('click', memoryRecallFunc);
    memoryPlus.addEventListener('click', memoryPlusFunc);
    memoryMinus.addEventListener('click', memoryMinusFunc);
    memoryStore.addEventListener('click', memoryStoreFunc);
    memoryDrawerButton.addEventListener('click', memoryDrawerButtonFunc);

    document.querySelector('button[data-action="percent"]').addEventListener('click', () => notifyDisplay('%'));
    document.querySelector('button[data-action="clear-entry"]').addEventListener('click', clearEntry);
    document.querySelector('button[data-action="clear-all"]').addEventListener('click', resetCalculator);
    document.querySelector('button[data-action="reciprocal"]').addEventListener('click', () => handleSingleOp('1/x'));
    document.querySelector('button[data-action="square"]').addEventListener('click', () => handleSingleOp('x²'));
    document.querySelector('button[data-action="sqrt"]').addEventListener('click', () => handleSingleOp('√x'));
    document.querySelector('button[data-action="divide"]').addEventListener('click', () => notifyDisplay('/'));
    document.querySelector('button[data-action="multiply"]').addEventListener('click', () => notifyDisplay('*'));
    document.querySelector('button[data-action="subtract"]').addEventListener('click', () => notifyDisplay('-'));
    document.querySelector('button[data-action="add"]').addEventListener('click', () => notifyDisplay('+'));
    document.querySelector('button[data-action="negate"]').addEventListener('click', flipSign);
    document.querySelector('button[data-action="decimal"]').addEventListener('click', () => notifyDisplay('.'));
    document.getElementById('delete').addEventListener('click', deleteLastAction);
    document.getElementById('equal').addEventListener('click', calculate);

    const numberButtons = document.querySelectorAll('.numerical');
    numberButtons.forEach(button => {
        const number = button.textContent;
        button.addEventListener('click', () => notifyDisplay(number));
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    updateDisplay();
});