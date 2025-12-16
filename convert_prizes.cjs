const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Lista de premios/PREMIOS MULTIVA.xlsx');
const outputPath = path.join(__dirname, 'src/data/prizes.json');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read with header
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    console.log('Headers:', rows[0]);
    // Expecting columns roughly like [Quantity, Prize Name]

    // Skip header row
    const dataRows = rows.slice(1);

    const prizes = dataRows.map(row => {
        // Inspect row structure to map correctly
        // Assuming Column A = ID/Index? Column B = Quantity? Column C = Name?
        // I will first run this script to see the logs, then refine the mapping.
        // For now, let's try to grab non-empty stuff.
        return row;
    });

    console.log('Sample Row:', dataRows[0]);

    // Simple heuristic for now: find number and string
    const refinedPrizes = dataRows.map(row => {
        let quantity = 0;
        let name = "";

        row.forEach(cell => {
            if (typeof cell === 'number') quantity = cell;
            if (typeof cell === 'string') name = cell.trim();
        });

        if (name && quantity > 0) {
            return { name, total: quantity };
        }
        return null;
    }).filter(p => p !== null);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(refinedPrizes, null, 2));
    console.log(`Successfully converted ${refinedPrizes.length} prize types to ${outputPath}`);
    console.log(refinedPrizes);

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
