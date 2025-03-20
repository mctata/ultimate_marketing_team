import { useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
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
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
  Visibility as VisibilityIcon,
  LinkOff as LinkOffIcon,
} from '@mui/icons-material';
import { Ad } from '../../services/campaignService';
import { AppDispatch } from '../../store';
import { deleteAd, updateAd } from '../../store/slices/campaignSlice';
import AdPreview from './AdPreview';

interface AdListProps {
  ads: Ad[];
  campaignId: string;
  adSetId: string;
  onEditAd: (adId: string) => void;
}

const AdList = ({ ads, campaignId, adSetId, onEditAd }: AdListProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleDelete = (adId: string) => {
    if (window.confirm('Are you sure you want to delete this ad?')) {
      dispatch(deleteAd({ campaignId, adSetId, adId }));
    }
  };
  
  const handleToggleStatus = (ad: Ad) => {
    const newStatus = ad.status === 'active' ? 'paused' : 'active';
    dispatch(updateAd({
      campaignId,
      adSetId,
      adId: ad.id,
      ad: { status: newStatus }
    }));
  };
  
  const handlePreview = (ad: Ad) => {
    setPreviewAd(ad);
  };
  
  const handleClosePreview = () => {
    setPreviewAd(null);
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };
  
  const getPerformanceMetric = (ad: Ad, metric: string) => {
    if (!ad.performance) return 'N/A';
    
    const value = ad.performance[metric];
    if (value === undefined) return 'N/A';
    
    if (metric === 'ctr' || metric === 'conversion_rate') {
      return `${(value * 100).toFixed(2)}%`;
    } else if (metric === 'cpc' || metric === 'cpa') {
      return `$${value.toFixed(2)}`;
    }
    
    return value.toLocaleString();
  };
  
  return (
    <>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Ad Details</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="center">Impressions</TableCell>
              <TableCell align="center">CTR</TableCell>
              <TableCell align="center">Conversions</TableCell>
              <TableCell align="center">CPC</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <Typography variant="body1" color="textSecondary">
                    No ads found for this ad set.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              ads
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((ad) => (
                  <TableRow key={ad.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {ad.image_url && (
                          <Box
                            component="img"
                            sx={{
                              width: 60,
                              height: 60,
                              objectFit: 'cover',
                              borderRadius: 1,
                              mr: 2,
                            }}
                            src={ad.image_url}
                            alt={ad.name}
                          />
                        )}
                        <Box>
                          <Typography variant="body1" fontWeight="medium">
                            {ad.name}
                          </Typography>
                          <Typography variant="body2" color="textSecondary" noWrap sx={{ maxWidth: 250 }}>
                            {ad.headline}
                          </Typography>
                          <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                            {ad.call_to_action}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={ad.status.charAt(0).toUpperCase() + ad.status.slice(1)}
                        color={getStatusColor(ad.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {getPerformanceMetric(ad, 'impressions')}
                    </TableCell>
                    <TableCell align="center">
                      {getPerformanceMetric(ad, 'ctr')}
                    </TableCell>
                    <TableCell align="center">
                      {getPerformanceMetric(ad, 'conversions')}
                    </TableCell>
                    <TableCell align="center">
                      {getPerformanceMetric(ad, 'cpc')}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Preview Ad">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => handlePreview(ad)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={ad.status === 'active' ? 'Pause Ad' : 'Activate Ad'}>
                        <IconButton 
                          size="small" 
                          color={ad.status === 'active' ? 'warning' : 'success'}
                          onClick={() => handleToggleStatus(ad)}
                          disabled={ad.status === 'rejected'}
                        >
                          {ad.status === 'active' ? 
                            <PauseIcon fontSize="small" /> : 
                            <PlayArrowIcon fontSize="small" />
                          }
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit Ad">
                        <IconButton 
                          size="small" 
                          color="primary"
                          onClick={() => onEditAd(ad.id)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Ad">
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => handleDelete(ad.id)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={ads.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
      
      {/* Ad Preview Dialog */}
      <Dialog 
        open={Boolean(previewAd)} 
        onClose={handleClosePreview}
        maxWidth="md"
        fullWidth
      >
        {previewAd && (
          <>
            <DialogTitle>
              Ad Preview: {previewAd.name}
              <Chip 
                label={previewAd.status.charAt(0).toUpperCase() + previewAd.status.slice(1)} 
                color={getStatusColor(previewAd.status) as any}
                size="small"
                sx={{ ml: 1 }}
              />
            </DialogTitle>
            <DialogContent>
              <AdPreview ad={previewAd} />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClosePreview}>Close</Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => {
                  onEditAd(previewAd.id);
                  handleClosePreview();
                }}
              >
                Edit Ad
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default AdList;