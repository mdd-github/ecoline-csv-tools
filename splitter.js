const csvWriter = require('csv-writer');
const csvParser = require('csv-parser');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, 'input');

const getInputCsvFilenames = async () =>
    new Promise((resolve, reject) => {
        fs.readdir(INPUT_DIR, {
            withFileTypes: true
        }, (error, files) => {
            if (error) {
                reject(error);
            } else {
                let filenames = [];
                files.forEach(file => {
                    if (path.extname(file.name) === '.csv') {
                        filenames.push(path.join(INPUT_DIR, file.name));
                    }
                });
                resolve(filenames);
            }
        });
    })

const readInputCsvFile = async (filename) =>
    new Promise((resolve, reject) => {
        let result = [];

        fs.createReadStream(filename)
            .pipe(csvParser())
            .on('data', data => result.push(data))
            .on('end', () => resolve(result))
            .on('error', (error) => reject(error));
    })


const updateHeader = (keys, header) => {
    for(let column of header) {
        const index = keys.indexOf(column.id);
        if(index >= 0) {
            keys.splice(index, 1);
        }
    }

    let newHeader = [...header];
    for(let key of keys) {
        newHeader.push({
            id: key,
            title: key
        });
    }

    return newHeader;
}

const readInputCsvFiles = async (files) =>
    new Promise(async (resolve, reject) => {
        try {
            let result = {
                records: [],
                header: []
            };

            for(let filename of files) {
                const records = await readInputCsvFile(filename);
                result.records = result.records.concat(records);
                result.header = updateHeader(Object.keys(records[0]), result.header);
            }

            resolve(result);
        } catch (e) {
            reject(e);
        }
    });

const splitProperties = (data) => {

    let result = {
        header: [],
        records: []
    };

    for(let record of data.records) {
        if(record.hasOwnProperty('Свойства') && record['Свойства'].length > 0) {
            let properties = record['Свойства'].split('><');
            properties = properties.map(p => p.replace('<p>', '')
                    .replace('</p>', '')
                    .replace('</p', '')
                    .replace('p>', '')
                    .split(':')
                    .map(s => s.trim()));

            for(let property of properties) {
                if(property.length === 1)
                    continue;
                record[property[0]] = property[1];
            }

            result.header = updateHeader(Object.keys(record), result.header);
        }
        result.records.push(record);
    }

    return result;
};


const main = async () => {
    try {
        const filenames = await getInputCsvFilenames();
        const rawData = await readInputCsvFiles(filenames);
        const data = splitProperties(rawData);

        const writer = csvWriter.createObjectCsvWriter({
            path: path.join(__dirname, 'output.csv'),
            header: data.header,
            encoding: 'utf-8'
        });
        await writer.writeRecords(data.records);
    } catch (e) {
        console.error(e);
    }
}
main();