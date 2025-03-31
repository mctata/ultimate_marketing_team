import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  MenuItem,
  InputAdornment,
  Grid,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { fetchDrafts, deleteDraft, setFilters, selectDrafts, selectDraftsLoading, selectDraftsError, selectContentFilters } from '../../store/slices/contentSlice';
import { AppDispatch } from '../../store';
import { formatDistance } from 'date-fns';

const statusColors: Record<string, string> = {
  draft: 'default',
  review: 'info',
  approved: 'warning',
  published: 'success'
};

const ContentList = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const drafts = useSelector(selectDrafts);
  const loading = useSelector(selectDraftsLoading);
  const error = useSelector(selectDraftsError);
  const filters = useSelector(selectContentFilters);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [openFilter, setOpenFilter] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  
  useEffect(() => {
    dispatch(fetchDrafts(filters));
  }, [dispatch, filters]);
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };
  
  const handleStatusFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setStatusFilter(event.target.value);
    dispatch(setFilters({ draftStatus: event.target.value || undefined }));
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      dispatch(deleteDraft(id));
    }
  };
  
  const handleEdit = (id: string) => {
    navigate(`/content/${id}`);
  };
  
  const handleCreateNew = () => {
    navigate('/content/new');
  };
  
  const handleViewABTests = (id: string) => {
    navigate(`/content/${id}/abtests`);
  };
  
  const handleViewPerformance = (id: string) => {
    navigate(`/content/${id}/performance`);
  };
  
  const filteredDrafts = drafts.filter(draft => 
    draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">Content Management</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
        >
          Create New Content
        </Button>
      </Box>
      
      <Paper sx={{ mb: 3, p: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search by title or tags..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <TextField
                select
                label="Status"
                value={statusFilter}
                onChange={handleStatusFilterChange}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="review">In Review</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="published">Published</MenuItem>
              </TextField>
              <IconButton 
                color={openFilter ? 'primary' : 'default'}
                onClick={() => setOpenFilter(!openFilter)}
              >
                <FilterIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell>Topics</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredDrafts
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((draft) => (
                    <TableRow key={draft.id} hover>
                      <TableCell 
                        component="th" 
                        scope="row"
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleEdit(draft.id)}
                      >
                        {draft.title}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={draft.status.charAt(0).toUpperCase() + draft.status.slice(1)} 
                          color={statusColors[draft.status] as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {formatDistance(new Date(draft.updated_at), new Date(), { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        {draft.topics.map((topic, index) => (
                          <Chip 
                            key={index} 
                            label={topic} 
                            size="small" 
                            sx={{ mr: 0.5, mb: 0.5 }}
                          />
                        ))}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handleEdit(draft.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(draft.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          sx={{ ml: 1 }}
                          onClick={() => handleViewABTests(draft.id)}
                        >
                          A/B Tests
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="info" 
                          sx={{ ml: 1 }}
                          onClick={() => handleViewPerformance(draft.id)}
                        >
                          Performance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                {filteredDrafts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body1" color="textSecondary">
                        No content found. {searchTerm && 'Try a different search term.'}
                      </Typography>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        sx={{ mt: 2 }}
                        startIcon={<AddIcon />}
                        onClick={handleCreateNew}
                      >
                        Create New Content
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredDrafts.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
    </Box>
  );
};

export default ContentList;