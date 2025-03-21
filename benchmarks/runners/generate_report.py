#!/usr/bin/env python
"""
Benchmark Report Generator

This script generates HTML and PDF reports from benchmark results.
"""

import os
import sys
import json
import argparse
import datetime
import logging
import glob
from pathlib import Path
from typing import Dict, List, Optional, Any

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("report_generator")

# Try to import optional dependencies
try:
    import pandas as pd
    import matplotlib.pyplot as plt
    import seaborn as sns
    import nbformat
    from nbconvert import HTMLExporter
    NOTEBOOK_AVAILABLE = True
except ImportError:
    NOTEBOOK_AVAILABLE = False
    logger.warning("Optional dependencies not available. Install pandas, matplotlib, seaborn, "
                   "nbformat, and nbconvert for enhanced reporting.")

def generate_report(
    results_dir: str,
    output_dir: str,
    app_version: str,
    baseline_version: Optional[str] = None,
    report_title: Optional[str] = None
) -> None:
    """Generate performance report from benchmark results.
    
    Args:
        results_dir: Directory containing benchmark results
        output_dir: Directory to save reports
        app_version: Current application version
        baseline_version: Baseline version for comparison (optional)
        report_title: Custom report title (optional)
    """
    os.makedirs(output_dir, exist_ok=True)
    
    # Find all result files
    result_files = glob.glob(os.path.join(results_dir, "*_results_*.json"))
    comparison_files = glob.glob(os.path.join(results_dir, "*_comparison_*.json"))
    summary_files = glob.glob(os.path.join(results_dir, "benchmark_summary_*.json"))
    
    if not result_files:
        logger.error(f"No result files found in {results_dir}")
        return
    
    # Try to find a summary file
    summary_data = None
    if summary_files:
        # Use the most recent summary file
        summary_files.sort(reverse=True)
        with open(summary_files[0], "r") as f:
            summary_data = json.load(f)
    
    # Load all result files
    results = []
    for file_path in result_files:
        try:
            with open(file_path, "r") as f:
                result = json.load(f)
                results.append(result)
        except Exception as e:
            logger.error(f"Error loading result file {file_path}: {str(e)}")
    
    # Load all comparison files
    comparisons = []
    for file_path in comparison_files:
        try:
            with open(file_path, "r") as f:
                comparison = json.load(f)
                comparisons.append(comparison)
        except Exception as e:
            logger.error(f"Error loading comparison file {file_path}: {str(e)}")
    
    # Generate HTML report
    generate_html_report(
        results=results,
        comparisons=comparisons,
        summary=summary_data,
        output_dir=output_dir,
        app_version=app_version,
        baseline_version=baseline_version,
        report_title=report_title
    )
    
    # Generate notebook report if dependencies are available
    if NOTEBOOK_AVAILABLE:
        generate_notebook_report(
            results=results,
            comparisons=comparisons,
            summary=summary_data,
            output_dir=output_dir,
            app_version=app_version,
            baseline_version=baseline_version,
            report_title=report_title
        )
    else:
        logger.warning("Skipping notebook report generation due to missing dependencies")


def generate_html_report(
    results: List[Dict[str, Any]],
    comparisons: List[Dict[str, Any]],
    summary: Optional[Dict[str, Any]],
    output_dir: str,
    app_version: str,
    baseline_version: Optional[str] = None,
    report_title: Optional[str] = None
) -> None:
    """Generate HTML report from benchmark results.
    
    Args:
        results: List of benchmark results
        comparisons: List of comparison results
        summary: Summary data
        output_dir: Directory to save report
        app_version: Current application version
        baseline_version: Baseline version for comparison
        report_title: Custom report title
    """
    if not report_title:
        if baseline_version:
            report_title = f"Performance Benchmark: {app_version} vs {baseline_version}"
        else:
            report_title = f"Performance Benchmark: {app_version}"
    
    # Start building HTML content
    html_content = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{report_title}</title>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 1200px;
                margin: 0 auto;
                padding: 20px;
            }}
            h1, h2, h3, h4 {{
                color: #2c3e50;
            }}
            table {{
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 20px;
            }}
            th, td {{
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }}
            th {{
                background-color: #f2f2f2;
            }}
            .regression {{
                color: #e74c3c;
                font-weight: bold;
            }}
            .improvement {{
                color: #27ae60;
                font-weight: bold;
            }}
            .summary {{
                background-color: #f9f9f9;
                padding: 15px;
                border-radius: 5px;
                margin-bottom: 20px;
            }}
            .test-section {{
                margin-bottom: 40px;
                border-bottom: 1px solid #eee;
                padding-bottom: 20px;
            }}
        </style>
    </head>
    <body>
        <h1>{report_title}</h1>
        <p>Report generated on {datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
    """
    
    # Add summary section if available
    if summary:
        has_regressions = summary.get("has_regressions", False)
        test_count = summary.get("tests", 0)
        successful_tests = summary.get("successful_tests", 0)
        
        html_content += f"""
        <div class="summary">
            <h2>Summary</h2>
            <p><strong>Version:</strong> {summary.get("app_version", app_version)}</p>
            <p><strong>Baseline:</strong> {summary.get("baseline_version", baseline_version or "None")}</p>
            <p><strong>Tests Run:</strong> {successful_tests} / {test_count}</p>
            <p><strong>Regressions:</strong> {"Yes" if has_regressions else "No"}</p>
        """
        
        if has_regressions:
            regression_counts = summary.get("regressions", {})
            html_content += f"""
            <p><strong>Regression Details:</strong></p>
            <ul>
                <li>API Endpoints: {regression_counts.get("api", 0)}</li>
                <li>System Resources: {regression_counts.get("resources", 0)}</li>
                <li>Message Queues: {regression_counts.get("queues", 0)}</li>
            </ul>
            """
        
        html_content += "</div>"
    
    # Add test results sections
    for result in results:
        test_name = "Unknown Test"
        if "benchmark_info" in result and result["benchmark_info"]:
            test_info = result["benchmark_info"]
            test_name = test_info.get("notes", "").replace("CI run for ", "") or f"Test {test_info.get('id', '')}"
            test_type = test_info.get("test_type", "load")
            environment = test_info.get("environment", "test")
            
            html_content += f"""
            <div class="test-section">
                <h2>{test_name}</h2>
                <p><strong>Type:</strong> {test_type}</p>
                <p><strong>Environment:</strong> {environment}</p>
                <p><strong>Run ID:</strong> {test_info.get("run_id", "N/A")}</p>
            """
        else:
            html_content += f"""
            <div class="test-section">
                <h2>{test_name}</h2>
            """
        
        # Add API metrics summary
        api_metrics = result.get("summary_metrics", {}).get("api", {})
        if api_metrics:
            html_content += """
            <h3>API Endpoint Performance</h3>
            <table>
                <thead>
                    <tr>
                        <th>Endpoint</th>
                        <th>Avg Response Time (ms)</th>
                        <th>Min Response Time (ms)</th>
                        <th>Max Response Time (ms)</th>
                        <th>Request Count</th>
                        <th>Error Count</th>
                        <th>Error Rate (%)</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for endpoint, metrics in api_metrics.items():
                error_rate = 0
                if metrics.get("request_count", 0) > 0:
                    error_rate = (metrics.get("error_count", 0) / metrics.get("request_count", 1)) * 100
                
                html_content += f"""
                <tr>
                    <td>{endpoint}</td>
                    <td>{metrics.get("avg_response_time_ms", 0):.2f}</td>
                    <td>{metrics.get("min_response_time_ms", 0):.2f}</td>
                    <td>{metrics.get("max_response_time_ms", 0):.2f}</td>
                    <td>{metrics.get("request_count", 0)}</td>
                    <td>{metrics.get("error_count", 0)}</td>
                    <td>{error_rate:.2f}%</td>
                </tr>
                """
            
            html_content += """
                </tbody>
            </table>
            """
        
        # Add resource metrics summary
        resource_metrics = result.get("summary_metrics", {}).get("resources", {})
        if resource_metrics:
            html_content += """
            <h3>Resource Utilization</h3>
            <table>
                <thead>
                    <tr>
                        <th>Service</th>
                        <th>Avg CPU (%)</th>
                        <th>Max CPU (%)</th>
                        <th>Avg Memory (MB)</th>
                        <th>Max Memory (MB)</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for service, metrics in resource_metrics.items():
                html_content += f"""
                <tr>
                    <td>{service}</td>
                    <td>{metrics.get("avg_cpu_percent", 0):.2f}</td>
                    <td>{metrics.get("max_cpu_percent", 0):.2f}</td>
                    <td>{metrics.get("avg_memory_mb", 0):.2f}</td>
                    <td>{metrics.get("max_memory_mb", 0):.2f}</td>
                </tr>
                """
            
            html_content += """
                </tbody>
            </table>
            """
        
        # Add queue metrics summary
        queue_metrics = result.get("summary_metrics", {}).get("queues", {})
        if queue_metrics:
            html_content += """
            <h3>Message Queue Performance</h3>
            <table>
                <thead>
                    <tr>
                        <th>Queue</th>
                        <th>Avg Length</th>
                        <th>Max Length</th>
                        <th>Avg Processing Time (ms)</th>
                        <th>Max Processing Time (ms)</th>
                    </tr>
                </thead>
                <tbody>
            """
            
            for queue, metrics in queue_metrics.items():
                html_content += f"""
                <tr>
                    <td>{queue}</td>
                    <td>{metrics.get("avg_queue_length", 0):.2f}</td>
                    <td>{metrics.get("max_queue_length", 0):.2f}</td>
                    <td>{metrics.get("avg_processing_time_ms", 0):.2f}</td>
                    <td>{metrics.get("max_processing_time_ms", 0):.2f}</td>
                </tr>
                """
            
            html_content += """
                </tbody>
            </table>
            """
        
        html_content += "</div>"  # Close test-section
    
    # Add comparison results if available
    if comparisons:
        html_content += """
        <h2>Performance Comparisons</h2>
        """
        
        for comparison in comparisons:
            baseline_version = comparison.get("baseline_version", "Unknown")
            current_version = comparison.get("current_version", app_version)
            has_regressions = comparison.get("has_regressions", False)
            
            html_content += f"""
            <div class="test-section">
                <h3>{current_version} vs {baseline_version}</h3>
                <p><strong>Regressions:</strong> {"Yes" if has_regressions else "No"}</p>
            """
            
            # Add API endpoint comparisons
            api_comparisons = comparison.get("api", {})
            if api_comparisons:
                html_content += """
                <h4>API Endpoint Comparisons</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Endpoint</th>
                            <th>Baseline (ms)</th>
                            <th>Current (ms)</th>
                            <th>Absolute Change (ms)</th>
                            <th>Percent Change</th>
                        </tr>
                    </thead>
                    <tbody>
                """
                
                for endpoint, data in api_comparisons.items():
                    css_class = ""
                    if data.get("regression", False):
                        css_class = "regression"
                    elif data.get("percent_change", 0) < 0:
                        css_class = "improvement"
                    
                    html_content += f"""
                    <tr class="{css_class}">
                        <td>{endpoint}</td>
                        <td>{data.get("baseline", 0):.2f}</td>
                        <td>{data.get("current", 0):.2f}</td>
                        <td>{data.get("absolute_change", 0):.2f}</td>
                        <td>{data.get("percent_change", 0):.2f}%</td>
                    </tr>
                    """
                
                html_content += """
                    </tbody>
                </table>
                """
            
            # Add resource comparisons
            resource_comparisons = comparison.get("resources", {})
            if resource_comparisons:
                html_content += """
                <h4>Resource Utilization Comparisons</h4>
                <table>
                    <thead>
                        <tr>
                            <th>Service</th>
                            <th>Metric</th>
                            <th>Baseline</th>
                            <th>Current</th>
                            <th>Absolute Change</th>
                            <th>Percent Change</th>
                        </tr>
                    </thead>
                    <tbody>
                """
                
                for service, metrics in resource_comparisons.items():
                    for metric_name, data in metrics.items():
                        css_class = ""
                        if data.get("regression", False):
                            css_class = "regression"
                        elif data.get("percent_change", 0) < 0:
                            css_class = "improvement"
                        
                        metric_display = metric_name.upper()
                        unit = "%" if metric_name == "cpu" else "MB"
                        
                        html_content += f"""
                        <tr class="{css_class}">
                            <td>{service}</td>
                            <td>{metric_display}</td>
                            <td>{data.get("baseline", 0):.2f} {unit}</td>
                            <td>{data.get("current", 0):.2f} {unit}</td>
                            <td>{data.get("absolute_change", 0):.2f} {unit}</td>
                            <td>{data.get("percent_change", 0):.2f}%</td>
                        </tr>
                        """
                
                html_content += """
                    </tbody>
                </table>
                """
            
            html_content += "</div>"  # Close test-section
    
    # Close HTML content
    html_content += """
    </body>
    </html>
    """
    
    # Write HTML report
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    report_file = os.path.join(output_dir, f"benchmark_report_{timestamp}.html")
    with open(report_file, "w") as f:
        f.write(html_content)
    
    logger.info(f"HTML report generated: {report_file}")


def generate_notebook_report(
    results: List[Dict[str, Any]],
    comparisons: List[Dict[str, Any]],
    summary: Optional[Dict[str, Any]],
    output_dir: str,
    app_version: str,
    baseline_version: Optional[str] = None,
    report_title: Optional[str] = None
) -> None:
    """Generate Jupyter notebook report from benchmark results.
    
    Args:
        results: List of benchmark results
        comparisons: List of comparison results
        summary: Summary data
        output_dir: Directory to save report
        app_version: Current application version
        baseline_version: Baseline version for comparison
        report_title: Custom report title
    """
    if not NOTEBOOK_AVAILABLE:
        logger.error("Required packages not available for notebook generation")
        return
    
    if not report_title:
        if baseline_version:
            report_title = f"Performance Benchmark: {app_version} vs {baseline_version}"
        else:
            report_title = f"Performance Benchmark: {app_version}"
    
    # Create notebook
    notebook = nbformat.v4.new_notebook()
    
    # Add title cell
    title_cell = nbformat.v4.new_markdown_cell(f"# {report_title}\n\nReport generated on {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    notebook.cells.append(title_cell)
    
    # Add setup cell
    setup_cell = nbformat.v4.new_code_cell(
        "import pandas as pd\n"
        "import matplotlib.pyplot as plt\n"
        "import seaborn as sns\n"
        "import json\n"
        "import numpy as np\n\n"
        "# Set up visualization\n"
        "%matplotlib inline\n"
        "plt.style.use('ggplot')\n"
        "sns.set(style='whitegrid')\n"
        "plt.rcParams['figure.figsize'] = (12, 8)"
    )
    notebook.cells.append(setup_cell)
    
    # Add data loading cell
    data_cell = nbformat.v4.new_code_cell(
        "# Load the result data\n"
        "results = " + json.dumps(results, indent=2) + "\n\n"
        "# Load comparison data\n"
        "comparisons = " + json.dumps(comparisons, indent=2) + "\n\n"
        "# Load summary data\n"
        "summary = " + json.dumps(summary, indent=2) if summary else "summary = None"
    )
    notebook.cells.append(data_cell)
    
    # Add summary section if available
    if summary:
        summary_cell = nbformat.v4.new_markdown_cell(
            "## Summary\n\n"
            f"**Version:** {summary.get('app_version', app_version)}\n\n"
            f"**Baseline:** {summary.get('baseline_version', baseline_version or 'None')}\n\n"
            f"**Tests Run:** {summary.get('successful_tests', 0)} / {summary.get('tests', 0)}\n\n"
            f"**Regressions:** {'Yes' if summary.get('has_regressions', False) else 'No'}"
        )
        notebook.cells.append(summary_cell)
        
        if summary.get("has_regressions", False):
            regression_counts = summary.get("regressions", {})
            regression_cell = nbformat.v4.new_markdown_cell(
                "### Regression Details\n\n"
                f"- API Endpoints: {regression_counts.get('api', 0)}\n"
                f"- System Resources: {regression_counts.get('resources', 0)}\n"
                f"- Message Queues: {regression_counts.get('queues', 0)}"
            )
            notebook.cells.append(regression_cell)
    
    # Add cells for API metrics visualization
    api_metrics_cell = nbformat.v4.new_markdown_cell("## API Endpoint Performance")
    notebook.cells.append(api_metrics_cell)
    
    api_code_cell = nbformat.v4.new_code_cell(
        "# Extract API metrics from results\n"
        "api_data = []\n"
        "for result in results:\n"
        "    test_name = 'Unknown'\n"
        "    if 'benchmark_info' in result and result['benchmark_info']:\n"
        "        test_info = result['benchmark_info']\n"
        "        test_name = test_info.get('notes', '').replace('CI run for ', '') or f\"Test {test_info.get('id', '')}\"\n"
        "    \n"
        "    api_metrics = result.get('summary_metrics', {}).get('api', {})\n"
        "    for endpoint, metrics in api_metrics.items():\n"
        "        api_data.append({\n"
        "            'test': test_name,\n"
        "            'endpoint': endpoint,\n"
        "            'avg_response_time_ms': metrics.get('avg_response_time_ms', 0),\n"
        "            'min_response_time_ms': metrics.get('min_response_time_ms', 0),\n"
        "            'max_response_time_ms': metrics.get('max_response_time_ms', 0),\n"
        "            'request_count': metrics.get('request_count', 0),\n"
        "            'error_count': metrics.get('error_count', 0),\n"
        "            'error_rate': metrics.get('error_count', 0) / metrics.get('request_count', 1) if metrics.get('request_count', 0) > 0 else 0\n"
        "        })\n"
        "\n"
        "if api_data:\n"
        "    api_df = pd.DataFrame(api_data)\n"
        "    display(api_df)\n"
        "    \n"
        "    # Plot response times by endpoint\n"
        "    plt.figure(figsize=(14, 8))\n"
        "    ax = sns.barplot(x='endpoint', y='avg_response_time_ms', data=api_df, hue='test' if len(api_df['test'].unique()) > 1 else None)\n"
        "    plt.title('Average Response Time by Endpoint')\n"
        "    plt.ylabel('Response Time (ms)')\n"
        "    plt.xlabel('Endpoint')\n"
        "    plt.xticks(rotation=45, ha='right')\n"
        "    plt.tight_layout()\n"
        "    plt.show()\n"
        "    \n"
        "    # Plot error rates by endpoint\n"
        "    plt.figure(figsize=(14, 8))\n"
        "    ax = sns.barplot(x='endpoint', y='error_rate', data=api_df, hue='test' if len(api_df['test'].unique()) > 1 else None)\n"
        "    plt.title('Error Rate by Endpoint')\n"
        "    plt.ylabel('Error Rate')\n"
        "    plt.xlabel('Endpoint')\n"
        "    plt.xticks(rotation=45, ha='right')\n"
        "    plt.tight_layout()\n"
        "    plt.show()\n"
        "else:\n"
        "    print('No API metrics available')"
    )
    notebook.cells.append(api_code_cell)
    
    # Add cells for resource metrics visualization
    resource_metrics_cell = nbformat.v4.new_markdown_cell("## Resource Utilization")
    notebook.cells.append(resource_metrics_cell)
    
    resource_code_cell = nbformat.v4.new_code_cell(
        "# Extract resource metrics from results\n"
        "resource_data = []\n"
        "for result in results:\n"
        "    test_name = 'Unknown'\n"
        "    if 'benchmark_info' in result and result['benchmark_info']:\n"
        "        test_info = result['benchmark_info']\n"
        "        test_name = test_info.get('notes', '').replace('CI run for ', '') or f\"Test {test_info.get('id', '')}\"\n"
        "    \n"
        "    resource_metrics = result.get('summary_metrics', {}).get('resources', {})\n"
        "    for service, metrics in resource_metrics.items():\n"
        "        resource_data.append({\n"
        "            'test': test_name,\n"
        "            'service': service,\n"
        "            'avg_cpu_percent': metrics.get('avg_cpu_percent', 0),\n"
        "            'max_cpu_percent': metrics.get('max_cpu_percent', 0),\n"
        "            'avg_memory_mb': metrics.get('avg_memory_mb', 0),\n"
        "            'max_memory_mb': metrics.get('max_memory_mb', 0)\n"
        "        })\n"
        "\n"
        "if resource_data:\n"
        "    resource_df = pd.DataFrame(resource_data)\n"
        "    display(resource_df)\n"
        "    \n"
        "    # Plot CPU usage by service\n"
        "    plt.figure(figsize=(12, 6))\n"
        "    ax = sns.barplot(x='service', y='avg_cpu_percent', data=resource_df, hue='test' if len(resource_df['test'].unique()) > 1 else None)\n"
        "    plt.title('Average CPU Usage by Service')\n"
        "    plt.ylabel('CPU Usage (%)')\n"
        "    plt.xlabel('Service')\n"
        "    plt.tight_layout()\n"
        "    plt.show()\n"
        "    \n"
        "    # Plot memory usage by service\n"
        "    plt.figure(figsize=(12, 6))\n"
        "    ax = sns.barplot(x='service', y='avg_memory_mb', data=resource_df, hue='test' if len(resource_df['test'].unique()) > 1 else None)\n"
        "    plt.title('Average Memory Usage by Service')\n"
        "    plt.ylabel('Memory Usage (MB)')\n"
        "    plt.xlabel('Service')\n"
        "    plt.tight_layout()\n"
        "    plt.show()\n"
        "else:\n"
        "    print('No resource metrics available')"
    )
    notebook.cells.append(resource_code_cell)
    
    # Add cells for comparison visualization
    if comparisons:
        comparison_cell = nbformat.v4.new_markdown_cell("## Performance Comparisons")
        notebook.cells.append(comparison_cell)
        
        comparison_code_cell = nbformat.v4.new_code_cell(
            "# Extract comparison data\n"
            "api_comparison_data = []\n"
            "resource_comparison_data = []\n"
            "\n"
            "for comparison in comparisons:\n"
            "    baseline_version = comparison.get('baseline_version', 'Unknown')\n"
            "    current_version = comparison.get('current_version', 'Current')\n"
            "    \n"
            "    # API comparisons\n"
            "    for endpoint, data in comparison.get('api', {}).items():\n"
            "        api_comparison_data.append({\n"
            "            'endpoint': endpoint,\n"
            "            'baseline': data.get('baseline', 0),\n"
            "            'current': data.get('current', 0),\n"
            "            'absolute_change': data.get('absolute_change', 0),\n"
            "            'percent_change': data.get('percent_change', 0),\n"
            "            'regression': data.get('regression', False),\n"
            "            'baseline_version': baseline_version,\n"
            "            'current_version': current_version\n"
            "        })\n"
            "    \n"
            "    # Resource comparisons\n"
            "    for service, metrics in comparison.get('resources', {}).items():\n"
            "        for metric_name, data in metrics.items():\n"
            "            resource_comparison_data.append({\n"
            "                'service': service,\n"
            "                'metric': metric_name,\n"
            "                'baseline': data.get('baseline', 0),\n"
            "                'current': data.get('current', 0),\n"
            "                'absolute_change': data.get('absolute_change', 0),\n"
            "                'percent_change': data.get('percent_change', 0),\n"
            "                'regression': data.get('regression', False),\n"
            "                'baseline_version': baseline_version,\n"
            "                'current_version': current_version\n"
            "            })\n"
            "\n"
            "if api_comparison_data:\n"
            "    api_comp_df = pd.DataFrame(api_comparison_data)\n"
            "    display(api_comp_df)\n"
            "    \n"
            "    # Plot response time comparisons\n"
            "    plt.figure(figsize=(14, 8))\n"
            "    comparison_df_melted = pd.melt(api_comp_df, \n"
            "                                  id_vars=['endpoint', 'regression', 'baseline_version', 'current_version'], \n"
            "                                  value_vars=['baseline', 'current'],\n"
            "                                  var_name='version', value_name='response_time')\n"
            "    \n"
            "    ax = sns.barplot(x='endpoint', y='response_time', hue='version', data=comparison_df_melted)\n"
            "    plt.title(f'Response Time Comparison: {baseline_version} vs {current_version}')\n"
            "    plt.ylabel('Response Time (ms)')\n"
            "    plt.xlabel('Endpoint')\n"
            "    plt.xticks(rotation=45, ha='right')\n"
            "    plt.tight_layout()\n"
            "    plt.show()\n"
            "    \n"
            "    # Plot percent change\n"
            "    plt.figure(figsize=(14, 8))\n"
            "    colors = ['red' if x else 'green' for x in api_comp_df['regression']]\n"
            "    ax = sns.barplot(x='endpoint', y='percent_change', data=api_comp_df, palette=colors)\n"
            "    plt.title(f'Response Time Change (%): {baseline_version} vs {current_version}')\n"
            "    plt.ylabel('Change (%)')\n"
            "    plt.xlabel('Endpoint')\n"
            "    plt.axhline(y=0, color='k', linestyle='-', alpha=0.3)\n"
            "    plt.xticks(rotation=45, ha='right')\n"
            "    plt.tight_layout()\n"
            "    plt.show()\n"
            "else:\n"
            "    print('No API comparison data available')\n"
            "\n"
            "if resource_comparison_data:\n"
            "    resource_comp_df = pd.DataFrame(resource_comparison_data)\n"
            "    display(resource_comp_df)\n"
            "    \n"
            "    # Plot resource comparisons\n"
            "    plt.figure(figsize=(14, 8))\n"
            "    resource_df_melted = pd.melt(resource_comp_df, \n"
            "                               id_vars=['service', 'metric', 'regression', 'baseline_version', 'current_version'], \n"
            "                               value_vars=['baseline', 'current'],\n"
            "                               var_name='version', value_name='value')\n"
            "    \n"
            "    ax = sns.barplot(x='service', y='value', hue='version', data=resource_df_melted)\n"
            "    plt.title(f'Resource Usage Comparison: {baseline_version} vs {current_version}')\n"
            "    plt.ylabel('Value')\n"
            "    plt.xlabel('Service')\n"
            "    plt.tight_layout()\n"
            "    plt.show()\n"
            "else:\n"
            "    print('No resource comparison data available')"
        )
        notebook.cells.append(comparison_code_cell)
    
    # Add conclusion cell
    conclusion_cell = nbformat.v4.new_markdown_cell(
        "## Conclusion\n\n"
        "This report provides performance metrics and comparisons for the application performance benchmark. "
        "Review the visualizations above to identify any performance regressions or improvements."
    )
    notebook.cells.append(conclusion_cell)
    
    # Export notebook to HTML
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    notebook_file = os.path.join(output_dir, f"benchmark_notebook_{timestamp}.ipynb")
    with open(notebook_file, "w") as f:
        nbformat.write(notebook, f)
    
    logger.info(f"Notebook created: {notebook_file}")
    
    # Export notebook to HTML
    html_exporter = HTMLExporter()
    html_output, _ = html_exporter.from_notebook_node(notebook)
    
    html_file = os.path.join(output_dir, f"benchmark_notebook_{timestamp}.html")
    with open(html_file, "w") as f:
        f.write(html_output)
    
    logger.info(f"Notebook exported to HTML: {html_file}")


def main():
    """Parse arguments and generate report."""
    parser = argparse.ArgumentParser(description="Generate benchmark reports")
    
    parser.add_argument("--results-dir", required=True,
                        help="Directory containing benchmark results")
    parser.add_argument("--output-dir", required=True,
                        help="Directory to save reports")
    parser.add_argument("--app-version", required=True,
                        help="Current application version")
    parser.add_argument("--baseline-version", default=None,
                        help="Baseline version for comparison")
    parser.add_argument("--report-title", default=None,
                        help="Custom report title")
    
    args = parser.parse_args()
    
    # Generate report
    generate_report(
        results_dir=args.results_dir,
        output_dir=args.output_dir,
        app_version=args.app_version,
        baseline_version=args.baseline_version,
        report_title=args.report_title
    )


if __name__ == "__main__":
    main()