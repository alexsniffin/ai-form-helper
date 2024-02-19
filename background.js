const systemPromptPreamble = "You're a helpful assistant.";

let oaiHost, apiKey, fileContent;

function loadSettings(callback) {
    chrome.storage.local.get(['oaiHost', 'apiKey', 'fileContent'], function (data) {
        oaiHost = data.oaiHost || 'http://localhost:8080';
        apiKey = data.apiKey || '';
        fileContent = data.fileContent || '';

        console.log('Settings loaded:', {oaiHost, apiKey, fileContent});

        if (callback) callback();
    });
}


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.type === 'settingsUpdated') {
        loadSettings(() => {
            console.log('Settings have been updated and reloaded.');
        });
    }
});

loadSettings();

async function initExtension() {
    console.log(`Using OAI Host: ${oaiHost}`);

    chrome.runtime.onConnect.addListener(function (port) {
        console.assert(port.name === "knockknock");
        port.onMessage.addListener(async function (msg) {
            if (msg.name === "formDetails") {
                await processFormDetails(msg.data, port, fileContent);
            }
        });
    });
}

async function processFormDetails(formData, port, fileContent) {
    const {formHtml, parentHtml, formId} = formData;
    try {
        const formQuestion = await generateFormQuestion(formHtml, parentHtml);
        const formAnswer = await generateFormAnswer(formQuestion, fileContent);
        port.postMessage({
            formId: formId,
            formValue: formAnswer,
            success: true
        });
    } catch (error) {
        console.error('Error processing form details:', error);
        port.postMessage({
            formId: formId,
            success: false,
            error: error.message
        });
    }
}

async function generateFormQuestion(formHtml, parentHtml) {
    const prompt = `${systemPromptPreamble}
        
Extract useful information about what the form is from this HTML. Rewrite the meaning from the HTML as a question for a user as a answer.

Form HTML:
\`\`\`
${formHtml}
\`\`\`

Parent HTML:
\`\`\`
${parentHtml}
\`\`\`

Answer: `;

    return getChatCompletion(prompt);
}

async function generateFormAnswer(question, documentContent) {
    const prompt = `${systemPromptPreamble}

Using the information in the document, extract an answer to the question. Return a concise, simple, direct answer. Do NOT format the answer, it is a string. BE HONEST, your answer should be from the document. Accuracy is important!

Document:
${documentContent}

Question:
${question}

Truthful Answer: `;

    return getChatCompletion(prompt);
}

async function loadFile(filePath) {
    const response = await fetch(chrome.runtime.getURL(filePath));
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    return response.text();
}

async function getChatCompletion(prompt) {
    const url = `${oaiHost}/v1/chat/completions`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{'role': 'system', 'content': prompt}],
            temperature: 0.5,
            max_tokens: 250,
            top_p: 1.0,
            frequency_penalty: 0.0,
            presence_penalty: 0.0
        })
    });

    if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json();
    return result.choices[0].message.content;
}

initExtension().catch(console.error);
