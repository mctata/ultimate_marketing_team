"""Plugin Architecture Module.

This module provides a plugin system for extending functionality with
custom code, enabling third-party developers to add features.
"""

import os
import sys
import json
import logging
import importlib
import importlib.util
import inspect
from typing import Dict, Any, Optional, List, Type, Callable
from datetime import datetime
import threading
import traceback

from src.core.database import get_db

logger = logging.getLogger(__name__)

class PluginBase:
    """Base class for all plugins."""
    
    # Class-level attributes that plugins must override
    plugin_id = None
    plugin_name = None
    plugin_version = None
    plugin_description = None
    plugin_author = None
    
    def __init__(self, config: Dict[str, Any] = None):
        """Initialize the plugin with configuration.
        
        Args:
            config: Optional configuration for the plugin
        """
        self.config = config or {}
        self.initialized = False
        self.enabled = False
    
    def initialize(self) -> bool:
        """Initialize the plugin.
        
        Returns:
            True if initialization was successful, False otherwise
        """
        self.initialized = True
        return True
    
    def shutdown(self) -> bool:
        """Shutdown the plugin.
        
        Returns:
            True if shutdown was successful, False otherwise
        """
        self.initialized = False
        return True
    
    def enable(self) -> bool:
        """Enable the plugin.
        
        Returns:
            True if enabling was successful, False otherwise
        """
        if not self.initialized:
            return False
        
        self.enabled = True
        return True
    
    def disable(self) -> bool:
        """Disable the plugin.
        
        Returns:
            True if disabling was successful, False otherwise
        """
        self.enabled = False
        return True
    
    def get_hooks(self) -> Dict[str, Callable]:
        """Get the hooks provided by this plugin.
        
        Returns:
            Dictionary of hook names and their handler functions
        """
        return {}
    
    def get_metadata(self) -> Dict[str, Any]:
        """Get plugin metadata.
        
        Returns:
            Dictionary of plugin metadata
        """
        return {
            "id": self.plugin_id,
            "name": self.plugin_name,
            "version": self.plugin_version,
            "description": self.plugin_description,
            "author": self.plugin_author,
            "initialized": self.initialized,
            "enabled": self.enabled
        }


class PluginManager:
    """Manager for the plugin system."""
    
    def __init__(self, plugins_dir: str = "plugins"):
        """Initialize the plugin manager.
        
        Args:
            plugins_dir: Directory where plugins are stored
        """
        self.plugins_dir = plugins_dir
        self.plugins = {}
        self.hooks = {}
        self.lock = threading.RLock()
    
    def discover_plugins(self) -> List[Dict[str, Any]]:
        """Discover available plugins in the plugins directory.
        
        Returns:
            List of metadata for discovered plugins
        """
        discovered = []
        
        # Ensure plugins directory exists
        if not os.path.exists(self.plugins_dir):
            os.makedirs(self.plugins_dir, exist_ok=True)
        
        # List top-level directories in the plugins directory
        try:
            plugin_folders = [
                folder for folder in os.listdir(self.plugins_dir)
                if os.path.isdir(os.path.join(self.plugins_dir, folder))
                and not folder.startswith("__") and not folder.startswith(".")
            ]
        except Exception as e:
            logger.error(f"Error listing plugin directories: {e}")
            return []
        
        for folder in plugin_folders:
            try:
                # Check for plugin metadata
                metadata_path = os.path.join(self.plugins_dir, folder, "plugin.json")
                if os.path.exists(metadata_path):
                    with open(metadata_path, "r") as f:
                        metadata = json.load(f)
                    
                    # Add metadata to discovered plugins
                    metadata["folder"] = folder
                    discovered.append(metadata)
            except Exception as e:
                logger.error(f"Error loading plugin metadata for {folder}: {e}")
        
        return discovered
    
    def load_plugin(self, plugin_id: str) -> Optional[Dict[str, Any]]:
        """Load a plugin by ID.
        
        Args:
            plugin_id: ID of the plugin to load
            
        Returns:
            Plugin metadata if loading was successful, None otherwise
        """
        with self.lock:
            # Check if plugin is already loaded
            if plugin_id in self.plugins:
                return self.plugins[plugin_id].get_metadata()
            
            # Find plugin by ID in discovered plugins
            discovered = self.discover_plugins()
            plugin_info = None
            
            for info in discovered:
                if info.get("id") == plugin_id:
                    plugin_info = info
                    break
            
            if not plugin_info:
                logger.error(f"Plugin not found: {plugin_id}")
                return None
            
            # Get plugin folder
            plugin_folder = plugin_info.get("folder")
            if not plugin_folder:
                logger.error(f"Plugin folder not specified for {plugin_id}")
                return None
            
            # Check for main module file
            main_module_path = os.path.join(self.plugins_dir, plugin_folder, "main.py")
            if not os.path.exists(main_module_path):
                logger.error(f"Main module not found for plugin {plugin_id}")
                return None
            
            try:
                # Load the plugin module
                spec = importlib.util.spec_from_file_location(
                    f"plugins.{plugin_folder}.main",
                    main_module_path
                )
                module = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(module)
                
                # Find plugin class (subclass of PluginBase)
                plugin_class = None
                for name, obj in inspect.getmembers(module):
                    if (inspect.isclass(obj) and issubclass(obj, PluginBase) 
                            and obj != PluginBase and obj.plugin_id == plugin_id):
                        plugin_class = obj
                        break
                
                if not plugin_class:
                    logger.error(f"Plugin class not found for {plugin_id}")
                    return None
                
                # Create plugin instance
                config = plugin_info.get("config", {})
                plugin = plugin_class(config)
                
                # Initialize plugin
                if not plugin.initialize():
                    logger.error(f"Failed to initialize plugin {plugin_id}")
                    return None
                
                # Register plugin
                self.plugins[plugin_id] = plugin
                
                # Register hooks
                hooks = plugin.get_hooks()
                for hook_name, handler in hooks.items():
                    if hook_name not in self.hooks:
                        self.hooks[hook_name] = []
                    self.hooks[hook_name].append((plugin_id, handler))
                
                logger.info(f"Plugin {plugin_id} loaded successfully")
                return plugin.get_metadata()
            
            except Exception as e:
                logger.error(f"Error loading plugin {plugin_id}: {e}")
                traceback.print_exc()
                return None
    
    def unload_plugin(self, plugin_id: str) -> bool:
        """Unload a plugin by ID.
        
        Args:
            plugin_id: ID of the plugin to unload
            
        Returns:
            True if unloading was successful, False otherwise
        """
        with self.lock:
            # Check if plugin is loaded
            if plugin_id not in self.plugins:
                logger.error(f"Plugin {plugin_id} is not loaded")
                return False
            
            try:
                # Get plugin instance
                plugin = self.plugins[plugin_id]
                
                # Disable and shutdown plugin
                plugin.disable()
                plugin.shutdown()
                
                # Remove hooks
                for hook_name in list(self.hooks.keys()):
                    self.hooks[hook_name] = [
                        (pid, handler) for pid, handler in self.hooks[hook_name]
                        if pid != plugin_id
                    ]
                    
                    # Remove empty hook lists
                    if not self.hooks[hook_name]:
                        del self.hooks[hook_name]
                
                # Remove plugin
                del self.plugins[plugin_id]
                
                logger.info(f"Plugin {plugin_id} unloaded successfully")
                return True
            
            except Exception as e:
                logger.error(f"Error unloading plugin {plugin_id}: {e}")
                return False
    
    def enable_plugin(self, plugin_id: str) -> bool:
        """Enable a loaded plugin.
        
        Args:
            plugin_id: ID of the plugin to enable
            
        Returns:
            True if enabling was successful, False otherwise
        """
        with self.lock:
            # Check if plugin is loaded
            if plugin_id not in self.plugins:
                logger.error(f"Plugin {plugin_id} is not loaded")
                return False
            
            try:
                # Get plugin instance
                plugin = self.plugins[plugin_id]
                
                # Enable plugin
                result = plugin.enable()
                if result:
                    logger.info(f"Plugin {plugin_id} enabled successfully")
                else:
                    logger.error(f"Failed to enable plugin {plugin_id}")
                
                return result
            
            except Exception as e:
                logger.error(f"Error enabling plugin {plugin_id}: {e}")
                return False
    
    def disable_plugin(self, plugin_id: str) -> bool:
        """Disable a loaded plugin.
        
        Args:
            plugin_id: ID of the plugin to disable
            
        Returns:
            True if disabling was successful, False otherwise
        """
        with self.lock:
            # Check if plugin is loaded
            if plugin_id not in self.plugins:
                logger.error(f"Plugin {plugin_id} is not loaded")
                return False
            
            try:
                # Get plugin instance
                plugin = self.plugins[plugin_id]
                
                # Disable plugin
                result = plugin.disable()
                if result:
                    logger.info(f"Plugin {plugin_id} disabled successfully")
                else:
                    logger.error(f"Failed to disable plugin {plugin_id}")
                
                return result
            
            except Exception as e:
                logger.error(f"Error disabling plugin {plugin_id}: {e}")
                return False
    
    def get_loaded_plugins(self) -> List[Dict[str, Any]]:
        """Get list of loaded plugins.
        
        Returns:
            List of metadata for loaded plugins
        """
        with self.lock:
            return [plugin.get_metadata() for plugin in self.plugins.values()]
    
    def call_hook(self, hook_name: str, *args, **kwargs) -> List[Any]:
        """Call all handlers for a specific hook.
        
        Args:
            hook_name: Name of the hook to call
            *args: Positional arguments to pass to the hook handlers
            **kwargs: Keyword arguments to pass to the hook handlers
            
        Returns:
            List of results from all hook handlers
        """
        with self.lock:
            # Check if hook exists
            if hook_name not in self.hooks:
                return []
            
            results = []
            
            # Call each handler
            for plugin_id, handler in self.hooks[hook_name]:
                try:
                    # Check if plugin is enabled
                    if not self.plugins[plugin_id].enabled:
                        continue
                    
                    # Call handler
                    result = handler(*args, **kwargs)
                    results.append(result)
                
                except Exception as e:
                    logger.error(f"Error calling hook {hook_name} in plugin {plugin_id}: {e}")
                    traceback.print_exc()
            
            return results
    
    def get_available_hooks(self) -> Dict[str, List[str]]:
        """Get list of available hooks and the plugins that implement them.
        
        Returns:
            Dictionary mapping hook names to lists of plugin IDs
        """
        with self.lock:
            result = {}
            
            for hook_name, handlers in self.hooks.items():
                result[hook_name] = [plugin_id for plugin_id, _ in handlers]
            
            return result