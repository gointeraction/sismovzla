import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/firebase';
import fs from 'fs';

async function exportOccupants() {
  try {
    const querySnapshot = await getDocs(collection(db, 'shelter_occupants'));
    const occupants: any[] = [];
    querySnapshot.forEach((doc) => {
      occupants.push({ id: doc.id, ...doc.data() });
    });
    fs.writeFileSync('personas_albergadas.json', JSON.stringify(occupants, null, 2));
    console.log('Exported ' + occupants.length + ' occupants to personas_albergadas.json');
    process.exit(0);
  } catch (err) {
    console.error('Error exporting occupants:', err);
    process.exit(1);
  }
}

exportOccupants();
