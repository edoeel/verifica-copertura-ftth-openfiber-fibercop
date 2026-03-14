const fs = require('fs');
const path = require('path');
const { runForAddressOpenFiber } = require('./src/openfiber-coverage');

function loadConfig() {
  const configPath = path.join(__dirname, 'addresses.csv');
  const raw = fs.readFileSync(configPath, 'utf8');

  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));

  if (lines.length === 0) {
    throw new Error('Config non valida: file CSV vuoto.');
  }

  // Prima riga: header (city,street,houseNumber)
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const cityIdx = header.indexOf('city');
  const streetIdx = header.indexOf('street');
  const houseIdx = header.indexOf('housenumber');

  if (cityIdx === -1 || streetIdx === -1 || houseIdx === -1) {
    throw new Error(
      'Config non valida: header CSV deve contenere city,street,houseNumber.',
    );
  }

  const addresses = lines
    .slice(1)
    .map((line) => line.split(',').map((v) => v.trim()))
    .map((cols) => ({
      city: cols[cityIdx] || '',
      street: cols[streetIdx] || '',
      houseNumber: cols[houseIdx] || '',
    }))
    .filter((a) => a.city && a.street && a.houseNumber);

  if (addresses.length === 0) {
    throw new Error(
      'Config non valida: nessun indirizzo valido (city, street, houseNumber).',
    );
  }

  return addresses;
}

async function main() {
  const addresses = loadConfig();

  for (const addr of addresses) {
    // eslint-disable-next-line no-await-in-loop
    await runForAddressOpenFiber(addr);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

