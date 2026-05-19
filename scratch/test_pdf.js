const fs = require('fs');
const pdf = require('pdf-parse');

async function testPdf() {
    try {
        // Create a dummy PDF or try to read one if it exists
        // Actually, just passing an invalid buffer to see if the library is loaded correctly
        const dataBuffer = Buffer.from('not a real pdf');
        await pdf(dataBuffer);
    } catch (error) {
        console.error('Test Error:', error.message);
    }
}

testPdf();
