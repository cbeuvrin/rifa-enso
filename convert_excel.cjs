const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'Lista de participantes/LISTADO FIN DE AÑO_ACT DICIEMBRE.xlsx');
const outputPath = path.join(__dirname, 'src/data/employees.json');

try {
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // Read with header: 1 to get arrays
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Row index 1 is headers (0-based)
    // Data starts at index 2
    const dataRows = rows.slice(2);

    const employees = dataRows.map(row => {
        const id = row[0]; // NÚMERO DE COLABORADOR
        const fullName = row[1]; // NOMBRE
        const title = row[2]; // PUESTO (Role)

        if (!id || !fullName) return null;

        // Clean strings
        const cleanName = String(fullName).trim().toUpperCase();
        // Split logic: Assume last 2 words are surnames, rest are names
        const parts = cleanName.split(/\s+/);

        let name = "";
        let surname = "";

        if (parts.length <= 2) {
            // 1 name, 1 surname (or just 1 name)
            surname = parts.pop() || "";
            name = parts.join(" ");
        } else {
            // 3 or more words -> take last 2 as surname
            const last = parts.pop();
            const secondLast = parts.pop();
            surname = `${secondLast} ${last}`;
            name = parts.join(" ");
        }

        return {
            id: String(id).trim(),
            name: name,
            surname: surname,
            fullName: cleanName,
            role: (String(title).toLowerCase().includes('director') || String(title).toLowerCase().includes('general')) ? 'director' : 'empleado'
        };
    }).filter(e => e !== null);

    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(employees, null, 2));
    console.log(`Successfully converted ${employees.length} employees to ${outputPath}`);

} catch (error) {
    console.error('Error:', error);
    process.exit(1);
}
