import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Box, 
  FormHelperText, 
  Paper, 
  IconButton, 
  Tooltip, 
  Menu, 
  MenuItem, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Tab,
  Tabs,
  Divider,
  Chip,
  Badge,
  Avatar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Code,
  InsertLink,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  ImageOutlined,
  Title,
  FormatColorText,
  CheckCircle,
  HistoryEdu,
  History,
  Undo,
  Redo,
  LightbulbOutlined,
  Search,
  SpellcheckOutlined,
  Subscript,
  Superscript,
  FormatStrikethrough,
  TableChart,
  Comment,
  MoreVert,
  FileCopy,
  ContentCopy,
  Close,
  Save,
  Person,
  Edit,
  ExpandMore,
  ExpandLess,
  FormatClear
} from '@mui/icons-material';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  brandName?: string;
}

// Mock users for collaboration demo
const MOCK_USERS = [
  { id: 'user1', name: 'John Doe', color: '#e91e63', avatar: 'JD', active: true },
  { id: 'user2', name: 'Sarah Smith', color: '#2196f3', avatar: 'SS', active: true },
  { id: 'user3', name: 'Alex Wong', color: '#4caf50', avatar: 'AW', active: false }
];

// Mock SEO suggestions
const MOCK_SEO_SUGGESTIONS = [
  { id: 'seo1', text: 'Add a meta description with target keywords', severity: 'high' },
  { id: 'seo2', text: 'Increase keyword density for "marketing automation"', severity: 'medium' },
  { id: 'seo3', text: 'Add more headings to improve content structure', severity: 'medium' },
  { id: 'seo4', text: 'Consider adding more images with alt text', severity: 'low' }
];

// Mock AI writing suggestions
const MOCK_AI_SUGGESTIONS = [
  { id: 'ai1', text: 'Try using more conversational language here' },
  { id: 'ai2', text: 'This paragraph could be more concise' },
  { id: 'ai3', text: 'Consider addressing the reader directly with "you"' },
  { id: 'ai4', text: 'Add more statistics to support this claim' }
];

// Mock version history
const MOCK_VERSIONS = [
  { id: 'v1', createdAt: '2023-03-21T14:30:00Z', author: 'John Doe', description: 'Initial draft' },
  { id: 'v2', createdAt: '2023-03-21T16:45:00Z', author: 'Sarah Smith', description: 'Added introduction' },
  { id: 'v3', createdAt: '2023-03-22T09:15:00Z', author: 'John Doe', description: 'Major revision' },
  { id: 'v4', createdAt: '2023-03-22T11:30:00Z', author: 'Current', description: 'Current version' }
];

// Mock comments
const MOCK_COMMENTS = [
  { id: 'c1', author: 'Sarah Smith', avatar: 'SS', text: 'Can we add more context here?', position: 120, timestamp: '10:30 AM' },
  { id: 'c2', author: 'John Doe', avatar: 'JD', text: 'I think we should reword this sentence.', position: 350, timestamp: '11:45 AM' }
];

const RichTextEditor = ({ value, onChange, error, helperText, brandName = 'Brand' }: RichTextEditorProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Editor state
  const [htmlContent, setHtmlContent] = useState('');
  const [selection, setSelection] = useState<{ start: number, end: number }>({ start: 0, end: 0 });
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeUsers, setActiveUsers] = useState(MOCK_USERS);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [commentAnchorEl, setCommentAnchorEl] = useState<null | HTMLElement>(null);
  const [activeComment, setActiveComment] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  
  // Format buttons state
  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    h1: false,
    h2: false,
    h3: false,
    bulletList: false,
    numberList: false,
    quote: false,
    code: false,
    alignLeft: true,
    alignCenter: false,
    alignRight: false
  });

  // Convert plain text to HTML on initial load
  useEffect(() => {
    if (!htmlContent && value) {
      // Simple conversion of plain text to HTML with paragraphs
      const htmlValue = value
        .split('\n\n')
        .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
        .join('');
      
      setHtmlContent(htmlValue);
      
      // Initialize history
      setHistory([htmlValue]);
      setHistoryIndex(0);
    }
  }, [value, htmlContent]);

  // Handle updating content and syncing with parent
  const updateContent = useCallback((newContent: string) => {
    setHtmlContent(newContent);
    
    // Extract plain text for parent component
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || '';
    onChange(plainText);
    
    // Add to history
    setHistory(prev => {
      const newHistory = [...prev.slice(0, historyIndex + 1), newContent];
      return newHistory.slice(-50); // Keep last 50 changes
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [onChange, historyIndex]);

  // Format handlers
  const applyFormat = (format: string) => {
    if (!editorRef.current) return;
    
    document.execCommand(format);
    
    // Update content
    updateContent(editorRef.current.innerHTML);
    
    // Update format states based on current selection
    updateFormatState();
  };

  const updateFormatState = () => {
    setFormats({
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
      strikethrough: document.queryCommandState('strikethrough'),
      h1: false, // Would need to check parent element
      h2: false,
      h3: false,
      bulletList: document.queryCommandState('insertUnorderedList'),
      numberList: document.queryCommandState('insertOrderedList'),
      quote: false, // Need to check parent element
      code: false, // Need to check parent element
      alignLeft: document.queryCommandState('justifyLeft'),
      alignCenter: document.queryCommandState('justifyCenter'),
      alignRight: document.queryCommandState('justifyRight')
    });
  };

  // Handle key events for keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Ctrl/Cmd + B for bold
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      applyFormat('bold');
    }
    // Ctrl/Cmd + I for italic
    else if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      applyFormat('italic');
    }
    // Ctrl/Cmd + U for underline
    else if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
      e.preventDefault();
      applyFormat('underline');
    }
    // Ctrl/Cmd + Z for undo
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      handleUndo();
    }
    // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z for redo
    else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
      e.preventDefault();
      handleRedo();
    }
  };

  // History handlers
  const handleUndo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setHtmlContent(history[newIndex]);
      
      // Extract plain text for parent component
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = history[newIndex];
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      onChange(plainText);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setHtmlContent(history[newIndex]);
      
      // Extract plain text for parent component
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = history[newIndex];
      const plainText = tempDiv.textContent || tempDiv.innerText || '';
      onChange(plainText);
    }
  };

  // Link handling
  const handleOpenLinkDialog = () => {
    if (editorRef.current) {
      const selection = window.getSelection();
      if (selection && selection.toString()) {
        setLinkText(selection.toString());
      }
    }
    setLinkDialogOpen(true);
  };

  const handleAddLink = () => {
    if (!linkUrl) return;
    
    // Create link
    document.execCommand('createLink', false, linkUrl);
    
    // Update content
    if (editorRef.current) {
      updateContent(editorRef.current.innerHTML);
    }
    
    // Reset and close dialog
    setLinkUrl('');
    setLinkText('');
    setLinkDialogOpen(false);
  };

  // Image handling
  const handleOpenImageDialog = () => {
    setImageDialogOpen(true);
  };

  const handleAddImage = () => {
    if (!imageUrl) return;
    
    // Insert image
    document.execCommand('insertHTML', false, `<img src="${imageUrl}" alt="${imageAlt}" style="max-width: 100%;">`);
    
    // Update content
    if (editorRef.current) {
      updateContent(editorRef.current.innerHTML);
    }
    
    // Reset and close dialog
    setImageUrl('');
    setImageAlt('');
    setImageDialogOpen(false);
  };

  // Menu handling
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  // Version history
  const handleOpenHistoryDialog = () => {
    setHistoryDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Comment handling
  const handleAddComment = () => {
    if (newComment.trim()) {
      // In a real implementation, this would call an API to add the comment
      setNewComment('');
      setCommentAnchorEl(null);
      // Show success message or update UI
    }
  };

  const handleCommentClick = (commentId: string, event: React.MouseEvent<HTMLElement>) => {
    setActiveComment(commentId);
    setCommentAnchorEl(event.currentTarget);
  };

  const handleCloseComment = () => {
    setActiveComment(null);
    setCommentAnchorEl(null);
  };

  return (
    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column' }}>
      <Paper 
        variant="outlined" 
        sx={{ 
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: 400,
          border: error ? '1px solid #d32f2f' : undefined,
          backgroundColor: '#f8f9fa',
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          borderRight: sidebarOpen && !isMobile ? '1px solid #e0e0e0' : 'none',
          maxWidth: isMobile ? '100%' : (sidebarOpen ? 'calc(100% - 280px)' : '100%')
        }}>
          {/* Toolbar */}
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5, 
            p: 1, 
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            overflowX: 'auto'
          }}>
            {/* Format group */}
            <Tooltip title="Bold (Ctrl+B)">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('bold')}
                color={formats.bold ? 'primary' : 'default'}
                aria-label="Bold"
              >
                <FormatBold fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Italic (Ctrl+I)">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('italic')}
                color={formats.italic ? 'primary' : 'default'}
                aria-label="Italic"
              >
                <FormatItalic fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Underline (Ctrl+U)">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('underline')}
                color={formats.underline ? 'primary' : 'default'}
                aria-label="Underline"
              >
                <FormatUnderlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Strikethrough">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('strikethrough')}
                color={formats.strikethrough ? 'primary' : 'default'}
                aria-label="Strikethrough"
              >
                <FormatStrikethrough fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* Heading group */}
            <Tooltip title="Heading 1">
              <IconButton 
                size="small" 
                onClick={() => document.execCommand('formatBlock', false, '<h1>')}
                color={formats.h1 ? 'primary' : 'default'}
                aria-label="Heading 1"
              >
                <Box component="span" sx={{ fontSize: '16px', fontWeight: 'bold' }}>H1</Box>
              </IconButton>
            </Tooltip>
            <Tooltip title="Heading 2">
              <IconButton 
                size="small" 
                onClick={() => document.execCommand('formatBlock', false, '<h2>')}
                color={formats.h2 ? 'primary' : 'default'}
                aria-label="Heading 2"
              >
                <Box component="span" sx={{ fontSize: '14px', fontWeight: 'bold' }}>H2</Box>
              </IconButton>
            </Tooltip>
            <Tooltip title="Heading 3">
              <IconButton 
                size="small" 
                onClick={() => document.execCommand('formatBlock', false, '<h3>')}
                color={formats.h3 ? 'primary' : 'default'}
                aria-label="Heading 3"
              >
                <Box component="span" sx={{ fontSize: '12px', fontWeight: 'bold' }}>H3</Box>
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* List group */}
            <Tooltip title="Bullet List">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('insertUnorderedList')}
                color={formats.bulletList ? 'primary' : 'default'}
                aria-label="Bullet List"
              >
                <FormatListBulleted fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Numbered List">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('insertOrderedList')}
                color={formats.numberList ? 'primary' : 'default'}
                aria-label="Numbered List"
              >
                <FormatListNumbered fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* Block group */}
            <Tooltip title="Quote">
              <IconButton 
                size="small" 
                onClick={() => document.execCommand('formatBlock', false, '<blockquote>')}
                color={formats.quote ? 'primary' : 'default'}
                aria-label="Quote"
              >
                <FormatQuote fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Code">
              <IconButton 
                size="small" 
                onClick={() => document.execCommand('formatBlock', false, '<pre>')}
                color={formats.code ? 'primary' : 'default'}
                aria-label="Code"
              >
                <Code fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* Insert group */}
            <Tooltip title="Insert Link">
              <IconButton 
                size="small" 
                onClick={handleOpenLinkDialog}
                aria-label="Insert Link"
              >
                <InsertLink fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Insert Image">
              <IconButton 
                size="small" 
                onClick={handleOpenImageDialog}
                aria-label="Insert Image"
              >
                <ImageOutlined fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Insert Table">
              <IconButton 
                size="small" 
                onClick={() => {
                  document.execCommand('insertHTML', false, `
                    <table style="width:100%; border-collapse: collapse;">
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td><td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td></tr>
                      <tr><td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td><td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td></tr>
                    </table>
                  `);
                  if (editorRef.current) updateContent(editorRef.current.innerHTML);
                }}
                aria-label="Insert Table"
              >
                <TableChart fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* Align group */}
            <Tooltip title="Align Left">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('justifyLeft')}
                color={formats.alignLeft ? 'primary' : 'default'}
                aria-label="Align Left"
              >
                <FormatAlignLeft fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Center">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('justifyCenter')}
                color={formats.alignCenter ? 'primary' : 'default'}
                aria-label="Align Center"
              >
                <FormatAlignCenter fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Align Right">
              <IconButton 
                size="small" 
                onClick={() => applyFormat('justifyRight')}
                color={formats.alignRight ? 'primary' : 'default'}
                aria-label="Align Right"
              >
                <FormatAlignRight fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* History group */}
            <Tooltip title="Undo (Ctrl+Z)">
              <IconButton 
                size="small" 
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                aria-label="Undo"
              >
                <Undo fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Redo (Ctrl+Y)">
              <IconButton 
                size="small" 
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                aria-label="Redo"
              >
                <Redo fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Version History">
              <IconButton 
                size="small" 
                onClick={handleOpenHistoryDialog}
                aria-label="Version History"
              >
                <History fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
            
            {/* Comment */}
            <Tooltip title="Add Comment">
              <IconButton 
                size="small" 
                onClick={(e) => {
                  setCommentAnchorEl(e.currentTarget);
                }}
                aria-label="Add Comment"
              >
                <Comment fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* More actions */}
            <Tooltip title="More Formatting Options">
              <IconButton 
                size="small" 
                onClick={handleMenuOpen}
                aria-label="More Formatting Options"
              >
                <MoreVert fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {/* Spacer */}
            <Box sx={{ flexGrow: 1 }} />
            
            {/* Active collaborators */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {activeUsers.filter(user => user.active).map((user, index) => (
                <Tooltip key={user.id} title={user.name}>
                  <Avatar 
                    sx={{ 
                      width: 24, 
                      height: 24, 
                      fontSize: '0.8rem', 
                      bgcolor: user.color,
                      border: '2px solid #fff'
                    }}
                  >
                    {user.avatar}
                  </Avatar>
                </Tooltip>
              ))}
            </Box>
            
            {/* Toggle sidebar on mobile */}
            {isMobile && (
              <Tooltip title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}>
                <IconButton 
                  size="small" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  aria-label={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                  {sidebarOpen ? <ExpandMore fontSize="small" /> : <ExpandLess fontSize="small" />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
          
          {/* Editor Content */}
          <Box 
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            dangerouslySetInnerHTML={{ __html: htmlContent }}
            onInput={(e) => {
              // @ts-ignore
              updateContent(e.currentTarget.innerHTML);
            }}
            onSelect={() => {
              updateFormatState();
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Save selection
              const selection = window.getSelection();
              if (selection && selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                setSelection({
                  start: range.startOffset,
                  end: range.endOffset
                });
              }
            }}
            sx={{ 
              flex: 1,
              p: 2, 
              overflow: 'auto',
              outline: 'none',
              fontSize: '1rem',
              lineHeight: 1.6,
              '& p': { marginBottom: '1em' },
              '& h1': { fontSize: '2rem', marginBottom: '0.5em', fontWeight: 'bold' },
              '& h2': { fontSize: '1.5rem', marginBottom: '0.5em', fontWeight: 'bold' },
              '& h3': { fontSize: '1.25rem', marginBottom: '0.5em', fontWeight: 'bold' },
              '& ul, & ol': { marginLeft: '2em', marginBottom: '1em' },
              '& blockquote': { 
                borderLeft: '4px solid #ccc', 
                paddingLeft: '1em', 
                color: 'text.secondary',
                marginBottom: '1em'
              },
              '& pre': { 
                backgroundColor: '#f5f5f5', 
                padding: '0.5em', 
                borderRadius: '4px',
                overflowX: 'auto',
                marginBottom: '1em'
              },
              '& a': { color: 'primary.main' },
              '& table': { 
                width: '100%', 
                borderCollapse: 'collapse', 
                marginBottom: '1em' 
              },
              '& td, & th': { 
                border: '1px solid #ddd', 
                padding: '8px',
                textAlign: 'left'
              },
              '& img': { maxWidth: '100%', height: 'auto' }
            }}
            role="textbox"
            aria-multiline="true"
            aria-label="Rich text editor"
            placeholder="Start typing your content here..."
          />
          
          {/* Status bar */}
          <Box sx={{ 
            borderTop: '1px solid #e0e0e0',
            display: 'flex',
            justifyContent: 'space-between',
            p: 0.5,
            backgroundColor: '#fff',
            fontSize: '0.75rem',
            color: 'text.secondary'
          }}>
            <Box>
              {MOCK_COMMENTS.length} comments
            </Box>
            <Box>
              Last edited {new Date().toLocaleTimeString()}
            </Box>
          </Box>
        </Box>
        
        {/* Sidebar */}
        {((!isMobile) || (isMobile && sidebarOpen)) && (
          <Box sx={{ 
            width: isMobile ? '100%' : 280, 
            backgroundColor: '#fff',
            borderTop: isMobile ? '1px solid #e0e0e0' : 'none',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Tabs 
              value={sidebarTab} 
              onChange={(_, newValue) => setSidebarTab(newValue)}
              variant="fullWidth"
              aria-label="Editor sidebar tabs"
            >
              <Tab 
                icon={<LightbulbOutlined />} 
                label={!isMobile ? "AI Suggestions" : undefined} 
                aria-label="AI Suggestions" 
                id="sidebar-tab-0"
                iconPosition="start"
              />
              <Tab 
                icon={<Search />} 
                label={!isMobile ? "SEO Tips" : undefined} 
                aria-label="SEO Tips" 
                id="sidebar-tab-1"
                iconPosition="start"
              />
              <Tab 
                icon={<Comment />} 
                label={!isMobile ? "Comments" : undefined} 
                aria-label="Comments" 
                id="sidebar-tab-2"
                iconPosition="start"
              />
            </Tabs>
            
            <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
              {/* AI Suggestions */}
              {sidebarTab === 0 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    AI Writing Suggestions for {brandName}
                  </Typography>
                  {MOCK_AI_SUGGESTIONS.map((suggestion) => (
                    <Paper 
                      key={suggestion.id} 
                      elevation={0} 
                      sx={{ 
                        p: 1, 
                        mb: 1, 
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#f8f9fa'
                      }}
                    >
                      <Typography variant="body2">
                        {suggestion.text}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          startIcon={<Edit />}
                          sx={{ mr: 1 }}
                        >
                          Apply
                        </Button>
                        <IconButton size="small" aria-label="Dismiss suggestion">
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </Paper>
                  ))}
                </>
              )}
              
              {/* SEO Tips */}
              {sidebarTab === 1 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    SEO Optimization for {brandName}
                  </Typography>
                  {MOCK_SEO_SUGGESTIONS.map((suggestion) => (
                    <Paper 
                      key={suggestion.id} 
                      elevation={0} 
                      sx={{ 
                        p: 1, 
                        mb: 1, 
                        border: '1px solid #e0e0e0',
                        backgroundColor: suggestion.severity === 'high' ? '#fff8e1' : 
                                        suggestion.severity === 'medium' ? '#f5f5f5' : '#e8f5e9'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                        <Chip 
                          label={suggestion.severity.toUpperCase()} 
                          size="small" 
                          color={
                            suggestion.severity === 'high' ? 'warning' : 
                            suggestion.severity === 'medium' ? 'default' : 'success'
                          }
                          sx={{ mr: 1, mb: 1 }}
                        />
                      </Box>
                      <Typography variant="body2">
                        {suggestion.text}
                      </Typography>
                    </Paper>
                  ))}
                </>
              )}
              
              {/* Comments */}
              {sidebarTab === 2 && (
                <>
                  <Typography variant="subtitle2" gutterBottom>
                    Content Comments
                  </Typography>
                  {MOCK_COMMENTS.map((comment) => (
                    <Paper 
                      key={comment.id} 
                      elevation={0} 
                      sx={{ 
                        p: 1, 
                        mb: 1, 
                        border: '1px solid #e0e0e0',
                        backgroundColor: '#f8f9fa',
                        cursor: 'pointer'
                      }}
                      onClick={(e) => handleCommentClick(comment.id, e)}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Avatar 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            fontSize: '0.8rem', 
                            mr: 1
                          }}
                        >
                          {comment.avatar}
                        </Avatar>
                        <Typography variant="body2" fontWeight="bold">
                          {comment.author}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }} />
                        <Typography variant="caption" color="text.secondary">
                          {comment.timestamp}
                        </Typography>
                      </Box>
                      <Typography variant="body2">
                        {comment.text}
                      </Typography>
                    </Paper>
                  ))}
                </>
              )}
            </Box>
          </Box>
        )}
      </Paper>
      
      {error && helperText && (
        <FormHelperText error>{helperText}</FormHelperText>
      )}
      
      {/* Link Dialog */}
      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} aria-labelledby="link-dialog-title">
        <DialogTitle id="link-dialog-title">Insert Link</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="url"
            label="Link URL"
            type="url"
            fullWidth
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            variant="outlined"
            placeholder="https://example.com"
          />
          {linkText && (
            <TextField
              margin="dense"
              id="text"
              label="Link Text"
              type="text"
              fullWidth
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              variant="outlined"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddLink} variant="contained" disabled={!linkUrl}>Insert</Button>
        </DialogActions>
      </Dialog>
      
      {/* Image Dialog */}
      <Dialog open={imageDialogOpen} onClose={() => setImageDialogOpen(false)} aria-labelledby="image-dialog-title">
        <DialogTitle id="image-dialog-title">Insert Image</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="imageUrl"
            label="Image URL"
            type="url"
            fullWidth
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            variant="outlined"
            placeholder="https://example.com/image.jpg"
          />
          <TextField
            margin="dense"
            id="imageAlt"
            label="Alt Text (for accessibility)"
            type="text"
            fullWidth
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            variant="outlined"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddImage} variant="contained" disabled={!imageUrl}>Insert</Button>
        </DialogActions>
      </Dialog>
      
      {/* Format Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          document.execCommand('subscript');
          if (editorRef.current) updateContent(editorRef.current.innerHTML);
          handleMenuClose();
        }}>
          <Subscript fontSize="small" sx={{ mr: 1 }} /> Subscript
        </MenuItem>
        <MenuItem onClick={() => {
          document.execCommand('superscript');
          if (editorRef.current) updateContent(editorRef.current.innerHTML);
          handleMenuClose();
        }}>
          <Superscript fontSize="small" sx={{ mr: 1 }} /> Superscript
        </MenuItem>
        <MenuItem onClick={() => {
          document.execCommand('formatBlock', false, '<pre>');
          if (editorRef.current) updateContent(editorRef.current.innerHTML);
          handleMenuClose();
        }}>
          <Code fontSize="small" sx={{ mr: 1 }} /> Code Block
        </MenuItem>
        <MenuItem onClick={() => {
          // Would integrate with actual color picker in real implementation
          document.execCommand('foreColor', false, '#e91e63');
          if (editorRef.current) updateContent(editorRef.current.innerHTML);
          handleMenuClose();
        }}>
          <FormatColorText fontSize="small" sx={{ mr: 1 }} /> Text Color
        </MenuItem>
        <MenuItem onClick={() => {
          document.execCommand('removeFormat');
          if (editorRef.current) updateContent(editorRef.current.innerHTML);
          handleMenuClose();
        }}>
          <FormatClear fontSize="small" sx={{ mr: 1 }} /> Clear Formatting
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => {
          if (editorRef.current) {
            navigator.clipboard.writeText(editorRef.current.innerText);
          }
          handleMenuClose();
        }}>
          <ContentCopy fontSize="small" sx={{ mr: 1 }} /> Copy Text
        </MenuItem>
        <MenuItem onClick={() => {
          if (editorRef.current) {
            navigator.clipboard.writeText(editorRef.current.innerHTML);
          }
          handleMenuClose();
        }}>
          <FileCopy fontSize="small" sx={{ mr: 1 }} /> Copy HTML
        </MenuItem>
      </Menu>
      
      {/* Version History Dialog */}
      <Dialog 
        open={historyDialogOpen} 
        onClose={() => setHistoryDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="version-history-dialog-title"
      >
        <DialogTitle id="version-history-dialog-title">Version History</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" paragraph>
              View and restore previous versions of your content.
            </Typography>
            
            {MOCK_VERSIONS.map((version) => (
              <Paper 
                key={version.id}
                elevation={0}
                sx={{ 
                  p: 1.5, 
                  mb: 1,
                  backgroundColor: selectedVersion === version.id ? 'action.selected' : 'background.paper',
                  border: '1px solid',
                  borderColor: selectedVersion === version.id ? 'primary.main' : 'divider'
                }}
                onClick={() => setSelectedVersion(version.id)}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography variant="subtitle2">
                    {version.description}
                  </Typography>
                  {version.id === 'v4' && (
                    <Chip 
                      label="Current" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1 }}
                    />
                  )}
                  <Box sx={{ flexGrow: 1 }} />
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(version.createdAt)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    {version.author}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={() => {
              // Would restore the selected version here
              setHistoryDialogOpen(false);
            }} 
            variant="contained" 
            disabled={!selectedVersion}
          >
            Restore This Version
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Comment Dialog */}
      <Menu
        anchorEl={commentAnchorEl}
        open={Boolean(commentAnchorEl)}
        onClose={() => setCommentAnchorEl(null)}
      >
        <Box sx={{ p: 2, width: 300 }}>
          <Typography variant="subtitle2" gutterBottom>
            Add Comment
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            placeholder="Add your comment here..."
            type="text"
            fullWidth
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            variant="outlined"
            multiline
            rows={3}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
            <Button onClick={() => setCommentAnchorEl(null)} sx={{ mr: 1 }}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddComment} 
              variant="contained"
              disabled={!newComment.trim()}
            >
              Add
            </Button>
          </Box>
        </Box>
      </Menu>
    </Box>
  );
};

export default RichTextEditor;