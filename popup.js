document.addEventListener('DOMContentLoaded', function () {
    chrome.storage.local.get(['oaiHost', 'apiKey', 'fileContent'], function (result) {
        if (result.oaiHost !== undefined) {
            document.getElementById('oaiHost').value = result.oaiHost;
        }
        if (result.apiKey !== undefined) {
            document.getElementById('apiKey').value = result.apiKey;
        }
        if (result.fileContent !== undefined) {
            document.getElementById('fileContent').textContent = result.fileContent;
        }
    });

    const form = document.getElementById('settingsForm');
    form.addEventListener('submit', function (e) {
        e.preventDefault();

        const oaiHost = document.getElementById('oaiHost').value;
        const apiKey = document.getElementById('apiKey').value;
        const fileContent = document.getElementById('fileContent').value;

        chrome.storage.local.set({oaiHost, apiKey, fileContent}, function () {
            console.log('Settings saved');
            chrome.runtime.sendMessage({type: 'settingsUpdated'});
            window.close();
        });
    });

    chrome.storage.local.get(['oaiHost', 'apiKey', 'fileContent'], function (data) {
        document.getElementById('oaiHost').value = data.oaiHost || '';
        document.getElementById('apiKey').value = data.apiKey || '';
        document.getElementById('fileContent').value = data.fileContent || '';
    });
});
