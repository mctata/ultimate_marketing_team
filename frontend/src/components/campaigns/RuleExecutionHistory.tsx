import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
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
  TablePagination,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

import { AppDispatch } from '../../store';
import {
  fetchRuleExecutionHistory,
  fetchCampaignRuleExecutionHistory,
  selectRuleExecutionHistory,
  selectRuleExecutionHistoryLoading
} from '../../store/slices/campaignRulesSlice';
import { RuleExecutionHistory as RuleExecutionHistoryType } from '../../services/campaignRulesService';

interface RuleExecutionHistoryProps {
  campaignId: string;
  ruleId?: string;
}

const RuleExecutionHistory = ({ campaignId, ruleId }: RuleExecutionHistoryProps) => {
  const dispatch = useDispatch<AppDispatch>();
  const executionHistory = useSelector(selectRuleExecutionHistory);
  const loading = useSelector(selectRuleExecutionHistoryLoading);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedExecution, setSelectedExecution] = useState<RuleExecutionHistoryType | null>(null);
  const [metricsDialogOpen, setMetricsDialogOpen] = useState(false);
  
  useEffect(() => {
    fetchHistory();
  }, []);
  
  const fetchHistory = () => {
    if (ruleId) {
      dispatch(fetchRuleExecutionHistory(ruleId));
    } else {
      dispatch(fetchCampaignRuleExecutionHistory(campaignId));
    }
  };
  
  const handleRefresh = () => {
    fetchHistory();
  };
  
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleViewMetrics = (execution: RuleExecutionHistoryType) => {
    setSelectedExecution(execution);
    setMetricsDialogOpen(true);
  };
  
  const handleCloseMetricsDialog = () => {
    setMetricsDialogOpen(false);
  };
  
  // Get status color for execution result
  const getStatusColor = (status: string) => {
    return status === 'success' ? 'success' : 'error';
  };
  
  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">
          Rule Execution History
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={handleRefresh} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : executionHistory.length === 0 ? (
        <Alert severity="info">
          No rule execution history found.
        </Alert>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date & Time</TableCell>
                  {!ruleId && <TableCell>Rule</TableCell>}
                  <TableCell>Trigger Condition</TableCell>
                  <TableCell>Action Taken</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {executionHistory
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((execution) => (
                    <TableRow key={execution.id} hover>
                      <TableCell>
                        {format(parseISO(execution.executed_at), 'MMM dd, yyyy HH:mm:ss')}
                      </TableCell>
                      {!ruleId && (
                        <TableCell>
                          {execution.rule_id}
                        </TableCell>
                      )}
                      <TableCell>{execution.trigger_condition}</TableCell>
                      <TableCell>{execution.action_taken}</TableCell>
                      <TableCell>
                        <Chip 
                          label={execution.status} 
                          color={getStatusColor(execution.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="View Metrics">
                          <IconButton
                            size="small"
                            onClick={() => handleViewMetrics(execution)}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={executionHistory.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      )}
      
      {/* Metrics Dialog */}
      <Dialog open={metricsDialogOpen} onClose={handleCloseMetricsDialog} maxWidth="md">
        <DialogTitle>Metrics Snapshot</DialogTitle>
        <DialogContent>
          {selectedExecution && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Execution Time: {format(parseISO(selectedExecution.executed_at), 'MMM dd, yyyy HH:mm:ss')}
              </Typography>
              <Typography variant="subtitle2" gutterBottom>
                Trigger Condition: {selectedExecution.trigger_condition}
              </Typography>
              <Typography variant="subtitle2" gutterBottom sx={{ mb: 2 }}>
                Action Taken: {selectedExecution.action_taken}
              </Typography>
              
              <Typography variant="subtitle1" gutterBottom>
                Metrics at Execution Time:
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Metric</TableCell>
                      <TableCell>Value</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {Object.entries(selectedExecution.metrics_snapshot).map(([key, value]) => (
                      <TableRow key={key}>
                        <TableCell>{key}</TableCell>
                        <TableCell>{value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMetricsDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default RuleExecutionHistory;