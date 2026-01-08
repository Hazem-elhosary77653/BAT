#!/usr/bin/env python3
"""
Business Analysis Tool (BAT) Assistant
A command-line tool for business analysis tasks including data analysis, reporting, and insights generation.
"""

import argparse
import sys
import json
import csv
from datetime import datetime
from typing import List, Dict, Any
import statistics

# Constants for trend analysis
TREND_INCREASE_THRESHOLD = 5  # Percentage
TREND_DECREASE_THRESHOLD = -5  # Percentage


class BusinessAnalysisTool:
    """Main class for the Business Analysis Tool Assistant"""
    
    def __init__(self):
        self.data = []
        
    def load_data(self, filepath: str, format: str = 'csv') -> bool:
        """Load data from a file"""
        try:
            if format.lower() == 'csv':
                with open(filepath, 'r', encoding='utf-8') as f:
                    reader = csv.DictReader(f)
                    self.data = list(reader)
            elif format.lower() == 'json':
                with open(filepath, 'r', encoding='utf-8') as f:
                    self.data = json.load(f)
            else:
                print(f"Unsupported format: {format}")
                return False
            print(f"Successfully loaded {len(self.data)} records from {filepath}")
            return True
        except Exception as e:
            print(f"Error loading data: {e}")
            return False
    
    def analyze_numeric_column(self, column_name: str) -> Dict[str, Any]:
        """Analyze a numeric column and return statistics"""
        try:
            values = []
            for row in self.data:
                if column_name in row:
                    try:
                        values.append(float(row[column_name]))
                    except (ValueError, TypeError):
                        continue
            
            if not values:
                return {"error": f"No numeric values found in column '{column_name}'"}
            
            return {
                "column": column_name,
                "count": len(values),
                "mean": statistics.mean(values),
                "median": statistics.median(values),
                "min": min(values),
                "max": max(values),
                "stdev": statistics.stdev(values) if len(values) > 1 else 0,
                "sum": sum(values)
            }
        except Exception as e:
            return {"error": str(e)}
    
    def generate_summary_report(self) -> str:
        """Generate a summary report of the loaded data"""
        if not self.data:
            return "No data loaded. Please load data first."
        
        report = []
        report.append("=" * 60)
        report.append("BUSINESS ANALYSIS SUMMARY REPORT")
        report.append("=" * 60)
        report.append(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        report.append(f"Total Records: {len(self.data)}")
        report.append("")
        
        if self.data and len(self.data) > 0:
            report.append("Available Columns:")
            columns = list(self.data[0].keys())
            for i, col in enumerate(columns, 1):
                report.append(f"  {i}. {col}")
            report.append("")
            
            report.append("Sample Data (first 3 records):")
            for i, row in enumerate(self.data[:3], 1):
                report.append(f"\nRecord {i}:")
                for key, value in row.items():
                    report.append(f"  {key}: {value}")
        
        report.append("")
        report.append("=" * 60)
        return "\n".join(report)
    
    def find_trends(self, column_name: str) -> Dict[str, Any]:
        """Identify trends in a specific column"""
        if not self.data:
            return {"error": "No data loaded"}
        
        try:
            # For numeric data, calculate growth rate
            values = []
            for row in self.data:
                if column_name in row:
                    try:
                        values.append(float(row[column_name]))
                    except (ValueError, TypeError):
                        continue
            
            if len(values) < 2:
                return {"error": "Insufficient data for trend analysis"}
            
            # Calculate simple trend
            first_half = values[:len(values)//2]
            second_half = values[len(values)//2:]
            
            avg_first = statistics.mean(first_half)
            avg_second = statistics.mean(second_half)
            
            growth_rate = ((avg_second - avg_first) / avg_first) * 100 if avg_first != 0 else 0
            
            trend = "Increasing" if growth_rate > TREND_INCREASE_THRESHOLD else "Decreasing" if growth_rate < TREND_DECREASE_THRESHOLD else "Stable"
            
            return {
                "column": column_name,
                "trend": trend,
                "growth_rate": f"{growth_rate:.2f}%",
                "first_half_avg": avg_first,
                "second_half_avg": avg_second
            }
        except Exception as e:
            return {"error": str(e)}
    
    def export_report(self, filepath: str, report_content: str) -> bool:
        """Export report to a file"""
        try:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(report_content)
            print(f"Report exported to {filepath}")
            return True
        except Exception as e:
            print(f"Error exporting report: {e}")
            return False


def main():
    """Main entry point for the Business Analysis Tool"""
    parser = argparse.ArgumentParser(
        description='Business Analysis Tool (BAT) Assistant - Analyze business data and generate insights',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Load data and generate summary report
  python bat.py --load data.csv --summary
  
  # Analyze a specific numeric column
  python bat.py --load data.csv --analyze revenue
  
  # Find trends in data
  python bat.py --load data.csv --trends sales
  
  # Export report to file
  python bat.py --load data.csv --summary --export report.txt
        """
    )
    
    parser.add_argument('--load', help='Load data from file (CSV or JSON)', metavar='FILE')
    parser.add_argument('--format', default='csv', choices=['csv', 'json'], 
                       help='Data format (default: csv)')
    parser.add_argument('--summary', action='store_true', 
                       help='Generate summary report')
    parser.add_argument('--analyze', help='Analyze numeric column', metavar='COLUMN')
    parser.add_argument('--trends', help='Find trends in column', metavar='COLUMN')
    parser.add_argument('--export', help='Export report to file', metavar='FILE')
    parser.add_argument('--version', action='version', version='BAT 1.0.0')
    
    args = parser.parse_args()
    
    # Check if no arguments provided
    if len(sys.argv) == 1:
        parser.print_help()
        return 0
    
    bat = BusinessAnalysisTool()
    
    # Load data if specified
    if args.load:
        if not bat.load_data(args.load, args.format):
            return 1
    
    output = []
    
    # Generate summary report
    if args.summary:
        report = bat.generate_summary_report()
        output.append(report)
        print(report)
    
    # Analyze column
    if args.analyze:
        result = bat.analyze_numeric_column(args.analyze)
        if "error" in result:
            print(f"Error: {result['error']}")
        else:
            analysis_report = f"\nNumerical Analysis for '{args.analyze}':\n"
            analysis_report += "-" * 40 + "\n"
            for key, value in result.items():
                if key != 'column':
                    if isinstance(value, float):
                        analysis_report += f"{key.capitalize()}: {value:.2f}\n"
                    else:
                        analysis_report += f"{key.capitalize()}: {value}\n"
            output.append(analysis_report)
            print(analysis_report)
    
    # Find trends
    if args.trends:
        result = bat.find_trends(args.trends)
        if "error" in result:
            print(f"Error: {result['error']}")
        else:
            trend_report = f"\nTrend Analysis for '{args.trends}':\n"
            trend_report += "-" * 40 + "\n"
            for key, value in result.items():
                if key != 'column':
                    trend_report += f"{key.replace('_', ' ').capitalize()}: {value}\n"
            output.append(trend_report)
            print(trend_report)
    
    # Export report if specified
    if args.export and output:
        full_report = "\n\n".join(output)
        bat.export_report(args.export, full_report)
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
