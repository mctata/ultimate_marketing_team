import React, { useState, useEffect, forwardRef } from 'react';
import { 
  Snackbar, 
  Alert, 
  AlertProps, 
  Typography, 
  Box,
  Slide,
  SlideProps,
  IconButton
} from '@mui/material';
import { 
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Transition component for snackbar
const SlideTransition = forwardRef<HTMLDivElement, SlideProps>((props, ref) => {
  return <Slide {...props} direction="up" ref={ref} />;
});

// Define Toast types and props
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  open: boolean;
  type: ToastType;
  message: string;
  detail?: string;
  autoHideDuration?: number;
  onClose: () => void;
  anchorOrigin?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
}

// Get the appropriate icon based on toast type
const getIcon = (type: ToastType) => {
  switch (type) {
    case 'success':
      return <SuccessIcon fontSize="small" />;
    case 'warning':
      return <WarningIcon fontSize="small" />;
    case 'error':
      return <ErrorIcon fontSize="small" />;
    case 'info':
      return <InfoIcon fontSize="small" />;
    default:
      return <InfoIcon fontSize="small" />;
  }
};

/**
 * Toast Notification Component
 * 
 * A component for displaying toast notifications with different severity levels
 * and additional details when needed.
 */
const ToastNotification: React.FC<ToastProps> = ({
  open,
  type = 'info',
  message,
  detail,
  autoHideDuration = 5000,
  onClose,
  anchorOrigin = { vertical: 'bottom', horizontal: 'left' }
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    onClose();
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={anchorOrigin}
      TransitionComponent={SlideTransition}
    >
      <Alert
        severity={type}
        variant="filled"
        onClose={handleClose}
        icon={getIcon(type)}
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ width: '100%', alignItems: 'center' }}
      >
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {message}
          </Typography>
          {detail && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.9 }}>
              {detail}
            </Typography>
          )}
        </Box>
      </Alert>
    </Snackbar>
  );
};

// Toast context for global toast management
export const useToast = () => {
  const [toastState, setToastState] = useState<{
    open: boolean;
    type: ToastType;
    message: string;
    detail?: string;
  }>({
    open: false,
    type: 'info',
    message: '',
    detail: undefined
  });

  const showToast = (type: ToastType, message: string, detail?: string) => {
    setToastState({ open: true, type, message, detail });
  };

  const hideToast = () => {
    setToastState(prev => ({ ...prev, open: false }));
  };

  const ToastComponent = () => (
    <ToastNotification
      open={toastState.open}
      type={toastState.type}
      message={toastState.message}
      detail={toastState.detail}
      onClose={hideToast}
    />
  );

  return {
    showSuccess: (message: string, detail?: string) => showToast('success', message, detail),
    showError: (message: string, detail?: string) => showToast('error', message, detail),
    showWarning: (message: string, detail?: string) => showToast('warning', message, detail),
    showInfo: (message: string, detail?: string) => showToast('info', message, detail),
    ToastComponent,
    hideToast
  };
};

export default ToastNotification;