import React, { useEffect } from 'react';
import { Snackbar, Alert, AlertProps, Button, Box } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { clearToast, Toast } from '../../store/slices/uiSlice';
import { Typography } from '@mui/material';

/**
 * Toast container component
 * Displays toasts/notifications from the UI state
 * Handles multiple toasts with a queue system
 */
const ToastContainer: React.FC = () => {
  const dispatch = useDispatch();
  const { toasts } = useSelector((state: RootState) => state.ui);
  const [currentToast, setCurrentToast] = React.useState<Toast | null>(null);
  const [open, setOpen] = React.useState(false);
  
  // Process toast queue
  useEffect(() => {
    if (toasts.length > 0 && !currentToast) {
      // Take the first toast from the queue
      setCurrentToast(toasts[0]);
      setOpen(true);
      // Remove it from redux
      dispatch(clearToast(toasts[0].id));
    }
  }, [toasts, currentToast, dispatch]);
  
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    
    setOpen(false);
    setTimeout(() => {
      setCurrentToast(null);
    }, 300); // Wait for exit animation
  };
  
  // Handle action button if present
  const handleAction = () => {
    if (currentToast?.action?.callback) {
      currentToast.action.callback();
    }
    handleClose();
  };
  
  if (!currentToast) {
    return null;
  }
  
  // Map toast types to MUI Alert severity
  const severityMap: Record<Toast['type'], AlertProps['severity']> = {
    success: 'success',
    error: 'error',
    warning: 'warning',
    info: 'info',
  };
  
  return (
    <Snackbar
      open={open}
      autoHideDuration={currentToast.duration || 5000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      key={currentToast.id}
    >
      <Alert
        elevation={6}
        variant="filled"
        onClose={handleClose}
        severity={severityMap[currentToast.type]}
        sx={{ width: '100%', minWidth: 300 }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {currentToast.title && (
            <Typography variant="subtitle2" fontWeight="bold">
              {currentToast.title}
            </Typography>
          )}
          {currentToast.message}
          
          {currentToast.action && (
            <Button
              color="inherit"
              size="small"
              onClick={handleAction}
              sx={{ alignSelf: 'flex-end', mt: 1 }}
            >
              {currentToast.action.label}
            </Button>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default ToastContainer;