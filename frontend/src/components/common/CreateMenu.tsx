import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Add as AddIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Description as ContentIcon,
  Campaign as CampaignIcon,
  Business as BusinessIcon,
  Assignment as ProjectIcon,
  FormatListBulleted as TemplateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface CreateMenuProps {
  variant?: 'default' | 'compact';
  color?: 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';
}

const CreateMenu: React.FC<CreateMenuProps> = ({ 
  variant = 'default',
  color = 'primary'
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCreateContent = () => {
    navigate('/content/generator');
    handleClose();
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
    handleClose();
  };

  const handleCreateCampaign = () => {
    navigate('/campaigns/new');
    handleClose();
  };

  const handleCreateBrand = () => {
    navigate('/brands/new');
    handleClose();
  };

  const handleCreateTemplate = () => {
    navigate('/content/templates/new');
    handleClose();
  };

  return (
    <>
      <Button
        variant={variant === 'compact' ? 'outlined' : 'contained'}
        color={color}
        startIcon={<AddIcon />}
        endIcon={<ArrowDownIcon />}
        onClick={handleOpen}
        size={variant === 'compact' ? 'small' : 'medium'}
      >
        Create
      </Button>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleCreateContent}>
          <ListItemIcon>
            <ContentIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Content</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCreateProject}>
          <ListItemIcon>
            <ProjectIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Project</ListItemText>
        </MenuItem>
        <MenuItem onClick={handleCreateCampaign}>
          <ListItemIcon>
            <CampaignIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Campaign</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCreateTemplate}>
          <ListItemIcon>
            <TemplateIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Template</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleCreateBrand}>
          <ListItemIcon>
            <BusinessIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>New Brand</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
};

export default CreateMenu;