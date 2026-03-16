const fs = require('fs');
const pdf = require('pdf-parse');

async function readPdf(filePath) {
  let dataBuffer = fs.readFileSync(filePath);
  try {
    const data = await pdf(dataBuffer);
    console.log(`--- ${filePath} ---`);
    console.log(data.text);
  } catch(e) { console.error(e) }
}
readPdf('../data/copypastable-template.pdf');
readPdf('../data/Cove Hacks Email Templates (4).pdf');
