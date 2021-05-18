const parser = require('csv-parser');
const fs = require('fs');
const path = require('path');
const {execSync} = require('child_process');

const readCsv = async (fileName) =>
	new Promise(resolve => {
		let rows = [];

		fs.createReadStream(fileName, {encoding: 'utf16le'})
			.pipe(parser({separator: '\t'}))
			.on('data', data => rows.push(data))
			.on('end', () => resolve(rows));
	});

const downloadSingleImage = (url, paths) => {
	let filename = url.split('/');
	filename = filename[filename.length - 1];

	for(const p of paths) {
		execSync(`mkdir -p "./out/${p}/"`, {stdio: 'ignore'});
		execSync(`wget "${url}" -O "./out/${p}/${filename}"`, {stdio: 'ignore'});
	}
};

const downloadImages = async (rows) =>
	new Promise(resolve => {
		let count = 0;

		for(let i = 688; i < rows.length; i++) {
			const row = rows[i];

			const urls = row['Изображения'].split(' ');
			const name = row['Название товара'].replace(/,/g, '').replace(/"/g, '');
			const collections = row['Размещение на сайте']
				.split('##')
				.map(path => path.trim())
				.sort((a, b) => b.length - a.length);

			const paths = [collections[0].replace(/,/g, '').replace(/"/g, '') + '/' + name];
			for(let i = 1; i < collections.length; i++) {
				if(false === collections[i - 1].includes(collections[i])) {
					paths.push(collections[i].replace(/,/g, '').replace(/"/g, '') + '/' + name);
				}
			}

			for(const url of urls) {
				downloadSingleImage(url, paths);
			}

			console.log(name);
			console.log(`==== ${count++} / ${rows.length} is done ====`);
		}

		resolve();
	});

(async () => {
	const rows = await readCsv(path.resolve(__dirname, 'cosmetics.csv'));
	await downloadImages(rows);
})();