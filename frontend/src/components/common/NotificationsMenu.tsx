import {
  Box,
  Divider,
  List,
  ListItem,
  ListItemText,
  Menu,
  Typography,
  IconButton,
  Button,
} from '@mui/material';
import { MoreVert as MoreVertIcon, Check as CheckIcon } from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { markNotificationAsRead, clearNotifications } from '../../store/slices/uiSlice';
import { format } from 'date-fns';

interface NotificationsMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
}

const NotificationsMenu = ({ anchorEl, open, onClose }: NotificationsMenuProps) => {
  const dispatch = useDispatch();
  const { notifications } = useSelector((state: RootState) => state.ui);
  
  const handleMarkAsRead = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };
  
  const handleClearAll = () => {
    dispatch(clearNotifications());
    onClose();
  };
  
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      PaperProps={{
        sx: {
          maxHeight: 400,
          width: 350,
        },
      }}
    >
      <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6">Notifications</Typography>
        <Button size="small" onClick={handleClearAll}>
          Clear All
        </Button>
      </Box>
      
      <Divider />
      
      {notifications.length === 0 ? (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No notifications
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {notifications.map((notification) => (
            <Box key={notification.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  bgcolor: notification.read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
                secondaryAction={
                  !notification.read && (
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={() => handleMarkAsRead(notification.id)}
                      title="Mark as read"
                    >
                      <CheckIcon fontSize="small" />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.read ? 400 : 600,
                          color: notification.read ? 'text.primary' : 'primary.main',
                        }}
                      >
                        {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                      </Typography>
                    </Box>
                  }
                  secondary={notification.message}
                />
              </ListItem>
              <Divider component="li" />
            </Box>
          ))}
        </List>
      )}
    </Menu>
  );
};

export default NotificationsMenu;