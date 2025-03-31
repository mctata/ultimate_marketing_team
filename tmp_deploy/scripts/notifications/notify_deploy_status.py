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

# Add the project root to the Python path so we can import the logging utility
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(os.path.dirname(script_dir)))
sys.path.insert(0, project_root)

from scripts.utilities.logging_utils import setup_logger, log_command_execution


# Status constants
STATUS_SUCCESS = "success"
STATUS_FAILURE = "failure"
STATUS_WARNING = "warning"
STATUS_INFO = "info"

# Environment constants
ENV_DEVELOPMENT = "development"
ENV_STAGING = "staging"
ENV_PRODUCTION = "production"


def send_slack_notification(logger, webhook_url, title, message, status=STATUS_INFO):
    """Send notification to Slack.
    
    Args:
        logger: Logger instance
        webhook_url (str): Slack webhook URL
        title (str): Notification title
        message (str): Notification message
        status (str): Status (success, failure, warning, info)
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not webhook_url:
        logger.warning("Slack webhook URL not provided, skipping Slack notification")
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
    
    # Mask the webhook URL for logging (only keep the domain part)
    webhook_domain = webhook_url.split("//")[-1].split("/")[0] if "//" in webhook_url else webhook_url
    masked_webhook = f"https://{webhook_domain}/***"
    
    logger.info(f"Sending Slack notification to {masked_webhook}")
    logger.debug(f"Notification title: {title}")
    
    try:
        response = requests.post(webhook_url, json=payload)
        
        # Log the HTTP request
        log_command_execution(
            logger=logger,
            command=f"POST {masked_webhook}",
            output=f"Status code: {response.status_code}",
            return_code=0 if response.status_code == 200 else 1,
            error_output=response.text if response.status_code != 200 else None
        )
        
        if response.status_code != 200:
            logger.error(f"Failed to send Slack notification: {response.text}")
            return False
        
        logger.info("Slack notification sent successfully")
        return True
    except Exception as e:
        logger.exception(f"Error sending Slack notification: {str(e)}")
        return False


def send_email_notification(logger, recipients, subject, message, status=STATUS_INFO, smtp_config=None):
    """Send notification via email.
    
    Args:
        logger: Logger instance
        recipients (list): List of email recipients
        subject (str): Email subject
        message (str): Email message
        status (str): Status (success, failure, warning, info)
        smtp_config (dict): SMTP configuration
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not recipients:
        logger.warning("No email recipients provided, skipping email notification")
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
        logger.warning("SMTP credentials not provided, skipping email notification")
        return True
    
    logger.info(f"Preparing to send email notification to {len(recipients)} recipients")
    logger.debug(f"Email subject: {subject}")
    
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
        
        # Log SMTP connection (with masked credentials)
        logger.info(f"Connecting to SMTP server {smtp['server']}:{smtp['port']}")
        
        # Connect to SMTP server and send email
        server = smtplib.SMTP(smtp["server"], smtp["port"])
        server.starttls()
        
        # Log SMTP operations without exposing credentials
        logger.debug("SMTP connection established, authenticating")
        server.login(smtp["user"], "*******")  # Password masked in logs
        
        # Log the email sending operation
        logger.info(f"Sending email from {smtp['sender']} to {len(recipients)} recipients")
        server.sendmail(smtp["sender"], recipients, msg.as_string())
        server.quit()
        
        # Log success with redacted recipients list for privacy
        if len(recipients) > 3:
            recipient_summary = f"{', '.join(recipients[:2])} and {len(recipients)-2} others"
        else:
            recipient_summary = ', '.join(recipients)
            
        logger.info(f"Email notification sent to {recipient_summary}")
        return True
    except Exception as e:
        logger.exception(f"Error sending email notification: {str(e)}")
        return False


def notify(logger, environment, status, title, message, slack_webhook=None, email_recipients=None):
    """Send deployment notifications.
    
    Args:
        logger: Logger instance
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
    
    logger.info(f"Preparing notifications for {env_upper} environment with status: {status}")
    
    # Format the title and message
    formatted_title = f"[{env_upper}] {title}"
    
    # Add environment and timestamp to message
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    formatted_message = f"Environment: {environment}\nTimestamp: {timestamp}\n\n{message}"
    
    logger.debug(f"Formatted title: {formatted_title}")
    
    # Send Slack notification
    if slack_webhook:
        logger.info("Sending Slack notification")
        if not send_slack_notification(logger, slack_webhook, formatted_title, formatted_message, status):
            logger.error("Slack notification failed")
            success = False
    else:
        logger.info("Skipping Slack notification (no webhook provided)")
    
    # Send email notification
    if email_recipients:
        logger.info("Sending email notification")
        if not send_email_notification(logger, email_recipients, formatted_title, formatted_message, status):
            logger.error("Email notification failed")
            success = False
    else:
        logger.info("Skipping email notification (no recipients provided)")
    
    return success


def main():
    # Set up logging
    logger = setup_logger("deploy_notifications")
    logger.info("Starting deployment notification script")
    
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
    
    logger.info(f"Parsed arguments: environment={args.environment}, status={args.status}, title={args.title}")
    logger.debug(f"Recipients count: {len(args.email_recipients) if args.email_recipients else 0}")
    
    try:
        success = notify(
            logger,
            args.environment,
            args.status,
            args.title,
            args.message,
            args.slack_webhook,
            args.email_recipients
        )
        
        if success:
            logger.info("All notifications sent successfully")
            sys.exit(0)
        else:
            logger.error("Failed to send some notifications")
            sys.exit(1)
    except Exception as e:
        logger.exception(f"Unhandled exception in notification script: {str(e)}")
        sys.exit(2)


if __name__ == "__main__":
    main()