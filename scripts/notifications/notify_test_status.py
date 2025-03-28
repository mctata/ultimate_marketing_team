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

# Add the project root to the Python path so we can import the logging utility
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import setup_logger, log_command_execution


def send_slack_notification(logger, webhook_url, message, test_type, status_emoji, github_run_id, github_repo):
    """Send a notification to Slack.
    
    Args:
        logger: Logger instance
        webhook_url: Slack webhook URL
        message: Notification message
        test_type: Type of tests (e.g., "Unit", "Integration")
        status_emoji: Emoji indicating status (e.g., "🔴", "🟢")
        github_run_id: GitHub Actions run ID
        github_repo: GitHub repository name
    """
    if not webhook_url:
        logger.warning("No Slack webhook URL provided, skipping Slack notification")
        return
    
    # Create GitHub run URL
    run_url = f"https://github.com/{github_repo}/actions/runs/{github_run_id}"
    logger.info(f"Creating test notification for {test_type} tests")
    logger.debug(f"GitHub run URL: {run_url}")
    
    # Create Slack message payload
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
    
    # Mask the webhook URL for logging (only keep the domain part)
    webhook_domain = webhook_url.split("//")[-1].split("/")[0] if "//" in webhook_url else webhook_url
    masked_webhook = f"https://{webhook_domain}/***"
    
    logger.info(f"Sending Slack notification to {masked_webhook}")
    
    try:
        # Send the HTTP request
        response = requests.post(webhook_url, json=payload)
        
        # Log the HTTP request using the command execution logging helper
        log_command_execution(
            logger=logger,
            command=f"POST {masked_webhook}",
            output=f"Status code: {response.status_code}",
            return_code=0 if response.status_code == 200 else 1,
            error_output=response.text if response.status_code != 200 else None
        )
        
        response.raise_for_status()
        logger.info(f"Slack notification sent successfully with status code: {response.status_code}")
    except requests.exceptions.RequestException as e:
        logger.exception(f"Failed to send Slack notification: {str(e)}")
    except Exception as e:
        logger.exception(f"Unexpected error sending Slack notification: {str(e)}")


def send_email_notification(logger, recipients, message, test_type, github_run_id, github_repo):
    """Send a notification email.
    
    Args:
        logger: Logger instance
        recipients: Comma-separated list of email recipients
        message: Notification message
        test_type: Type of tests (e.g., "Unit", "Integration")
        github_run_id: GitHub Actions run ID
        github_repo: GitHub repository name
    """
    if not recipients:
        logger.warning("No email recipients provided, skipping email notification")
        return
    
    # Check for environment variables
    smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", 587))
    smtp_username = os.environ.get("SMTP_USERNAME")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    
    if not smtp_username or not smtp_password:
        logger.warning("SMTP credentials not found in environment variables, skipping email notification")
        return
    
    # Create GitHub run URL
    run_url = f"https://github.com/{github_repo}/actions/runs/{github_run_id}"
    
    logger.info(f"Preparing email notification for {test_type} tests")
    logger.debug(f"GitHub run URL: {run_url}")
    
    recipients_list = recipients.split(",")
    logger.info(f"Sending email to {len(recipients_list)} recipients")
    
    # Create the email message
    msg = MIMEMultipart()
    msg["Subject"] = f"{test_type} Tests Notification - Action Required"
    msg["From"] = smtp_username
    msg["To"] = ", ".join(recipients_list)
    
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
    
    # Log SMTP connection (with masked credentials)
    logger.info(f"Connecting to SMTP server {smtp_server}:{smtp_port}")
    
    try:
        # Connect to SMTP server
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        
        # Log SMTP operations without exposing credentials
        logger.debug("SMTP connection established, authenticating")
        server.login(smtp_username, "*******")  # Password masked in logs
        
        # Send the email
        logger.info("Sending email message")
        server.send_message(msg)
        server.quit()
        
        # Log success with redacted recipients list for privacy
        if len(recipients_list) > 3:
            recipient_summary = f"{recipients_list[0]} and {len(recipients_list)-1} others"
        else:
            recipient_summary = ', '.join(recipients_list)
            
        logger.info(f"Email notification sent to {recipient_summary}")
    except smtplib.SMTPException as e:
        logger.exception(f"SMTP error sending email notification: {str(e)}")
    except Exception as e:
        logger.exception(f"Unexpected error sending email notification: {str(e)}")


def main():
    """Parse arguments and send notifications."""
    # Set up logging
    logger = setup_logger("test_notifications")
    logger.info("Starting test notification script")
    
    try:
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
        logger.info(f"Parsed arguments: test_type={args.test_type}")
        
        # Build the notification message
        status_parts = []
        overall_status = "success"
        
        logger.info("Building test status message")
        
        if args.unit_test_status:
            status = args.unit_test_status
            status_parts.append(f"Unit Tests: {'✅' if status == 'success' else '❌'}")
            if status != "success":
                overall_status = "failure"
                logger.warning(f"Unit tests failed with status: {status}")
            else:
                logger.info("Unit tests passed successfully")
        
        if args.api_test_status:
            status = args.api_test_status
            status_parts.append(f"API Tests: {'✅' if status == 'success' else '❌'}")
            if status != "success":
                overall_status = "failure"
                logger.warning(f"API tests failed with status: {status}")
            else:
                logger.info("API tests passed successfully")
        
        if args.integration_test_status:
            status = args.integration_test_status
            status_parts.append(f"Integration Tests: {'✅' if status == 'success' else '❌'}")
            if status != "success":
                overall_status = "failure"
                logger.warning(f"Integration tests failed with status: {status}")
            else:
                logger.info("Integration tests passed successfully")
        
        status_message = "\n".join(status_parts)
        
        message = f"*{args.test_type} Test Results:*\n{status_message}\n\n"
        
        if overall_status == "failure":
            message += "⚠️ *Action Required:* One or more test suites have failed. Please check the logs and fix the issues."
            status_emoji = "🔴"
            logger.warning("Overall test status: FAILURE - Notifications will indicate action required")
        else:
            message += "✅ All tests passed successfully!"
            status_emoji = "🟢"
            logger.info("Overall test status: SUCCESS")
        
        # Send notifications
        if args.slack_webhook:
            logger.info("Sending Slack notification")
            send_slack_notification(
                logger,
                args.slack_webhook, 
                message, 
                args.test_type, 
                status_emoji, 
                args.github_run_id,
                args.github_repository
            )
        else:
            logger.info("Skipping Slack notification (no webhook provided)")
        
        if args.email_recipients:
            logger.info("Sending email notification")
            # Remove markdown formatting for email
            email_message = message.replace("*", "").replace("```", "")
            send_email_notification(
                logger,
                args.email_recipients, 
                email_message, 
                args.test_type, 
                args.github_run_id,
                args.github_repository
            )
        else:
            logger.info("Skipping email notification (no recipients provided)")
            
        logger.info("Test notification script completed successfully")
        
    except Exception as e:
        logger.exception(f"Unhandled exception in test notification script: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()