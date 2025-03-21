#!/usr/bin/env python
"""
Script to send notifications about migration verification status.

This script sends notifications via Slack and email when migration verification
fails, to ensure that issues are quickly addressed by the development team.
"""

import os
import sys
import argparse
import json
import requests
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import socket
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("migration_notifier")

# Default settings
DEFAULT_NOTIFICATION_LEVEL = "error"  # all, info, warning, error
DEFAULT_SLACK_CHANNEL = "#migration-alerts"
DEFAULT_EMAIL_SUBJECT_PREFIX = "[UMT Migration]"


def send_slack_notification(webhook_url, message, title=None, level="error"):
    """
    Send a notification to Slack.
    
    Args:
        webhook_url (str): Slack webhook URL
        message (str): Message to send
        title (str, optional): Title for the message
        level (str, optional): Notification level (info, warning, error)
    
    Returns:
        bool: True if successful, False otherwise
    """
    if not webhook_url:
        logger.warning("No Slack webhook URL provided, skipping Slack notification")
        return False
    
    try:
        # Determine color based on level
        color_map = {
            "info": "#36a64f",  # green
            "warning": "#ffcc00",  # yellow
            "error": "#dc3545",  # red
            "success": "#36a64f"  # green
        }
        color = color_map.get(level.lower(), "#36a64f")
        
        # Build payload
        payload = {
            "attachments": [
                {
                    "color": color,
                    "pretext": title or "Migration Verification Notification",
                    "text": message,
                    "fields": [
                        {
                            "title": "Environment",
                            "value": os.environ.get("ENVIRONMENT", "development"),
                            "short": True
                        },
                        {
                            "title": "Server",
                            "value": socket.gethostname(),
                            "short": True
                        },
                        {
                            "title": "Timestamp",
                            "value": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "short": True
                        }
                    ],
                    "footer": "Ultimate Marketing Team Migration System"
                }
            ]
        }
        
        # Add user if available
        user = os.environ.get("USER")
        if user:
            payload["attachments"][0]["fields"].append({
                "title": "User",
                "value": user,
                "short": True
            })
        
        # Send to Slack
        response = requests.post(
            webhook_url,
            data=json.dumps(payload),
            headers={"Content-Type": "application/json"}
        )
        
        # Check response
        if response.status_code == 200:
            logger.info("Slack notification sent successfully")
            return True
        else:
            logger.error(f"Failed to send Slack notification: {response.status_code}, {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Error sending Slack notification: {e}")
        return False


def send_email_notification(recipients, message, subject=None, level="error", smtp_config=None):
    """
    Send an email notification.
    
    Args:
        recipients (str or list): Email recipient(s)
        message (str): Message to send
        subject (str, optional): Email subject
        level (str, optional): Notification level (info, warning, error)
        smtp_config (dict, optional): SMTP configuration
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not recipients:
        logger.warning("No email recipients provided, skipping email notification")
        return False
    
    # Convert single recipient to list
    if isinstance(recipients, str):
        recipients = [recipients]
    
    # Get SMTP configuration from environment or passed config
    smtp_config = smtp_config or {
        "server": os.environ.get("SMTP_SERVER", "localhost"),
        "port": int(os.environ.get("SMTP_PORT", 587)),
        "username": os.environ.get("SMTP_USERNAME"),
        "password": os.environ.get("SMTP_PASSWORD"),
        "sender": os.environ.get("SMTP_SENDER", f"migration@{socket.gethostname()}")
    }
    
    try:
        # Prepare email subject with prefix and level
        subject_prefix = os.environ.get("EMAIL_SUBJECT_PREFIX", DEFAULT_EMAIL_SUBJECT_PREFIX)
        level_text = f"[{level.upper()}]" if level and level.lower() != "info" else ""
        full_subject = f"{subject_prefix} {level_text} {subject or 'Migration Notification'}"
        
        # Create message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = full_subject
        msg["From"] = smtp_config["sender"]
        msg["To"] = ", ".join(recipients)
        
        # Create plain text body with context information
        env = os.environ.get("ENVIRONMENT", "development")
        server = socket.gethostname()
        user = os.environ.get("USER", "unknown")
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        text_body = f"""
{message}

Environment: {env}
Server: {server}
User: {user}
Timestamp: {timestamp}

This is an automated message from the Ultimate Marketing Team Migration System.
        """
        
        # Create HTML version
        level_color = {
            "info": "#36a64f",
            "warning": "#ffcc00",
            "error": "#dc3545",
            "success": "#36a64f"
        }.get(level.lower(), "#36a64f")
        
        html_body = f"""
<html>
<body>
  <div style="border-left: 4px solid {level_color}; padding-left: 10px;">
    <p>{message.replace(os.linesep, '<br/>')}</p>
  </div>
  
  <div style="margin-top: 20px; font-size: 12px; color: #666;">
    <p><strong>Environment:</strong> {env}</p>
    <p><strong>Server:</strong> {server}</p>
    <p><strong>User:</strong> {user}</p>
    <p><strong>Timestamp:</strong> {timestamp}</p>
  </div>
  
  <div style="margin-top: 30px; font-size: 11px; color: #999; font-style: italic;">
    This is an automated message from the Ultimate Marketing Team Migration System.
  </div>
</body>
</html>
        """
        
        # Attach parts
        msg.attach(MIMEText(text_body, "plain"))
        msg.attach(MIMEText(html_body, "html"))
        
        # Send email
        with smtplib.SMTP(smtp_config["server"], smtp_config["port"]) as server:
            if smtp_config.get("username") and smtp_config.get("password"):
                server.starttls()
                server.login(smtp_config["username"], smtp_config["password"])
            server.send_message(msg)
        
        logger.info(f"Email notification sent to {', '.join(recipients)}")
        return True
        
    except Exception as e:
        logger.error(f"Error sending email notification: {e}")
        return False


def send_notification(environment, status, title, message, slack_webhook=None, email_recipients=None):
    """
    Send notification through configured channels.
    
    Args:
        environment (str): Environment name (development, staging, production)
        status (str): Status (success, failure, warning, info)
        title (str): Notification title
        message (str): Notification message
        slack_webhook (str, optional): Slack webhook URL
        email_recipients (str or list, optional): Email recipients
        
    Returns:
        bool: True if all notifications sent successfully, False otherwise
    """
    # Map status to level
    level_map = {
        "success": "info",
        "failure": "error",
        "error": "error",
        "warning": "warning",
        "info": "info"
    }
    level = level_map.get(status.lower(), "info")
    
    # Set environment variable for context
    os.environ["ENVIRONMENT"] = environment
    
    # Determine notification level threshold from environment
    notify_level = os.environ.get("NOTIFICATION_LEVEL", DEFAULT_NOTIFICATION_LEVEL).lower()
    
    # Convert level names to numeric values for comparison
    level_values = {
        "all": 0,
        "info": 1,
        "warning": 2,
        "error": 3
    }
    
    # Check if we should send based on notification level threshold
    if level_values.get(level, 1) < level_values.get(notify_level, 3):
        logger.info(f"Notification level {level} below threshold {notify_level}, skipping")
        return True
    
    # Get webhook from environment if not provided
    slack_webhook = slack_webhook or os.environ.get("SLACK_WEBHOOK")
    
    # Get email recipients from environment if not provided
    if not email_recipients:
        email_env = os.environ.get("EMAIL_RECIPIENTS")
        email_recipients = email_env.split(",") if email_env else None
    
    # Send notifications
    slack_result = True
    email_result = True
    
    # Slack notification (if webhook provided)
    if slack_webhook:
        slack_result = send_slack_notification(
            webhook_url=slack_webhook,
            message=message,
            title=title,
            level=level
        )
    
    # Email notification (if recipients provided)
    if email_recipients:
        email_result = send_email_notification(
            recipients=email_recipients,
            message=message,
            subject=title,
            level=level
        )
    
    return slack_result and email_result


def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description="Send migration verification notifications")
    parser.add_argument(
        "--environment", "-e",
        default="development",
        choices=["development", "staging", "production", "test"],
        help="Environment name"
    )
    parser.add_argument(
        "--status", "-s",
        default="info",
        choices=["success", "failure", "warning", "info", "error"],
        help="Notification status"
    )
    parser.add_argument(
        "--title", "-t",
        default="Migration Verification Notification",
        help="Notification title"
    )
    parser.add_argument(
        "--message", "-m",
        required=True,
        help="Notification message"
    )
    parser.add_argument(
        "--slack-webhook", "-w",
        help="Slack webhook URL (overrides environment variable)"
    )
    parser.add_argument(
        "--email-recipients", "-r",
        help="Email recipients (comma-separated, overrides environment variable)"
    )
    return parser.parse_args()


def main():
    """Main function."""
    args = parse_args()
    
    # Parse email recipients if provided
    email_recipients = None
    if args.email_recipients:
        email_recipients = args.email_recipients.split(",")
    
    # Send notification
    success = send_notification(
        environment=args.environment,
        status=args.status,
        title=args.title,
        message=args.message,
        slack_webhook=args.slack_webhook,
        email_recipients=email_recipients
    )
    
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())