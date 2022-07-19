// Ace Editor Config

const editor = ace.edit('editor');

const setEditorConfig = () => {
    ace.config.set(
        'basePath',
        'https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.13/'
    );
    editor.setShowPrintMargin(false);
    editor.getSession().setMode('ace/mode/json');
    editor.getSession().setTabSize(2);
    editor.getSession().setUseWrapMode(true);
};

// Functions

const jsonToCsv = (json) => {
    let array = typeof json != 'object' ? JSON.parse(json) : json;
    let str = '';

    if (!Array.isArray(json)) {
        let keys = Object.keys(array);
        let result = keys.join(",") + "\n";
        result += keys.map(k => {
            if (typeof array[k] === 'object') {
                return JSON.stringify(array[k]);
            }
            return array[k];
        }).join(",") + "\n";
        return result;
    } else {
        for (let i = 0; i < array.length; i++) {
            let line = '';
            for (let index in array[i]) {
                if (typeof array[i][index] === 'object') {
                    array[i][index] = JSON.stringify(array[i][index]);
                }
                if (line !== '') line += ',';
                line += array[i][index];
            }
            str += line + '\r\n';
        }
        str = maxKeyObj(array) + '\n' + str;
        return str;
    }


};

const maxKeyObj = (objArray) => {

    let max = 0;
    let index;

    objArray.forEach((obj, i) => {
        let objKeyLength = Object.keys(obj).length;

        if (objKeyLength > max) {
            max = Object.keys(obj).length;
            index = i;
        }
    });

    return Object.keys(objArray[index]);

};


class JsonToCsvConverter {

    // Selectors

    errorMsg = document.querySelector('.error');

    inputFile = document.getElementById('json');

    uploadButton = document.querySelector('.upload-btn');

    jsonFileContainer = document.querySelector('.json-file');

    resultSection = document.querySelector('.result-section');

    tableContainer = document.querySelector('.table-container');


    constructor() {
        setEditorConfig();
        this.editorOnChange();
    }

    editorOnChange() {
        editor.on('change', () => {

            if (editor.curOp && editor.curOp.command.name) {
                this.errorMsg.style.display = 'none';
                setTimeout(() => {
                    let text = editor.getValue();
                    let errors = editor.getSession().getAnnotations();

                    if (editor.getValue() === '') {

                        this.tableContainer.style.display = 'none';

                        if (document.querySelector('.download-container')) {
                            document.querySelector('.download-container').remove();
                        }

                    }
                    if (errors.length === 0) {
                        this.createTable(JSON.parse(text), null);
                    }
                }, 500);

            }


        });
    }

    checkFile(json) {

        if (this.getExtension(json) !== 'json') {
            this.errorMsg.innerHTML = `<i class = "ph-warning"></i> <span style="margin-left: 10px">Please Select JSON</span> `;
            this.errorMsg.style.display = 'flex';
        } else if (json.size > 3000000) {
            this.errorMsg.innerHTML = `<i class = "ph-warning"></i> <span style="margin-left: 10px">File Is Too Large</span> `;
            this.errorMsg.style.display = 'flex';
        } else {
            document.querySelector('.label-text').textContent = json.name;
            this.readJson(json);
            this.addCloseButton();
        }

    }

    addCloseButton() {
        const closeBtn = document.createElement('i');
        closeBtn.classList.add('ph-x-circle');
        this.jsonFileContainer.appendChild(closeBtn);
        closeBtn.addEventListener('click', () => this.clearInput());
        this.errorMsg.style.display = 'none';
        this.uploadButton.classList.add('disable');
    }

    readJson(jsonFile) {
        const reader = new FileReader();
        reader.readAsText(jsonFile, 'UTF-8');

        const loaded = (e) => {
            const fr = e.target;
            let result = fr.result;
            if (!this.isValidJson(result)) {
                this.errorMsg.innerHTML = `<i class = "ph-warning"></i> <span style="margin-left: 10px">Json Is Not Valid</span>`;
                this.errorMsg.style.display = 'flex';
                document.querySelector('.label-text').textContent = 'Upload File';
                document.querySelector('.ph-x-circle').remove();
                this.uploadButton.classList.remove('disable');

            } else {
                result = JSON.parse(result);
                this.assignTextEditorValue(result);
                this.createTable(result, jsonFile);
                this.scrollIntoView('.download-csv');
            }
        };
        reader.addEventListener('loadend', loaded);
        reader.onerror = function () {
            editor.setValue('Error Reading File');
        };
    }

    isValidJson(json) {
        try {
            JSON.parse(json);
            return true;
        } catch (e) {
            return false;
        }
    }

    assignTextEditorValue(text) {
        editor.setValue(JSON.stringify(text, null, '\t'));
    }

    scrollIntoView(scrollToElClass) {
        document.querySelector(scrollToElClass).scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'nearest',
        });
    }

    checkInputForTable(jsonText) {
        let objArray;
        if (!Array.isArray(jsonText)) {
            const headers = Object.keys(jsonText);
            const values = headers.map((key) => jsonText[key]);
            objArray = [headers, values];
        } else {
            let values = [];
            const headers = maxKeyObj(jsonText);
            jsonText.forEach((obj) => values.push(headers.map((key) => !obj[key] ? '-' : obj[key])));
            objArray = [headers, ...values];
        }
        return objArray;
    }

    createTable(jsonText, jsonFile) {
        document.querySelector('.table')?.remove();

        const objArray = this.checkInputForTable(jsonText);

        let table = document.createElement('TABLE');
        table.classList.add('table');
        this.tableContainer.appendChild(table);
        this.tableContainer.style.display = 'block';

        let row = table.insertRow(-1);

        objArray.shift().forEach((el) => {
            let headerCell = document.createElement('TH');
            headerCell.innerHTML = el;
            row.appendChild(headerCell);
        });
        objArray.forEach((arr) => {
            row = table.insertRow(-1);

            objArray[0].forEach((el, i) => {
                if (typeof arr[i] === 'object') {
                    arr[i] = JSON.stringify(arr[i]);
                }
                let cell = row.insertCell(-1);
                cell.innerHTML = arr[i];

                if (cell.scrollWidth > cell.clientWidth) {
                    cell.setAttribute('title', JSON.stringify(arr[i]));
                }
            });
        });

        if (!document.querySelector('.download-container')) {
            this.createDownloadContainer(jsonFile, jsonText);
        }
        this.setDownloadableFile(jsonText, '.download-csv');
    }

    clearInput() {
        document.querySelector('.label-text').textContent = 'Upload File';
        this.uploadButton.classList.remove('disable');
        document.querySelector('.ph-x-circle').remove();
        document.querySelector('.table').remove();
        document.querySelector('.download-csv').remove();
        document.querySelector('.download-container').remove();
        this.tableContainer.style.display = 'none';
        this.inputFile.value = '';
        editor.setValue('');
    }

    getExtension(file) {
        const parts = file.name.split('.');
        return parts[parts.length - 1];
    }

    setDownloadableFile(json, elClass) {
        return document.querySelector(elClass).href =
            'data:text/csv;charset=utf-8,' + encodeURI(jsonToCsv(json));
    }

    createDownloadContainer(jsonFile, jsonText) {

        let downloadContainer = document.createElement('div');
        let copyToClipboardButton = document.createElement('button');
        let downloadButton = document.createElement('a');
        let inputFileName = document.createElement('input');
        let downloadFileExtension = document.createElement('span');
        let inputContainer = document.createElement('div');
        let buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');
        inputContainer.classList.add('input-container');
        buttonContainer.appendChild(downloadButton);
        buttonContainer.appendChild(copyToClipboardButton);
        inputContainer.appendChild(inputFileName);
        inputContainer.appendChild(downloadFileExtension);
        inputFileName.placeholder = 'File Name';
        if (jsonFile) {
            inputFileName.value = jsonFile.name.slice(
                0,
                jsonFile.name.length - 5
            );
            downloadButton.download = jsonFile.name.slice(
                0,
                jsonFile.name.length - 5
            );
        }
        inputFileName.addEventListener('input', () => {
            downloadButton.download = inputFileName.value;
        });
        copyToClipboardButton.innerText = 'Copy To Clipboard';
        downloadContainer.classList.add('download-container');
        downloadFileExtension.classList.add('download-file-extension');
        downloadFileExtension.innerHTML = '.csv';
        inputFileName.classList.add('input-file-name');
        downloadButton.classList.add('download-csv');
        copyToClipboardButton.classList.add('copy-button');
        copyToClipboardButton.addEventListener('click', () => {
            this.copyToClipboard(JSON.stringify(jsonText)).then(() => {
            });
        });
        downloadButton.innerHTML = 'Download Csv';
        downloadContainer.appendChild(inputContainer);
        downloadContainer.appendChild(buttonContainer);
        this.resultSection.appendChild(downloadContainer);
        downloadButton.href = 'data:text/csv;charset=utf-8,' + encodeURI(jsonToCsv(jsonText));
    }

    copyToClipboard(copyText) {
        let copyButton = document.querySelector('.copy-button');
        copyButton.innerText = 'Copied!';
        copyButton.disabled = true;
        setTimeout(() => {
            copyButton.innerText = 'Copy To Clipboard';
            copyButton.disabled = false;
        }, 1000);
        return navigator.clipboard.writeText(copyText);

    }

}

const jsonToCsvConverter = new JsonToCsvConverter();
