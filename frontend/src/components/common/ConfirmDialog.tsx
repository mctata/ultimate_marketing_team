import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogContentText, 
  DialogActions, 
  Button 
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store';
import { closeConfirmDialog } from '../../store/slices/uiSlice';

/**
 * Global confirmation dialog component
 * Used for confirming destructive actions or important decisions
 * State is managed through the UI slice in Redux
 */
const ConfirmDialog: React.FC = () => {
  const dispatch = useDispatch();
  const { 
    open, 
    title, 
    message, 
    confirmLabel, 
    cancelLabel, 
    confirmAction,
    onCancel
  } = useSelector((state: RootState) => state.ui.confirmDialog);

  const handleClose = () => {
    if (onCancel) {
      onCancel();
    }
    dispatch(closeConfirmDialog());
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    dispatch(closeConfirmDialog());
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">
        {title}
      </DialogTitle>
      
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          {cancelLabel}
        </Button>
        <Button 
          onClick={handleConfirm} 
          color="primary" 
          variant="contained" 
          autoFocus
        >
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmDialog;

/**
 * Example usage in components:
 * 
 * import { useDispatch } from 'react-redux';
 * import { openConfirmDialog } from '../../store/slices/uiSlice';
 * 
 * // In your component:
 * const dispatch = useDispatch();
 * 
 * const handleDelete = () => {
 *   dispatch(openConfirmDialog({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item? This action cannot be undone.',
 *     confirmLabel: 'Delete',
 *     cancelLabel: 'Cancel',
 *     confirmAction: () => {
 *       // Code to execute when confirmed
 *       deleteItem(id);
 *     },
 *   }));
 * };
 */