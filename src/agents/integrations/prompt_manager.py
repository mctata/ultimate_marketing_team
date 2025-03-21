"""
Prompt Template Manager

This module provides a unified system for managing AI prompt templates with versioning,
analytics-driven enhancement, and multi-provider optimization.
"""

import os
import yaml
import json
import re
import hashlib
from datetime import datetime
from typing import Dict, List, Any, Optional, Union, Tuple
import logging
from pathlib import Path

# Configure logging
logger = logging.getLogger(__name__)


class PromptVersion:
    """Manages versioning for prompt templates."""
    
    def __init__(self, template_path: str, version_dir: Optional[str] = None):
        """
        Initialize the prompt version manager.
        
        Args:
            template_path: Path to the template file
            version_dir: Directory to store versions (defaults to a 'versions' subdirectory)
        """
        self.template_path = template_path
        self.template_name = os.path.basename(template_path)
        self.template_dir = os.path.dirname(template_path)
        
        # Set up versioning directory
        if version_dir:
            self.version_dir = version_dir
        else:
            self.version_dir = os.path.join(self.template_dir, 'versions', 
                                           os.path.splitext(self.template_name)[0])
        
        # Create versioning directory if it doesn't exist
        os.makedirs(self.version_dir, exist_ok=True)
    
    def save_version(self, template_content: str, version_note: str) -> str:
        """
        Save a new version of the template.
        
        Args:
            template_content: The template content to version
            version_note: Note explaining the changes in this version
            
        Returns:
            Version ID for the saved version
        """
        # Create a hash of the content for version identification
        content_hash = hashlib.md5(template_content.encode()).hexdigest()[:10]
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version_id = f"{timestamp}_{content_hash}"
        
        # Create version metadata
        metadata = {
            "version_id": version_id,
            "timestamp": datetime.now().isoformat(),
            "note": version_note,
            "content_hash": content_hash,
        }
        
        # Save the version file
        version_path = os.path.join(self.version_dir, f"{version_id}.yaml")
        
        with open(version_path, 'w') as f:
            f.write(f"# Version: {version_id}\n")
            f.write(f"# Timestamp: {metadata['timestamp']}\n")
            f.write(f"# Note: {version_note}\n")
            f.write("---\n")
            f.write(template_content)
        
        # Update version index
        self._update_version_index(version_id, metadata)
        
        return version_id
    
    def get_version(self, version_id: str) -> Optional[str]:
        """
        Get a specific version of the template.
        
        Args:
            version_id: The version ID to retrieve
            
        Returns:
            The template content or None if not found
        """
        version_path = os.path.join(self.version_dir, f"{version_id}.yaml")
        if not os.path.exists(version_path):
            return None
            
        with open(version_path, 'r') as f:
            content = f.read()
            
        # Strip the metadata header
        if '---' in content:
            content = content.split('---', 1)[1].strip()
            
        return content
    
    def list_versions(self) -> List[Dict[str, Any]]:
        """
        List all available versions with metadata.
        
        Returns:
            List of version information dictionaries
        """
        index_path = os.path.join(self.version_dir, "version_index.json")
        if not os.path.exists(index_path):
            return []
            
        with open(index_path, 'r') as f:
            try:
                index = json.load(f)
                return index.get("versions", [])
            except json.JSONDecodeError:
                logger.error(f"Error decoding version index file: {index_path}")
                return []
    
    def get_latest_version(self) -> Optional[str]:
        """
        Get the latest version ID.
        
        Returns:
            Latest version ID or None if no versions exist
        """
        versions = self.list_versions()
        if not versions:
            return None
            
        # Sort by timestamp (newest first)
        versions.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return versions[0].get("version_id")
    
    def _update_version_index(self, version_id: str, metadata: Dict[str, Any]) -> None:
        """
        Update the version index file.
        
        Args:
            version_id: The version ID to add
            metadata: Version metadata
        """
        index_path = os.path.join(self.version_dir, "version_index.json")
        
        if os.path.exists(index_path):
            with open(index_path, 'r') as f:
                try:
                    index = json.load(f)
                except json.JSONDecodeError:
                    index = {"versions": []}
        else:
            index = {"versions": []}
        
        # Add the new version info
        index["versions"].append(metadata)
        
        # Sort by timestamp (newest first)
        index["versions"].sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        # Save updated index
        with open(index_path, 'w') as f:
            json.dump(index, f, indent=2)


class PromptAnalytics:
    """Analytics for prompt performance and optimization."""
    
    def __init__(self, analytics_dir: str):
        """
        Initialize the prompt analytics system.
        
        Args:
            analytics_dir: Directory to store analytics data
        """
        self.analytics_dir = analytics_dir
        os.makedirs(analytics_dir, exist_ok=True)
    
    def record_usage(self, 
                   template_id: str,
                   version_id: str,
                   model: str,
                   context_vars: Dict[str, Any],
                   performance_metrics: Dict[str, Any]) -> None:
        """
        Record template usage and performance metrics.
        
        Args:
            template_id: The template identifier
            version_id: The template version ID
            model: AI model used
            context_vars: Variables used in the template
            performance_metrics: Performance data for this usage
        """
        timestamp = datetime.now().isoformat()
        
        # Create a unique ID for this usage record
        usage_id = hashlib.md5(f"{template_id}_{version_id}_{timestamp}".encode()).hexdigest()[:10]
        
        # Create record structure
        record = {
            "usage_id": usage_id,
            "template_id": template_id,
            "version_id": version_id,
            "timestamp": timestamp,
            "model": model,
            "context_variables": context_vars,
            "performance_metrics": performance_metrics
        }
        
        # Save record to analytics storage
        month_dir = os.path.join(self.analytics_dir, datetime.now().strftime("%Y-%m"))
        os.makedirs(month_dir, exist_ok=True)
        
        record_path = os.path.join(month_dir, f"{usage_id}.json")
        with open(record_path, 'w') as f:
            json.dump(record, f, indent=2)
        
        # Update aggregated metrics
        self._update_template_metrics(template_id, version_id, performance_metrics)
    
    def get_template_performance(self, template_id: str, days: int = 30) -> Dict[str, Any]:
        """
        Get performance data for a specific template.
        
        Args:
            template_id: The template identifier
            days: Number of days to include in the report
            
        Returns:
            Performance statistics dictionary
        """
        metrics_path = os.path.join(self.analytics_dir, f"{template_id}_metrics.json")
        if not os.path.exists(metrics_path):
            return {"usage_count": 0, "versions": {}, "performance": {}}
            
        with open(metrics_path, 'r') as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                logger.error(f"Error decoding metrics file: {metrics_path}")
                return {"usage_count": 0, "versions": {}, "performance": {}}
    
    def get_version_performance(self, template_id: str, version_id: str) -> Dict[str, Any]:
        """
        Get performance data for a specific template version.
        
        Args:
            template_id: The template identifier
            version_id: The template version ID
            
        Returns:
            Version-specific performance statistics
        """
        metrics = self.get_template_performance(template_id)
        versions = metrics.get("versions", {})
        return versions.get(version_id, {"usage_count": 0, "performance": {}})
    
    def get_improvement_suggestions(self, template_id: str) -> List[Dict[str, Any]]:
        """
        Generate suggestions for template improvements based on analytics.
        
        Args:
            template_id: The template identifier
            
        Returns:
            List of improvement suggestions
        """
        metrics = self.get_template_performance(template_id)
        suggestions = []
        
        # Analyze version performance
        versions = metrics.get("versions", {})
        if len(versions) > 1:
            # Sort versions by overall effectiveness
            version_performance = []
            for ver_id, ver_data in versions.items():
                perf = ver_data.get("performance", {})
                
                # Calculate a composite score
                engagement = perf.get("engagement_rate", 0)
                conversion = perf.get("conversion_rate", 0)
                rating = perf.get("user_rating", 0)
                
                composite_score = (engagement * 0.3) + (conversion * 0.5) + (rating * 0.2)
                
                version_performance.append({
                    "version_id": ver_id,
                    "usage_count": ver_data.get("usage_count", 0),
                    "composite_score": composite_score,
                    "performance": perf
                })
            
            # Sort by score (highest first)
            version_performance.sort(key=lambda x: x["composite_score"], reverse=True)
            
            # Generate suggestions based on comparative analysis
            if len(version_performance) >= 2:
                best = version_performance[0]
                others = version_performance[1:]
                
                for other in others:
                    if best["composite_score"] > other["composite_score"] * 1.1:  # 10% better
                        suggestions.append({
                            "type": "version_comparison",
                            "message": f"Version {best['version_id']} outperforms {other['version_id']} by {((best['composite_score']/other['composite_score'])-1)*100:.1f}%. Consider deprecating the lower-performing version.",
                            "score_difference": best["composite_score"] - other["composite_score"]
                        })
        
        # Analyze performance patterns
        performance = metrics.get("performance", {})
        
        # Check for low conversion rates
        conversion_rate = performance.get("conversion_rate", 0)
        if conversion_rate < 0.02:  # 2% threshold
            suggestions.append({
                "type": "low_conversion",
                "message": f"Low conversion rate ({conversion_rate:.1%}). Consider strengthening call-to-action language and value proposition."
            })
        
        # Check for low engagement rates
        engagement_rate = performance.get("engagement_rate", 0)
        if engagement_rate < 0.1:  # 10% threshold
            suggestions.append({
                "type": "low_engagement",
                "message": f"Low engagement rate ({engagement_rate:.1%}). Consider more compelling opening content and clearer structure."
            })
        
        return suggestions
    
    def _update_template_metrics(self, template_id: str, version_id: str, 
                               performance_metrics: Dict[str, Any]) -> None:
        """
        Update aggregated metrics for a template.
        
        Args:
            template_id: The template identifier
            version_id: The template version ID
            performance_metrics: New performance data
        """
        metrics_path = os.path.join(self.analytics_dir, f"{template_id}_metrics.json")
        
        if os.path.exists(metrics_path):
            with open(metrics_path, 'r') as f:
                try:
                    metrics = json.load(f)
                except json.JSONDecodeError:
                    metrics = {"usage_count": 0, "versions": {}, "performance": {}}
        else:
            metrics = {"usage_count": 0, "versions": {}, "performance": {}}
        
        # Update overall usage count
        metrics["usage_count"] = metrics.get("usage_count", 0) + 1
        
        # Ensure version exists in metrics
        if version_id not in metrics.get("versions", {}):
            if "versions" not in metrics:
                metrics["versions"] = {}
            metrics["versions"][version_id] = {"usage_count": 0, "performance": {}}
        
        # Update version usage count
        metrics["versions"][version_id]["usage_count"] = metrics["versions"][version_id].get("usage_count", 0) + 1
        
        # Update performance metrics (running averages)
        for metric, value in performance_metrics.items():
            # Update global metrics
            if metric not in metrics["performance"]:
                metrics["performance"][metric] = value
            else:
                # Calculate running average
                current = metrics["performance"][metric]
                count = metrics["usage_count"]
                metrics["performance"][metric] = ((current * (count - 1)) + value) / count
                
            # Update version-specific metrics
            if metric not in metrics["versions"][version_id]["performance"]:
                metrics["versions"][version_id]["performance"][metric] = value
            else:
                # Calculate running average
                current = metrics["versions"][version_id]["performance"][metric]
                count = metrics["versions"][version_id]["usage_count"]
                metrics["versions"][version_id]["performance"][metric] = ((current * (count - 1)) + value) / count
        
        # Save updated metrics
        with open(metrics_path, 'w') as f:
            json.dump(metrics, f, indent=2)


class PromptTemplate:
    """Manages a single prompt template with variable substitution and versioning."""
    
    def __init__(self, template_path: str, analytics: Optional[PromptAnalytics] = None):
        """
        Initialize a prompt template.
        
        Args:
            template_path: Path to the template YAML file
            analytics: Optional analytics instance for tracking performance
        """
        self.template_path = template_path
        self.template_id = os.path.splitext(os.path.basename(template_path))[0]
        self.analytics = analytics
        self.versioning = PromptVersion(template_path)
        
        # Load the template
        self.reload()
    
    def reload(self) -> None:
        """Reload the template from disk."""
        try:
            with open(self.template_path, 'r') as f:
                template_data = yaml.safe_load(f)
            
            self.system_prompt = template_data.get('system_prompt', '')
            self.template = template_data.get('template', '')
            self.response_format = template_data.get('response_format', '')
            
            # Optional fields
            self.metadata = template_data.get('metadata', {})
            self.examples = template_data.get('examples', [])
            
        except Exception as e:
            logger.error(f"Error loading template {self.template_path}: {str(e)}")
            raise
    
    def render(self, variables: Dict[str, Any], 
             system_prompt_vars: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Render the template with the provided variables.
        
        Args:
            variables: Dictionary of variables to substitute in the template
            system_prompt_vars: Optional separate variables for system prompt
            
        Returns:
            Dictionary containing rendered system prompt and user prompt
        """
        # If no separate system prompt variables provided, use the same variables
        if system_prompt_vars is None:
            system_prompt_vars = variables
            
        # Render system prompt
        rendered_system = self._substitute_variables(self.system_prompt, system_prompt_vars)
        
        # Render main template
        rendered_template = self._substitute_variables(self.template, variables)
        
        # Render response format if available
        rendered_response_format = ""
        if self.response_format:
            rendered_response_format = self._substitute_variables(self.response_format, variables)
            
        return {
            "system_prompt": rendered_system,
            "user_prompt": rendered_template,
            "response_format": rendered_response_format
        }
    
    def save_version(self, version_note: str) -> str:
        """
        Save the current template as a new version.
        
        Args:
            version_note: Note explaining the changes in this version
            
        Returns:
            Version ID for the saved version
        """
        # Create composite template content
        template_content = yaml.dump({
            'system_prompt': self.system_prompt,
            'template': self.template,
            'response_format': self.response_format,
            'metadata': self.metadata,
            'examples': self.examples
        }, default_flow_style=False)
        
        return self.versioning.save_version(template_content, version_note)
    
    def load_version(self, version_id: str) -> bool:
        """
        Load a specific version of the template.
        
        Args:
            version_id: The version ID to load
            
        Returns:
            True if successfully loaded, False otherwise
        """
        template_content = self.versioning.get_version(version_id)
        if not template_content:
            return False
            
        try:
            template_data = yaml.safe_load(template_content)
            
            self.system_prompt = template_data.get('system_prompt', '')
            self.template = template_data.get('template', '')
            self.response_format = template_data.get('response_format', '')
            self.metadata = template_data.get('metadata', {})
            self.examples = template_data.get('examples', [])
            
            return True
        except Exception as e:
            logger.error(f"Error loading template version {version_id}: {str(e)}")
            return False
    
    def record_usage(self, version_id: str, model: str, 
                   variables: Dict[str, Any], 
                   performance_metrics: Dict[str, Any]) -> None:
        """
        Record template usage with performance metrics.
        
        Args:
            version_id: The template version ID used
            model: AI model used
            variables: Variables used for rendering
            performance_metrics: Performance data for this usage
        """
        if self.analytics:
            self.analytics.record_usage(
                template_id=self.template_id,
                version_id=version_id,
                model=model,
                context_vars=variables,
                performance_metrics=performance_metrics
            )
    
    def get_performance(self) -> Dict[str, Any]:
        """
        Get performance data for this template.
        
        Returns:
            Performance statistics dictionary
        """
        if self.analytics:
            return self.analytics.get_template_performance(self.template_id)
        return {"usage_count": 0, "versions": {}, "performance": {}}
    
    def get_improvement_suggestions(self) -> List[Dict[str, Any]]:
        """
        Get suggestions for template improvements.
        
        Returns:
            List of improvement suggestions
        """
        if self.analytics:
            return self.analytics.get_improvement_suggestions(self.template_id)
        return []
    
    def _substitute_variables(self, text: str, variables: Dict[str, Any]) -> str:
        """
        Substitute variables in template text.
        
        Args:
            text: Template text with {{variable}} placeholders
            variables: Dictionary of variables to substitute
            
        Returns:
            Text with variables substituted
        """
        if not text:
            return ""
            
        # Use regex to find all {{variable}} patterns
        pattern = r'{{([^{}]+)}}'
        
        def replace(match):
            variable_name = match.group(1).strip()
            
            # Handle nested dictionary access with dot notation
            if '.' in variable_name:
                parts = variable_name.split('.')
                value = variables
                for part in parts:
                    if isinstance(value, dict) and part in value:
                        value = value[part]
                    else:
                        # If any part doesn't exist, return the original placeholder
                        return match.group(0)
                return str(value)
                
            # Simple variable replacement
            if variable_name in variables:
                return str(variables[variable_name])
                
            # If variable not found, return the original placeholder
            return match.group(0)
            
        return re.sub(pattern, replace, text)


class PromptManager:
    """Central manager for all prompt templates with versioning and analytics."""
    
    def __init__(self, templates_dir: str, analytics_dir: Optional[str] = None):
        """
        Initialize the prompt manager.
        
        Args:
            templates_dir: Directory containing template files
            analytics_dir: Optional directory for analytics storage
        """
        self.templates_dir = templates_dir
        self.templates = {}
        
        # Set up analytics if directory provided
        self.analytics = None
        if analytics_dir:
            self.analytics = PromptAnalytics(analytics_dir)
        
        # Load initial templates
        self.load_templates()
    
    def load_templates(self) -> None:
        """Load all templates from the templates directory."""
        for root, _, files in os.walk(self.templates_dir):
            for file in files:
                if file.endswith('.yaml') and not root.endswith('versions'):
                    template_path = os.path.join(root, file)
                    template_id = os.path.splitext(file)[0]
                    
                    try:
                        self.templates[template_id] = PromptTemplate(
                            template_path=template_path,
                            analytics=self.analytics
                        )
                        logger.info(f"Loaded template: {template_id}")
                    except Exception as e:
                        logger.error(f"Error loading template {template_id}: {str(e)}")
    
    def get_template(self, template_id: str) -> Optional[PromptTemplate]:
        """
        Get a specific template by ID.
        
        Args:
            template_id: The template identifier
            
        Returns:
            The template object or None if not found
        """
        return self.templates.get(template_id)
    
    def render_prompt(self, template_id: str, variables: Dict[str, Any],
                    system_prompt_vars: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        """
        Render a prompt from a template.
        
        Args:
            template_id: The template identifier
            variables: Dictionary of variables to substitute in the template
            system_prompt_vars: Optional separate variables for system prompt
            
        Returns:
            Dictionary containing rendered system prompt and user prompt
            
        Raises:
            ValueError: If template not found
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
            
        return template.render(variables, system_prompt_vars)
    
    def create_template(self, template_id: str, system_prompt: str, 
                      template_content: str, response_format: str = "",
                      metadata: Dict[str, Any] = None) -> str:
        """
        Create a new template.
        
        Args:
            template_id: The template identifier
            system_prompt: System prompt text
            template_content: Main template content
            response_format: Optional response format template
            metadata: Optional metadata dictionary
            
        Returns:
            Path to the created template file
            
        Raises:
            ValueError: If template already exists
        """
        if template_id in self.templates:
            raise ValueError(f"Template already exists: {template_id}")
            
        # Ensure template ID is valid filename
        template_id = re.sub(r'[^a-zA-Z0-9_-]', '_', template_id)
        
        # Create template structure
        template_data = {
            'system_prompt': system_prompt,
            'template': template_content,
            'response_format': response_format,
            'metadata': metadata or {},
            'examples': []
        }
        
        # Create template file
        template_path = os.path.join(self.templates_dir, f"{template_id}.yaml")
        with open(template_path, 'w') as f:
            yaml.dump(template_data, f, default_flow_style=False)
            
        # Load the new template
        self.templates[template_id] = PromptTemplate(
            template_path=template_path,
            analytics=self.analytics
        )
        
        # Create initial version
        self.templates[template_id].save_version("Initial version")
        
        return template_path
    
    def update_template(self, template_id: str, system_prompt: Optional[str] = None,
                     template_content: Optional[str] = None, 
                     response_format: Optional[str] = None,
                     metadata: Optional[Dict[str, Any]] = None,
                     version_note: str = "Updated template") -> bool:
        """
        Update an existing template and create a new version.
        
        Args:
            template_id: The template identifier
            system_prompt: Optional new system prompt
            template_content: Optional new template content
            response_format: Optional new response format
            metadata: Optional new metadata
            version_note: Note explaining the changes
            
        Returns:
            True if successful, False otherwise
            
        Raises:
            ValueError: If template not found
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
            
        # Update template components if provided
        changed = False
        
        if system_prompt is not None:
            template.system_prompt = system_prompt
            changed = True
            
        if template_content is not None:
            template.template = template_content
            changed = True
            
        if response_format is not None:
            template.response_format = response_format
            changed = True
            
        if metadata is not None:
            template.metadata = metadata
            changed = True
            
        if not changed:
            return False
            
        # Save the updated template
        template_data = {
            'system_prompt': template.system_prompt,
            'template': template.template,
            'response_format': template.response_format,
            'metadata': template.metadata,
            'examples': template.examples
        }
        
        with open(template.template_path, 'w') as f:
            yaml.dump(template_data, f, default_flow_style=False)
            
        # Create a new version
        template.save_version(version_note)
        
        return True
    
    def get_analytics(self, template_id: str) -> Dict[str, Any]:
        """
        Get analytics data for a template.
        
        Args:
            template_id: The template identifier
            
        Returns:
            Analytics data dictionary
            
        Raises:
            ValueError: If template not found
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
            
        return template.get_performance()
    
    def get_suggestions(self, template_id: str) -> List[Dict[str, Any]]:
        """
        Get improvement suggestions for a template.
        
        Args:
            template_id: The template identifier
            
        Returns:
            List of improvement suggestions
            
        Raises:
            ValueError: If template not found
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
            
        return template.get_improvement_suggestions()
    
    def record_usage(self, template_id: str, version_id: str, model: str,
                   variables: Dict[str, Any], 
                   performance_metrics: Dict[str, Any]) -> None:
        """
        Record template usage with performance metrics.
        
        Args:
            template_id: The template identifier
            version_id: The template version ID used
            model: AI model used
            variables: Variables used for rendering
            performance_metrics: Performance data for this usage
            
        Raises:
            ValueError: If template not found
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
            
        template.record_usage(version_id, model, variables, performance_metrics)
    
    def optimize_for_provider(self, template_id: str, provider: str) -> Tuple[bool, str]:
        """
        Optimize a template for a specific AI provider.
        
        Args:
            template_id: The template identifier
            provider: The AI provider (openai, anthropic, etc.)
            
        Returns:
            Tuple of (success boolean, new version ID or error message)
            
        Raises:
            ValueError: If template not found
        """
        template = self.get_template(template_id)
        if not template:
            raise ValueError(f"Template not found: {template_id}")
            
        # Provider-specific optimizations
        if provider.lower() == 'openai':
            # OpenAI optimization
            optimized = self._optimize_for_openai(template)
            if optimized:
                version_id = template.save_version(f"Optimized for OpenAI")
                return True, version_id
            return False, "No optimization needed"
            
        elif provider.lower() == 'anthropic':
            # Anthropic optimization
            optimized = self._optimize_for_anthropic(template)
            if optimized:
                version_id = template.save_version(f"Optimized for Anthropic")
                return True, version_id
            return False, "No optimization needed"
            
        elif provider.lower() == 'gemini':
            # Google Gemini optimization
            optimized = self._optimize_for_gemini(template)
            if optimized:
                version_id = template.save_version(f"Optimized for Gemini")
                return True, version_id
            return False, "No optimization needed"
            
        return False, f"Unsupported provider: {provider}"
    
    def _optimize_for_openai(self, template: PromptTemplate) -> bool:
        """
        Optimize a template for OpenAI models.
        
        Args:
            template: The template to optimize
            
        Returns:
            True if changes were made, False otherwise
        """
        changed = False
        
        # OpenAI optimization strategies
        
        # 1. Ensure system prompt is concise
        if len(template.system_prompt.split()) > 150:
            # If system prompt is too long, extract key instructions
            # (This is a simplified approach; a more sophisticated approach would use NLP)
            lines = template.system_prompt.split('\n')
            essential_lines = [line for line in lines if any(kw in line.lower() for kw in 
                                                          ['should', 'must', 'role', 'your task', 'important'])]
            if essential_lines:
                template.system_prompt = '\n'.join(essential_lines)
                changed = True
        
        # 2. Ensure clear delimiter for response format
        if template.response_format and "format your response" not in template.template.lower():
            template.template += "\n\nFormat your response as follows:\n" + template.response_format
            template.response_format = ""  # Move into main template
            changed = True
        
        return changed
    
    def _optimize_for_anthropic(self, template: PromptTemplate) -> bool:
        """
        Optimize a template for Anthropic Claude models.
        
        Args:
            template: The template to optimize
            
        Returns:
            True if changes were made, False otherwise
        """
        changed = False
        
        # Anthropic optimization strategies
        
        # 1. Ensure XML-style formatting for structured outputs
        if template.response_format and "<" not in template.response_format:
            # Convert bullet points to XML tags
            response_format = template.response_format
            
            # Replace markdown headers with XML tags
            response_format = re.sub(r'^# (.*?)$', r'<heading>\1</heading>', response_format, flags=re.MULTILINE)
            response_format = re.sub(r'^## (.*?)$', r'<subheading>\1</subheading>', response_format, flags=re.MULTILINE)
            
            # Replace bullet lists with XML
            response_format = re.sub(r'- (.*?)$', r'<item>\1</item>', response_format, flags=re.MULTILINE)
            
            if response_format != template.response_format:
                template.response_format = response_format
                changed = True
        
        # 2. Move system prompt into user message if needed
        if template.system_prompt and not template.template.startswith("I need you to"):
            template.template = f"I need you to act as described below:\n\n{template.system_prompt}\n\n{template.template}"
            template.system_prompt = ""
            changed = True
        
        return changed
    
    def _optimize_for_gemini(self, template: PromptTemplate) -> bool:
        """
        Optimize a template for Google's Gemini models.
        
        Args:
            template: The template to optimize
            
        Returns:
            True if changes were made, False otherwise
        """
        changed = False
        
        # Gemini optimization strategies
        
        # 1. Ensure clear input/output examples if not present
        if not template.examples and not "example" in template.template.lower():
            # Add a placeholder for examples
            template.template += "\n\nHere's an example of what I'm looking for:\nInput: [example input]\nOutput: [example output format]"
            changed = True
        
        # 2. Ensure step-by-step instructions
        if "step by step" not in template.template.lower() and "steps:" not in template.template.lower():
            template.template += "\n\nPlease approach this task step by step."
            changed = True
        
        return changed


# Example usage
if __name__ == "__main__":
    # This code only runs when the module is executed directly
    base_dir = os.path.dirname(os.path.abspath(__file__))
    templates_dir = os.path.join(base_dir, "..", "config", "prompts", "templates")
    analytics_dir = os.path.join(base_dir, "..", "config", "prompts", "analytics")
    
    # Create directories if they don't exist
    os.makedirs(templates_dir, exist_ok=True)
    os.makedirs(analytics_dir, exist_ok=True)
    
    # Create the prompt manager
    manager = PromptManager(templates_dir, analytics_dir)
    
    # Demo optimization for a template
    if 'blog_post_prompt' in manager.templates:
        print("Optimizing blog post template for OpenAI...")
        success, message = manager.optimize_for_provider('blog_post_prompt', 'openai')
        print(f"Optimization result: {success}, {message}")