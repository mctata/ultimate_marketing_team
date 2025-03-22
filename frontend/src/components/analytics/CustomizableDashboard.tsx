import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  IconButton, 
  Menu, 
  MenuItem, 
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  ListItemText,
  Checkbox,
  Tabs,
  Tab,
  Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SettingsIcon from '@mui/icons-material/Settings';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import ViewDayIcon from '@mui/icons-material/ViewDay';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

export interface WidgetDefinition {
  type: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  defaultSize?: 'small' | 'medium' | 'large';
  defaultOptions?: Record<string, any>;
  component: React.ComponentType<any>;
}

export interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  size: 'small' | 'medium' | 'large';
  position: number;
  options: Record<string, any>;
}

export interface Dashboard {
  id: string;
  name: string;
  widgets: DashboardWidget[];
}

interface CustomizableDashboardProps {
  availableWidgets: WidgetDefinition[];
  dashboard: Dashboard;
  isEditing: boolean;
  onAddWidget?: (widget: DashboardWidget) => void;
  onUpdateWidget?: (id: string, updates: Partial<DashboardWidget>) => void;
  onRemoveWidget?: (id: string) => void;
  onSaveDashboard?: (name: string) => void;
  onUpdateLayout?: (widgets: DashboardWidget[]) => void;
  data: Record<string, any>;
  isLoading?: boolean;
  onExport?: () => void;
  onToggleEditMode?: () => void;
}

// Map of widget sizes to grid columns
const WIDGET_SIZE_MAP = {
  small: { xs: 12, sm: 6, md: 4, lg: 3 },
  medium: { xs: 12, sm: 12, md: 6, lg: 6 },
  large: { xs: 12, sm: 12, md: 12, lg: 12 }
};

const CustomizableDashboard: React.FC<CustomizableDashboardProps> = ({
  availableWidgets,
  dashboard,
  isEditing,
  onAddWidget,
  onUpdateWidget,
  onRemoveWidget,
  onSaveDashboard,
  onUpdateLayout,
  data,
  isLoading = false,
  onExport,
  onToggleEditMode
}) => {
  const [addWidgetOpen, setAddWidgetOpen] = useState(false);
  const [editWidgetOpen, setEditWidgetOpen] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [editingWidget, setEditingWidget] = useState<DashboardWidget | null>(null);
  const [newDashboardName, setNewDashboardName] = useState(dashboard.name);
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [widgetMenuAnchorEl, setWidgetMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');

  // Sort widgets by position
  const sortedWidgets = [...dashboard.widgets].sort((a, b) => a.position - b.position);

  // Handle dashboard menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };

  // Handle dashboard menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle widget menu open
  const handleWidgetMenuOpen = (event: React.MouseEvent<HTMLElement>, widgetId: string) => {
    event.stopPropagation();
    setSelectedWidget(widgetId);
    setWidgetMenuAnchorEl(event.currentTarget);
  };

  // Handle widget menu close
  const handleWidgetMenuClose = () => {
    setWidgetMenuAnchorEl(null);
  };

  // Open add widget dialog
  const handleAddWidgetClick = () => {
    setAddWidgetOpen(true);
    handleMenuClose();
  };

  // Add new widget
  const handleAddWidget = (widgetType: string) => {
    if (onAddWidget) {
      const widgetDef = availableWidgets.find(w => w.type === widgetType);
      if (widgetDef) {
        const newWidget: DashboardWidget = {
          id: `widget-${Date.now()}`,
          type: widgetType,
          title: widgetDef.title,
          size: widgetDef.defaultSize || 'medium',
          position: dashboard.widgets.length,
          options: widgetDef.defaultOptions || {}
        };
        onAddWidget(newWidget);
      }
    }
    setAddWidgetOpen(false);
  };

  // Open edit widget dialog
  const handleEditWidget = (widgetId: string) => {
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (widget) {
      setEditingWidget(widget);
      setEditWidgetOpen(true);
    }
    handleWidgetMenuClose();
  };

  // Save widget changes
  const handleSaveWidget = () => {
    if (editingWidget && onUpdateWidget) {
      onUpdateWidget(editingWidget.id, {
        title: editingWidget.title,
        size: editingWidget.size,
        options: editingWidget.options
      });
    }
    setEditWidgetOpen(false);
    setEditingWidget(null);
  };

  // Remove widget
  const handleRemoveWidget = (widgetId: string) => {
    if (onRemoveWidget) {
      onRemoveWidget(widgetId);
    }
    handleWidgetMenuClose();
  };

  // Open save dashboard dialog
  const handleSaveDialogOpen = () => {
    setNewDashboardName(dashboard.name);
    setSaveDialogOpen(true);
    handleMenuClose();
  };

  // Save dashboard
  const handleSaveDashboard = () => {
    if (onSaveDashboard && newDashboardName.trim()) {
      onSaveDashboard(newDashboardName.trim());
    }
    setSaveDialogOpen(false);
  };

  // Export dashboard
  const handleExport = () => {
    if (onExport) {
      onExport();
    }
    handleMenuClose();
  };

  // Toggle edit mode
  const handleToggleEditMode = () => {
    if (onToggleEditMode) {
      onToggleEditMode();
    }
    handleMenuClose();
  };

  // Update widget option (in the edit dialog)
  const handleOptionChange = (key: string, value: any) => {
    if (editingWidget) {
      setEditingWidget({
        ...editingWidget,
        options: {
          ...editingWidget.options,
          [key]: value
        }
      });
    }
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !onUpdateLayout) {
      return;
    }

    const items = [...sortedWidgets];
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedWidgets = items.map((item, index) => ({
      ...item,
      position: index
    }));

    onUpdateLayout(updatedWidgets);
  };

  // Render widget based on type
  const renderWidget = (widget: DashboardWidget) => {
    const widgetDef = availableWidgets.find(w => w.type === widget.type);
    if (!widgetDef) return null;

    const WidgetComponent = widgetDef.component;
    const widgetData = data[widget.type] || {};

    return (
      <WidgetComponent
        {...widget.options}
        title={widget.title}
        data={widgetData}
        isLoading={isLoading}
      />
    );
  };

  return (
    <Box sx={{ position: 'relative' }}>
      {/* Dashboard Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3,
        position: 'sticky',
        top: 0,
        zIndex: 10,
        backgroundColor: 'background.default',
        py: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <DashboardIcon sx={{ mr: 1 }} />
          <Typography variant="h5" component="h1">
            {dashboard.name}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {isEditing && (
            <Tooltip title="Display Mode">
              <IconButton size="small" onClick={() => setDisplayMode(prev => prev === 'grid' ? 'list' : 'grid')}>
                {displayMode === 'grid' ? <ViewModuleIcon /> : <ViewDayIcon />}
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title="Dashboard Settings">
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={menuAnchorEl}
            open={Boolean(menuAnchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleToggleEditMode}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              {isEditing ? "Exit Edit Mode" : "Edit Dashboard"}
            </MenuItem>
            
            {isEditing && (
              <MenuItem onClick={handleAddWidgetClick}>
                <AddIcon fontSize="small" sx={{ mr: 1 }} />
                Add Widget
              </MenuItem>
            )}
            
            <MenuItem onClick={handleSaveDialogOpen}>
              <SaveIcon fontSize="small" sx={{ mr: 1 }} />
              Save Dashboard
            </MenuItem>
            
            {onExport && (
              <MenuItem onClick={handleExport}>
                <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                Export Dashboard
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Box>

      {/* Dashboard Content */}
      {isEditing && displayMode === 'list' ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="widgets">
            {(provided) => (
              <Box
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {sortedWidgets.map((widget, index) => (
                  <Draggable key={widget.id} draggableId={widget.id} index={index}>
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        sx={{ mb: 2 }}
                      >
                        <Card>
                          <CardContent sx={{ p: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <Box {...provided.dragHandleProps} sx={{ mr: 1 }}>
                                <DragIndicatorIcon />
                              </Box>
                              <Typography variant="subtitle1" sx={{ flex: 1 }}>
                                {widget.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mr: 2 }}>
                                {widget.size}
                              </Typography>
                              <IconButton 
                                size="small" 
                                onClick={(e) => handleWidgetMenuOpen(e, widget.id)}
                              >
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </CardContent>
                        </Card>
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <Grid container spacing={3}>
          {sortedWidgets.map((widget) => (
            <Grid item key={widget.id} {...WIDGET_SIZE_MAP[widget.size]}>
              <Box sx={{ position: 'relative', height: '100%' }}>
                {isEditing && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: 8, 
                    right: 8, 
                    zIndex: 5,
                    backgroundColor: 'rgba(255,255,255,0.8)',
                    borderRadius: 1
                  }}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => handleWidgetMenuOpen(e, widget.id)}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                )}
                {renderWidget(widget)}
              </Box>
            </Grid>
          ))}
          
          {isEditing && (
            <Grid item xs={12} sm={6} md={4}>
              <Card 
                sx={{ 
                  height: 200, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  border: '2px dashed',
                  borderColor: 'divider',
                  backgroundColor: 'action.hover',
                  cursor: 'pointer'
                }}
                onClick={handleAddWidgetClick}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <AddIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                  <Typography variant="body1" color="text.secondary">
                    Add Widget
                  </Typography>
                </Box>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Widget menu */}
      <Menu
        anchorEl={widgetMenuAnchorEl}
        open={Boolean(widgetMenuAnchorEl)}
        onClose={handleWidgetMenuClose}
      >
        <MenuItem onClick={() => selectedWidget && handleEditWidget(selectedWidget)}>
          <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
          Edit Widget
        </MenuItem>
        <MenuItem onClick={() => selectedWidget && handleRemoveWidget(selectedWidget)}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          Remove Widget
        </MenuItem>
      </Menu>

      {/* Add Widget Dialog */}
      <Dialog open={addWidgetOpen} onClose={() => setAddWidgetOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Widget</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {availableWidgets.map((widget) => (
              <Card 
                key={widget.type} 
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => handleAddWidget(widget.type)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {widget.icon && <Box sx={{ mr: 2 }}>{widget.icon}</Box>}
                    <Box>
                      <Typography variant="subtitle1">{widget.title}</Typography>
                      {widget.description && (
                        <Typography variant="body2" color="text.secondary">
                          {widget.description}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddWidgetOpen(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Widget Dialog */}
      <Dialog open={editWidgetOpen} onClose={() => setEditWidgetOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Widget</DialogTitle>
        <DialogContent dividers>
          {editingWidget && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Widget Title"
                fullWidth
                value={editingWidget.title}
                onChange={(e) => setEditingWidget({...editingWidget, title: e.target.value})}
              />
              
              <FormControl fullWidth>
                <InputLabel>Widget Size</InputLabel>
                <Select
                  value={editingWidget.size}
                  label="Widget Size"
                  onChange={(e) => setEditingWidget({...editingWidget, size: e.target.value as any})}
                >
                  <MenuItem value="small">Small (1/4 width)</MenuItem>
                  <MenuItem value="medium">Medium (1/2 width)</MenuItem>
                  <MenuItem value="large">Large (Full width)</MenuItem>
                </Select>
              </FormControl>
              
              <Divider />
              
              <Typography variant="subtitle1">Widget Options</Typography>
              
              {/* Render options based on widget type */}
              {availableWidgets.find(w => w.type === editingWidget.type)?.defaultOptions && (
                Object.entries(availableWidgets.find(w => w.type === editingWidget.type)?.defaultOptions || {}).map(([key, defaultValue]) => {
                  const value = editingWidget.options[key] !== undefined ? editingWidget.options[key] : defaultValue;
                  
                  // Render different input types based on value type
                  if (typeof value === 'boolean') {
                    return (
                      <FormControl key={key} fullWidth margin="normal">
                        <InputLabel>{key}</InputLabel>
                        <Select
                          value={value ? 'true' : 'false'}
                          label={key}
                          onChange={(e) => handleOptionChange(key, e.target.value === 'true')}
                        >
                          <MenuItem value="true">Yes</MenuItem>
                          <MenuItem value="false">No</MenuItem>
                        </Select>
                      </FormControl>
                    );
                  } else if (typeof value === 'number') {
                    return (
                      <TextField
                        key={key}
                        label={key}
                        type="number"
                        fullWidth
                        margin="normal"
                        value={value}
                        onChange={(e) => handleOptionChange(key, Number(e.target.value))}
                      />
                    );
                  } else if (Array.isArray(value)) {
                    // Assume it's an array of options for a multi-select
                    return (
                      <FormControl key={key} fullWidth margin="normal">
                        <InputLabel>{key}</InputLabel>
                        <Select
                          multiple
                          value={value}
                          label={key}
                          onChange={(e) => handleOptionChange(key, e.target.value)}
                          renderValue={(selected) => (selected as string[]).join(', ')}
                        >
                          {(defaultValue as string[]).map((option) => (
                            <MenuItem key={option} value={option}>
                              <Checkbox checked={(value as string[]).indexOf(option) > -1} />
                              <ListItemText primary={option} />
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    );
                  } else {
                    return (
                      <TextField
                        key={key}
                        label={key}
                        fullWidth
                        margin="normal"
                        value={value}
                        onChange={(e) => handleOptionChange(key, e.target.value)}
                      />
                    );
                  }
                })
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditWidgetOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveWidget} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Save Dashboard Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Save Dashboard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Dashboard Name"
            fullWidth
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDashboard} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomizableDashboard;