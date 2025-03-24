import React, { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  useTheme,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Tooltip,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  format,
  parseISO,
  isToday,
  isPast,
  isFuture,
} from 'date-fns';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FilterListIcon from '@mui/icons-material/FilterList';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CancelIcon from '@mui/icons-material/Cancel';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

// Define content item interface
interface CalendarItem {
  id: number;
  title: string;
  scheduled_date: string;
  status: string;
  content_type?: string;
  platform?: string;
  published_date?: string;
  project_id: number;
}

// Define props for the Calendar List View component
interface CalendarListViewProps {
  items: CalendarItem[];
  onItemClick: (item: CalendarItem) => void;
  onEditItem: (item: CalendarItem) => void;
  onDeleteItem: (itemId: number) => void;
  onPublishItem: (itemId: number) => void;
  onDuplicateItem?: (item: CalendarItem) => void;
  loading?: boolean;
  filters?: {
    status: string[];
    contentType: string[];
    platform: string[];
  };
  onFilterChange?: (type: string, values: string[]) => void;
  onDateRangeChange?: (startDate: Date, endDate: Date) => void;
}

const CalendarListView: React.FC<CalendarListViewProps> = ({
  items,
  onItemClick,
  onEditItem,
  onDeleteItem,
  onPublishItem,
  onDuplicateItem,
  loading = false,
  filters,
  onFilterChange,
  onDateRangeChange
}) => {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState<string>('scheduled_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  // Notify parent component of date range when component mounts
  // For list view, we'll use a 30-day range by default
  useEffect(() => {
    if (onDateRangeChange) {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() - 15); // 15 days in the past
      
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 15); // 15 days in the future
      
      onDateRangeChange(startDate, endDate);
    }
  }, [onDateRangeChange]);
  
  // Content type colors
  const contentTypeColors: Record<string, string> = {
    'blog': theme.palette.primary.main,
    'social': theme.palette.secondary.main,
    'email': theme.palette.success.main,
    'video': theme.palette.error.main,
    'ad': theme.palette.warning.main,
    'infographic': theme.palette.info.main,
    'default': theme.palette.grey[500]
  };
  
  // Platform colors
  const platformColors: Record<string, string> = {
    'instagram': '#E1306C',
    'facebook': '#4267B2',
    'twitter': '#1DA1F2',
    'linkedin': '#0077B5',
    'youtube': '#FF0000',
    'tiktok': '#000000',
    'email': theme.palette.success.main,
    'website': theme.palette.primary.main,
    'default': theme.palette.grey[500]
  };
  
  // Status colors and icons
  const statusConfig: Record<string, { color: string, icon: React.ReactNode }> = {
    'draft': { 
      color: theme.palette.grey[500], 
      icon: <MoreHorizIcon fontSize="small" />
    },
    'scheduled': { 
      color: theme.palette.warning.main,
      icon: <HourglassEmptyIcon fontSize="small" />
    },
    'published': { 
      color: theme.palette.success.main,
      icon: <CheckCircleIcon fontSize="small" />
    },
    'failed': { 
      color: theme.palette.error.main,
      icon: <CancelIcon fontSize="small" />
    }
  };
  
  // Filter and sort items
  const filteredItems = useMemo(() => {
    if (!items) return [];
    
    let filtered = [...items];
    
    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.title.toLowerCase().includes(search) ||
        (item.content_type && item.content_type.toLowerCase().includes(search)) ||
        (item.platform && item.platform.toLowerCase().includes(search))
      );
    }
    
    // Apply additional filters if provided
    if (filters) {
      if (filters.status && filters.status.length > 0) {
        filtered = filtered.filter(item => filters.status.includes(item.status));
      }
      if (filters.contentType && filters.contentType.length > 0) {
        filtered = filtered.filter(item => 
          item.content_type && filters.contentType.includes(item.content_type)
        );
      }
      if (filters.platform && filters.platform.length > 0) {
        filtered = filtered.filter(item => 
          item.platform && filters.platform.includes(item.platform)
        );
      }
    }
    
    // Sort items
    filtered.sort((a, b) => {
      if (sortBy === 'scheduled_date') {
        const dateA = new Date(a.scheduled_date).getTime();
        const dateB = new Date(b.scheduled_date).getTime();
        return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
      } else if (sortBy === 'title') {
        return sortDirection === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      } else if (sortBy === 'status') {
        return sortDirection === 'asc'
          ? a.status.localeCompare(b.status)
          : b.status.localeCompare(a.status);
      } else if (sortBy === 'content_type') {
        const typeA = a.content_type || '';
        const typeB = b.content_type || '';
        return sortDirection === 'asc'
          ? typeA.localeCompare(typeB)
          : typeB.localeCompare(typeA);
      } else if (sortBy === 'platform') {
        const platformA = a.platform || '';
        const platformB = b.platform || '';
        return sortDirection === 'asc'
          ? platformA.localeCompare(platformB)
          : platformB.localeCompare(platformA);
      }
      return 0;
    });
    
    return filtered;
  }, [items, searchTerm, filters, sortBy, sortDirection]);
  
  // Pagination handler
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Sort handler
  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };
  
  // Handle delete confirmation
  const handleDeleteClick = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = () => {
    if (itemToDelete !== null) {
      onDeleteItem(itemToDelete);
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      {/* Filters and search */}
      <Box sx={{ 
        mb: 2, 
        display: 'flex', 
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 2
      }}>
        <TextField
          placeholder="Search content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          variant="outlined"
          size="small"
          sx={{ flexGrow: 1, maxWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Filters - optional based on if filters are provided */}
        {filters && onFilterChange && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
            <FilterListIcon color="action" />
            
            {/* Status filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                multiple
                value={filters.status}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const values = e.target.value as string[];
                  onFilterChange('status', values);
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                label="Status"
                size="small"
              >
                {['draft', 'scheduled', 'published', 'failed'].map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Content Type filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="content-type-filter-label">Content Type</InputLabel>
              <Select
                labelId="content-type-filter-label"
                multiple
                value={filters.contentType}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const values = e.target.value as string[];
                  onFilterChange('contentType', values);
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                label="Content Type"
                size="small"
              >
                {Object.keys(contentTypeColors).filter(k => k !== 'default').map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            {/* Platform filter */}
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel id="platform-filter-label">Platform</InputLabel>
              <Select
                labelId="platform-filter-label"
                multiple
                value={filters.platform}
                onChange={(e: SelectChangeEvent<string[]>) => {
                  const values = e.target.value as string[];
                  onFilterChange('platform', values);
                }}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(selected as string[]).map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
                label="Platform"
                size="small"
              >
                {Object.keys(platformColors).filter(k => k !== 'default').map((platform) => (
                  <MenuItem key={platform} value={platform}>
                    {platform}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        )}
      </Box>

      {/* Content table */}
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} size="small">
          <TableHead>
            <TableRow>
              <TableCell 
                onClick={() => handleSort('title')}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                Title
                {sortBy === 'title' && (
                  <span> {sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSort('scheduled_date')}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                Scheduled Date
                {sortBy === 'scheduled_date' && (
                  <span> {sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSort('status')}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                Status
                {sortBy === 'status' && (
                  <span> {sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSort('content_type')}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                Content Type
                {sortBy === 'content_type' && (
                  <span> {sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableCell>
              <TableCell 
                onClick={() => handleSort('platform')}
                sx={{ 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  '&:hover': { backgroundColor: theme.palette.action.hover }
                }}
              >
                Platform
                {sortBy === 'platform' && (
                  <span> {sortDirection === 'asc' ? '↑' : '↓'}</span>
                )}
              </TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredItems
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((item) => {
                const itemDate = parseISO(item.scheduled_date);
                const isPastDate = isPast(itemDate) && !isToday(itemDate);
                const isTodayDate = isToday(itemDate);
                const statusConfig = {
                  draft: { color: theme.palette.grey[500], opacity: 1 },
                  scheduled: { color: theme.palette.warning.main, opacity: 1 },
                  published: { color: theme.palette.success.main, opacity: 1 },
                  failed: { color: theme.palette.error.main, opacity: 1 },
                };
                
                return (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => onItemClick(item)}
                    sx={{ 
                      cursor: 'pointer',
                      opacity: isPastDate && item.status !== 'published' ? 0.7 : 1,
                      backgroundColor: isTodayDate ? `${theme.palette.primary.light}10` : 'inherit',
                      '&:hover td:first-of-type': {
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    <TableCell component="th" scope="row">
                      <Typography variant="body2">{item.title}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(itemDate, 'MMM d, yyyy')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(itemDate, 'h:mm a')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {statusConfig[item.status]?.icon}
                        <Chip
                          label={item.status}
                          size="small"
                          sx={{
                            backgroundColor: `${statusConfig[item.status]?.color}20`,
                            color: statusConfig[item.status]?.color,
                            fontWeight: 'medium'
                          }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      {item.content_type && (
                        <Chip
                          label={item.content_type}
                          size="small"
                          sx={{
                            backgroundColor: `${contentTypeColors[item.content_type] || contentTypeColors.default}20`,
                            color: contentTypeColors[item.content_type] || contentTypeColors.default,
                            fontWeight: 'medium'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      {item.platform && (
                        <Chip
                          label={item.platform}
                          size="small"
                          sx={{
                            backgroundColor: `${platformColors[item.platform] || platformColors.default}20`,
                            color: platformColors[item.platform] || platformColors.default,
                            fontWeight: 'medium'
                          }}
                        />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton 
                            size="small" 
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditItem(item);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        
                        {item.status !== 'published' && (
                          <Tooltip title="Publish">
                            <IconButton 
                              size="small"
                              color="success"
                              onClick={(e) => {
                                e.stopPropagation();
                                onPublishItem(item.id);
                              }}
                            >
                              <CheckCircleIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        {onDuplicateItem && (
                          <Tooltip title="Duplicate">
                            <IconButton 
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDuplicateItem(item);
                              }}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        
                        <Tooltip title="Delete">
                          <IconButton 
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(item.id);
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            {filteredItems.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="text.secondary">
                    No content found {searchTerm ? `matching "${searchTerm}"` : ''}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Pagination */}
      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={filteredItems.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Delete Content</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this content from the calendar? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CalendarListView;