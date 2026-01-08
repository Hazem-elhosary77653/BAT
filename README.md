# BAT - Business Analysis Tool Assistant

A lightweight, command-line business analysis tool that helps you analyze data, generate insights, and create reports.

## Features

- 📊 **Data Analysis**: Analyze numeric columns with statistical metrics (mean, median, min, max, standard deviation)
- 📈 **Trend Detection**: Identify trends and growth rates in your business data
- 📋 **Summary Reports**: Generate comprehensive summary reports of your datasets
- 💾 **Multiple Formats**: Support for CSV and JSON data formats
- 📄 **Export Capabilities**: Export analysis results to text files

## Installation

No external dependencies required! BAT uses only Python standard library.

```bash
# Clone the repository
git clone https://github.com/Hazem-elhosary77653/BAT.git
cd BAT

# Make the script executable (optional)
chmod +x bat.py
```

**Requirements**: Python 3.6 or higher

## Usage

### Basic Commands

```bash
# Display help and available options
python bat.py --help

# Load data and generate summary report
python bat.py --load example_data.csv --summary

# Analyze a specific numeric column
python bat.py --load example_data.csv --analyze revenue

# Find trends in data
python bat.py --load example_data.csv --trends profit

# Combine multiple analyses
python bat.py --load example_data.csv --summary --analyze revenue --trends profit

# Export report to file
python bat.py --load example_data.csv --summary --export report.txt
```

### Working with JSON Data

```bash
# Load and analyze JSON data
python bat.py --load data.json --format json --summary
```

## Example Output

### Summary Report
```
============================================================
BUSINESS ANALYSIS SUMMARY REPORT
============================================================
Generated: 2026-01-08 10:00:00
Total Records: 12

Available Columns:
  1. month
  2. revenue
  3. expenses
  4. profit
  5. customers

Sample Data (first 3 records):
...
============================================================
```

### Numeric Analysis
```
Numerical Analysis for 'revenue':
----------------------------------------
Count: 12
Mean: 65583.33
Median: 65500.00
Min: 50000.00
Max: 82000.00
Stdev: 10392.30
Sum: 787000.00
```

### Trend Analysis
```
Trend Analysis for 'profit':
----------------------------------------
Trend: Increasing
Growth rate: 82.61%
First half avg: 22833.33
Second half avg: 36833.33
```

## Example Data

The repository includes `example_data.csv` with sample business metrics:
- Monthly revenue, expenses, and profit data
- Customer count tracking
- 12 months of data for trend analysis

## Command-Line Options

| Option | Description |
|--------|-------------|
| `--load FILE` | Load data from CSV or JSON file |
| `--format {csv,json}` | Specify data format (default: csv) |
| `--summary` | Generate summary report of the data |
| `--analyze COLUMN` | Perform statistical analysis on a numeric column |
| `--trends COLUMN` | Identify trends in a specific column |
| `--export FILE` | Export report to a text file |
| `--version` | Display version information |
| `--help` | Show help message and examples |

## Use Cases

- **Financial Analysis**: Analyze revenue, expenses, and profit trends
- **Sales Performance**: Track customer growth and sales metrics
- **Business Reporting**: Generate quick insights from business data
- **Data Exploration**: Quickly understand your datasets before deeper analysis

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is open source and available for business analysis purposes.

## Author

Business Analysis Tool (BAT) Assistant v1.0.0