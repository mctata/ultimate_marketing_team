#!/usr/bin/env python
"""
Deployment Notification Script

This script sends notifications about deployment status to email and Slack.
It's used in the CI/CD pipeline to notify the team about deployment events.
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


# Status constants
STATUS_SUCCESS = "success"
STATUS_FAILURE = "failure"
STATUS_WARNING = "warning"
STATUS_INFO = "info"

# Environment constants
ENV_DEVELOPMENT = "development"
ENV_STAGING = "staging"
ENV_PRODUCTION = "production"


def send_slack_notification(webhook_url, title, message, status=STATUS_INFO):
    """Send notification to Slack.
    
    Args:
        webhook_url (str): Slack webhook URL
        title (str): Notification title
        message (str): Notification message
        status (str): Status (success, failure, warning, info)
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not webhook_url:
        print("Slack webhook URL not provided, skipping Slack notification")
        return True
    
    # Set color based on status
    color = "#36a64f"  # green
    if status == STATUS_FAILURE:
        color = "#ff0000"  # red
    elif status == STATUS_WARNING:
        color = "#ffcc00"  # yellow
    elif status == STATUS_INFO:
        color = "#439fe0"  # blue
    
    # Build the Slack payload
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    payload = {
        "attachments": [
            {
                "color": color,
                "title": title,
                "text": message,
                "footer": f"UMT Deployment • {timestamp}",
                "mrkdwn_in": ["text"]
            }
        ]
    }
    
    try:
        response = requests.post(webhook_url, json=payload)
        if response.status_code != 200:
            print(f"Failed to send Slack notification: {response.text}")
            return False
        return True
    except Exception as e:
        print(f"Error sending Slack notification: {e}")
        return False


def send_email_notification(recipients, subject, message, status=STATUS_INFO, smtp_config=None):
    """Send notification via email.
    
    Args:
        recipients (list): List of email recipients
        subject (str): Email subject
        message (str): Email message
        status (str): Status (success, failure, warning, info)
        smtp_config (dict): SMTP configuration
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not recipients:
        print("No email recipients provided, skipping email notification")
        return True
    
    # Default SMTP configuration
    default_smtp = {
        "server": os.environ.get("SMTP_SERVER", "smtp.gmail.com"),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "sender": os.environ.get("SMTP_SENDER", "umt-deployment@ultimatemarketing.com")
    }
    
    # Use provided config or default
    smtp = smtp_config or default_smtp
    
    if not smtp.get("user") or not smtp.get("password"):
        print("SMTP credentials not provided, skipping email notification")
        return True
    
    try:
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp["sender"]
        msg["To"] = ", ".join(recipients)
        
        # Create HTML message with status styling
        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; }}
                .container {{ padding: 20px; }}
                .header {{ padding: 10px; background-color: #f0f0f0; }}
                .status-success {{ color: green; }}
                .status-failure {{ color: red; }}
                .status-warning {{ color: orange; }}
                .content {{ padding: 20px; }}
                pre {{ background-color: #f5f5f5; padding: 10px; border-radius: 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h2>Ultimate Marketing Team Deployment</h2>
                </div>
                <div class="content">
                    <h3 class="status-{status}">{subject}</h3>
                    <p>{message.replace('\\n', '<br>')}</p>
                    <p>Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Attach HTML version
        msg.attach(MIMEText(html, "html"))
        
        # Connect to SMTP server and send email
        server = smtplib.SMTP(smtp["server"], smtp["port"])
        server.starttls()
        server.login(smtp["user"], smtp["password"])
        server.sendmail(smtp["sender"], recipients, msg.as_string())
        server.quit()
        
        print(f"Email notification sent to {', '.join(recipients)}")
        return True
    except Exception as e:
        print(f"Error sending email notification: {e}")
        return False


def notify(environment, status, title, message, slack_webhook=None, email_recipients=None):
    """Send deployment notifications.
    
    Args:
        environment (str): Environment name
        status (str): Status (success, failure, warning, info)
        title (str): Notification title
        message (str): Notification message
        slack_webhook (str): Slack webhook URL
        email_recipients (list): List of email recipients
        
    Returns:
        bool: True if all notifications sent successfully, False otherwise
    """
    success = True
    env_upper = environment.upper()
    
    # Format the title and message
    formatted_title = f"[{env_upper}] {title}"
    
    # Add environment and timestamp to message
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"Environment: {environment}\nTimestamp: {timestamp}\n\n{message}"
    
    # Send Slack notification
    if slack_webhook:
        if not send_slack_notification(slack_webhook, formatted_title, formatted_message, status):
            success = False
    
    # Send email notification
    if email_recipients:
        if not send_email_notification(email_recipients, formatted_title, formatted_message, status):
            success = False
    
    return success


def main():
    parser = argparse.ArgumentParser(description='Deployment Notification Tool')
    parser.add_argument('--environment', choices=[ENV_DEVELOPMENT, ENV_STAGING, ENV_PRODUCTION],
                      default=ENV_DEVELOPMENT, help='Target environment')
    parser.add_argument('--status', choices=[STATUS_SUCCESS, STATUS_FAILURE, STATUS_WARNING, STATUS_INFO],
                      default=STATUS_INFO, help='Notification status')
    parser.add_argument('--title', required=True,
                      help='Notification title')
    parser.add_argument('--message', required=True,
                      help='Notification message')
    parser.add_argument('--slack-webhook',
                      help='Slack webhook URL')
    parser.add_argument('--email-recipients', nargs='+',
                      help='Email recipients (space-separated)')
    
    args = parser.parse_args()
    
    success = notify(
        args.environment,
        args.status,
        args.title,
        args.message,
        args.slack_webhook,
        args.email_recipients
    )
    
    if success:
        print("Notifications sent successfully")
        sys.exit(0)
    else:
        print("Failed to send some notifications")
        sys.exit(1)


if __name__ == "__main__":
    main()