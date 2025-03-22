#!/usr/bin/env python
"""
Script to send notifications about test status.

This script sends notifications to Slack and email when tests fail in the CI pipeline.
"""

import argparse
import json
import os
import sys
import requests
from datetime import datetime
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart


def send_slack_notification(webhook_url, message, test_type, status_emoji, github_run_id, github_repo):
    """Send a notification to Slack."""
    if not webhook_url:
        print("No Slack webhook URL provided, skipping Slack notification")
        return
    
    run_url = f"https://github.com/{github_repo}/actions/runs/{github_run_id}"
    
    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{status_emoji} {test_type} Tests Status",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Repository:*\n{github_repo}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Time:*\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                ]
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "View Details",
                            "emoji": True
                        },
                        "url": run_url
                    }
                ]
            }
        ]
    }
    
    try:
        response = requests.post(webhook_url, json=payload)
        response.raise_for_status()
        print(f"Slack notification sent. Status code: {response.status_code}")
    except Exception as e:
        print(f"Failed to send Slack notification: {e}")


def send_email_notification(recipients, message, test_type, github_run_id, github_repo):
    """Send a notification email."""
    if not recipients:
        print("No email recipients provided, skipping email notification")
        return
    
    # Check for environment variables
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    if not smtp_username or not smtp_password:
        print("SMTP credentials not found in environment variables, skipping email notification")
        return
    
    run_url = f"https://github.com/{github_repo}/actions/runs/{github_run_id}"
    
    msg = MIMEMultipart()
    msg["Subject"] = f"{test_type} Tests Notification - Action Required"
    msg["From"] = smtp_username
    msg["To"] = ", ".join(recipients.split(","))
    
    # Create HTML version of the message
    html = f"""
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #f44336; color: white; padding: 10px; text-align: center; }}
            .content {{ padding: 20px; }}
            .footer {{ font-size: 12px; color: #666; }}
            .button {{ display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; 
                      text-decoration: none; border-radius: 4px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2>{test_type} Tests Notification - Action Required</h2>
            </div>
            <div class="content">
                <p>{message}</p>
                <p>Repository: {github_repo}</p>
                <p>Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
                <p><a class="button" href="{run_url}">View Details</a></p>
            </div>
            <div class="footer">
                <p>This is an automated message from the CI/CD pipeline. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    msg.attach(MIMEText(html, "html"))
    
    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.send_message(msg)
        server.quit()
        print(f"Email notification sent to {recipients}")
    except Exception as e:
        print(f"Failed to send email notification: {e}")


def main():
    """Parse arguments and send notifications."""
    parser = argparse.ArgumentParser(description="Send test status notifications")
    
    parser.add_argument("--test-type", required=True, help="Type of tests (e.g., Compliance, Unit, Integration)")
    parser.add_argument("--unit-test-status", help="Unit test status (success/failure)")
    parser.add_argument("--api-test-status", help="API test status (success/failure)")
    parser.add_argument("--integration-test-status", help="Integration test status (success/failure)")
    parser.add_argument("--slack-webhook", help="Slack webhook URL")
    parser.add_argument("--email-recipients", help="Comma-separated email recipients")
    parser.add_argument("--github-run-id", help="GitHub Actions run ID")
    parser.add_argument("--github-repository", help="GitHub repository name")
    
    args = parser.parse_args()
    
    # Build the notification message
    status_parts = []
    overall_status = "success"
    
    if args.unit_test_status:
        status_parts.append(f"Unit Tests: {'✅' if args.unit_test_status == 'success' else '❌'}")
        if args.unit_test_status != "success":
            overall_status = "failure"
    
    if args.api_test_status:
        status_parts.append(f"API Tests: {'✅' if args.api_test_status == 'success' else '❌'}")
        if args.api_test_status != "success":
            overall_status = "failure"
    
    if args.integration_test_status:
        status_parts.append(f"Integration Tests: {'✅' if args.integration_test_status == 'success' else '❌'}")
        if args.integration_test_status != "success":
            overall_status = "failure"
    
    status_message = "\n".join(status_parts)
    
    message = f"*{args.test_type} Test Results:*\n{status_message}\n\n"
    
    if overall_status == "failure":
        message += "⚠️ *Action Required:* One or more test suites have failed. Please check the logs and fix the issues."
        status_emoji = "🔴"
    else:
        message += "✅ All tests passed successfully!"
        status_emoji = "🟢"
    
    # Send notifications
    if args.slack_webhook:
        send_slack_notification(
            args.slack_webhook, 
            message, 
            args.test_type, 
            status_emoji, 
            args.github_run_id,
            args.github_repository
        )
    
    if args.email_recipients:
        send_email_notification(
            args.email_recipients, 
            message.replace("*", "").replace("```", ""), 
            args.test_type, 
            args.github_run_id,
            args.github_repository
        )


if __name__ == "__main__":
    main()