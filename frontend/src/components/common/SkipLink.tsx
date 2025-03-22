import { Box, Link } from '@mui/material';
import { styled } from '@mui/material/styles';

interface SkipLinkProps {
  targetId: string;
  label?: string;
}

// Styled component for the skip link
const StyledSkipLink = styled(Link)(({ theme }) => ({
  position: 'absolute',
  top: '-40px',
  left: 0,
  padding: theme.spacing(1.5),
  backgroundColor: theme.palette.background.paper,
  color: theme.palette.primary.main,
  zIndex: theme.zIndex.appBar + 1,
  fontWeight: 'bold',
  transition: 'top 0.2s ease',
  '&:focus': {
    top: 0,
    outline: `3px solid ${theme.palette.primary.main}`,
  },
}));

/**
 * Skip link component for accessibility
 * Allows keyboard users to bypass navigation and jump directly to main content
 * 
 * @param targetId - The ID of the element to skip to (without #)
 * @param label - Optional custom label for the skip link
 */
const SkipLink = ({ targetId, label = 'Skip to content' }: SkipLinkProps) => {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    
    const targetElement = document.getElementById(targetId);
    if (targetElement) {
      // Set tabindex to make non-interactive elements focusable
      if (!targetElement.hasAttribute('tabindex')) {
        targetElement.setAttribute('tabindex', '-1');
      }
      
      // Focus and scroll to the element
      targetElement.focus();
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <Box>
      <StyledSkipLink 
        href={`#${targetId}`}
        onClick={handleClick}
        aria-label={label}
        className="skip-link"
      >
        {label}
      </StyledSkipLink>
    </Box>
  );
};

export default SkipLink;