import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Box, 
  Typography, 
  useTheme,
  Collapse,
  IconButton
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

interface Column {
  id: string;
  label: string;
  format?: (value: any) => string;
}

interface AccessibleDataTableProps {
  title: string;
  description?: string;
  data: Record<string, any>[]; // Array of data objects
  columns: Column[];
  caption?: string; // Additional description for screen readers
  compact?: boolean;
  hideByDefault?: boolean; // Whether to show the table collapsed by default
}

const AccessibleDataTable: React.FC<AccessibleDataTableProps> = ({
  title,
  description,
  data,
  columns,
  caption,
  compact = false,
  hideByDefault = true,
}) => {
  const theme = useTheme();
  const [open, setOpen] = React.useState(!hideByDefault);

  if (!data || data.length === 0) {
    return (
      <Box mt={2} p={2} border={1} borderColor="divider" borderRadius={1}>
        <Typography variant="subtitle2" component="h3">
          {title} - Data Table
        </Typography>
        <Typography variant="body2">
          No data available.
        </Typography>
      </Box>
    );
  }

  return (
    <Box 
      mt={2} 
      p={2} 
      border={1} 
      borderColor="divider" 
      borderRadius={1}
      role="region" 
      aria-label={`Data table for ${title}`}
    >
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={1}
        sx={{ cursor: 'pointer' }}
        onClick={() => setOpen(!open)}
      >
        <Typography variant="subtitle2" component="h3">
          {title} - Data Table
        </Typography>
        <IconButton 
          aria-label={open ? "Collapse data table" : "Expand data table"} 
          size="small"
        >
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Box>
      
      {description && (
        <Typography variant="body2" color="text.secondary" mb={1}>
          {description}
        </Typography>
      )}
      
      <Collapse in={open}>
        <TableContainer 
          component={Paper} 
          elevation={0} 
          sx={{ 
            maxHeight: compact ? 240 : 400, 
            border: `1px solid ${theme.palette.divider}`
          }}
        >
          <Table 
            aria-label={caption || title}
            size={compact ? "small" : "medium"}
            stickyHeader
          >
            {caption && (
              <caption style={{ captionSide: 'top', padding: '8px' }}>
                {caption}
              </caption>
            )}
            
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell 
                    key={column.id}
                    sx={{ 
                      fontWeight: 'bold',
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? theme.palette.grey[800] 
                        : theme.palette.grey[100]
                    }}
                    scope="col"
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow 
                  key={`row-${rowIndex}`}
                  hover
                  tabIndex={0}
                  sx={{ '&:nth-of-type(odd)': { backgroundColor: theme.palette.action.hover } }}
                >
                  {columns.map((column, colIndex) => {
                    const value = row[column.id];
                    // First column becomes a header for the row
                    if (colIndex === 0) {
                      return (
                        <TableCell 
                          key={`cell-${rowIndex}-${column.id}`}
                          scope="row"
                          sx={{ fontWeight: 'medium' }}
                        >
                          {column.format ? column.format(value) : value}
                        </TableCell>
                      );
                    }
                    return (
                      <TableCell key={`cell-${rowIndex}-${column.id}`}>
                        {column.format ? column.format(value) : value}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Collapse>
    </Box>
  );
};

export default AccessibleDataTable;