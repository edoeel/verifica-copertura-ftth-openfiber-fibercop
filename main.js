const fs = require('fs');
const path = require('path');
const { runForAddressOpenFiber } = require('./src/openfiber-coverage');
const { runForAddressFiberCop } = require('./src/fibercop-coverage');

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

function createOutputStream() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const fileName = [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    '-',
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds()),
  ].join('');

  const filePath = path.join(outputDir, `results-${fileName}.csv`);

  // header
  fs.writeFileSync(
    filePath,
    'city,street,houseNumber,provider,result\n',
    'utf8',
  );

  return filePath;
}

function appendResultRow(filePath, {
  provider,
  city,
  street,
  houseNumber,
  result,
}) {
  const line = `"${city}","${street}","${houseNumber}","${provider}","${result}"\n`;
  fs.appendFileSync(filePath, line, 'utf8');
}

function logToConsole({ provider, city, street, houseNumber, result }) {
  const prefix = `${city}, ${street} ${houseNumber}:`;
  let label;

  switch (result) {
    case 'covered':
      label = '✅ COVERED';
      break;
    case 'not_covered':
      label = '❌ NOT COVERED';
      break;
    case 'not_exist':
      label = '❓ NOT EXIST';
      break;
    default:
      label = '☠️ UNKNOWN';
      break;
  }

  // eslint-disable-next-line no-console
  console.log(`${prefix} ${label} by ${provider}`);
}

async function main() {
  const addresses = loadConfig();
  const outputFilePath = createOutputStream();

  for (const addr of addresses) {
    // eslint-disable-next-line no-await-in-loop
    const ofResult = await runForAddressOpenFiber(addr);
    const ofRecord = {
      provider: 'OpenFiber',
      city: addr.city,
      street: addr.street,
      houseNumber: addr.houseNumber,
      result: ofResult,
    };
    logToConsole(ofRecord);
    appendResultRow(outputFilePath, ofRecord);

    // eslint-disable-next-line no-await-in-loop
    const fcResult = await runForAddressFiberCop(addr);
    const fcRecord = {
      provider: 'FiberCop',
      city: addr.city,
      street: addr.street,
      houseNumber: addr.houseNumber,
      result: fcResult,
    };
    logToConsole(fcRecord);
    appendResultRow(outputFilePath, fcRecord);
  }
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

