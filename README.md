## FTTH coverage spiders

### Requirements

- **Node.js** installed
- Project dependencies installed (from the repo root):

```bash
npm install
```

Playwright and browsers must also be installed, for example:

```bash
npx playwright install
```

### Setup

1. Copy the sample file:

```bash
cp addresses.csv.dist addresses.csv
```

2. Edit `addresses.csv`, adding one row for each address you want to check.

Example `addresses.csv`:

```csv
city,street,houseNumber
MILANO,VIA TORINO,4
MILANO,VIA TORINO,5
```

### Run

To start the script, run from the project root:

```bash
node main.js
```

Addresses from `addresses.csv` will be processed sequentially (never in parallel). The script will check coverage for each address and print the result to the log.
