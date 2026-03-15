# Verifica Copertura FTTH OpenFiber & FiberCop - FTTH Coverage Checker

A powerful automation tool designed to perform bulk fiber optics (FTTH) coverage checks across Italian network providers like **OpenFiber** and **FiberCop**.

## Description

This script automates the process of verifying FTTH availability for a list of addresses. Instead of manually checking each address on provider websites, you can provide a CSV file, and the script will use **Playwright** to simulate a real browser session, type the address, and parse the result.

### Key Features:
- **Provider Support**: Seamlessly checks both OpenFiber and FiberCop.
- **Bot Detection Bypass**: Uses realistic User-Agents and viewports to avoid being blocked.
- **Robustness**: Handles address suggestions and verifies existence before checking.
- **Output Management**: Generates timestamped CSV reports for easy analysis.

## Requirements

- **Node.js**: Ensure you have a recent version installed.
- **Dependencies**: Install required packages from the project root:

```bash
npm install
```

- **Playwright Browsers**: Install the Chromium engine:

```bash
npx playwright install chromium
```

## Setup

1. **Prepare the configuration**:
   Copy the distribution template to create your working address list:

   ```bash
   cp addresses.csv.dist addresses.csv
   ```

2. **Add your addresses**:
   Edit `addresses.csv` and add the locations you want to check. Ensure the CSV header remains intact.

   **Example `addresses.csv`**:
   ```csv
   city,street,houseNumber
   MILANO,VIA TORINO,4
   ROMA,VIA DEL CORSO,101
   ```

## Usage

To start the processing, run:

```bash
node main.js
```

The script will process addresses sequentially. You will see real-time updates in your console.

## Output

Every time the script runs, it creates a new CSV file in the `output/` directory with a timestamp (e.g., `results-20240315-103000.csv`).

The results file includes:
- **Address details**: City, street, and house number.
- **Provider**: Either OpenFiber or FiberCop.
- **Result**: `covered`, `not_covered`, `not_exist` (if the address wasn't found), or `unknown`.
- **Timestamp**: The exact time the check was performed.

