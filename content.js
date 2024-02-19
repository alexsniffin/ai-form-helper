console.log("AI Form Filler started");

const globalFormDataMaps = {};

const port = chrome.runtime.connect({ name: "knockknock" });

document.addEventListener('keydown', handleKeyDown, true);

function handleKeyDown(e) {
    if (e.key === '`') {
        e.preventDefault();
        processForm();
    }
}

function processForm() {
    const formElement = document.activeElement.closest('form');
    if (formElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        console.log('Form found: ' + formElement.tagName);
        const formId = formElement.id || generateUniqueId();
        formElement.id = formId;

        if (!globalFormDataMaps[formId]) {
            globalFormDataMaps[formId] = {};
        }

        globalFormDataMaps[formId]['focusedElement'] = document.activeElement;

        const formHtml = document.activeElement.outerHTML;
        const parentHtml = document.activeElement.parentElement ? document.activeElement.parentElement.outerHTML : '';

        console.log('Form HTML: ' + formHtml);
        console.log('Parent HTML: ' + parentHtml);

        sendMessage({ formId, formHtml, parentHtml });
    }
}

function generateUniqueId() {
    return `form-${Math.random().toString(36).substr(2, 9)}`;
}

function sendMessage(messageData) {
    port.postMessage({
        name: "formDetails",
        data: messageData
    });
    console.log('Message sent');
}

function updateInputValue(inputElement, newValue) {
    let event = new Event('input', { bubbles: true });
    inputElement.value = '';
    inputElement.value = newValue;
    inputElement.dispatchEvent(event);
}

port.onMessage.addListener(function (response) {
    console.log('Message received');
    const { formId, formValue } = response;
    if (globalFormDataMaps[formId] && globalFormDataMaps[formId]['focusedElement']) {
        updateInputValue(globalFormDataMaps[formId]['focusedElement'], formValue);
    } else {
        console.log(`Form ${formId} does not contain a currently focused element to update.`);
    }
});
