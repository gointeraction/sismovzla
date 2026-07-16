const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'public', 'personas_por_albergue.json');

try {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updatedData = data.map(person => {
    return { ...person, origen: "" };
  });
  fs.writeFileSync(filePath, JSON.stringify(updatedData, null, 2));
  console.log('Successfully updated personas_por_albergue.json');
} catch (e) {
  console.error('Error:', e);
}
