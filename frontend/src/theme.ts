import { createTheme, ThemeOptions, alpha, PaletteOptions } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Define utility function to create a theme with specific settings
const createAppTheme = (
  mode: PaletteMode = 'light',
  highContrast: boolean = false,
  textScaling: 'normal' | 'large' | 'extra-large' = 'normal'
): ThemeOptions => {
  // Base colors
  const primaryColor = {
    light: '#4da6ff',
    main: '#0066cc',
    dark: '#004c99',
    contrastText: '#fff',
  };
  
  const secondaryColor = {
    light: '#ff7961',
    main: '#f44336',
    dark: '#ba000d',
    contrastText: '#fff',
  };
  
  // High contrast alternatives
  const highContrastPrimaryColor = {
    light: '#5cb3ff',
    main: '#0052cc', // More saturated blue for better contrast
    dark: '#00337f', // Darker blue for more contrast
    contrastText: '#ffffff',
  };
  
  const highContrastSecondaryColor = {
    light: '#ff867c',
    main: '#d32f2f', // More saturated red
    dark: '#9a0007',
    contrastText: '#ffffff',
  };
  
  // Create palette based on mode and contrast settings
  const getPalette = (): PaletteOptions => {
    // Dark mode palette
    if (mode === 'dark') {
      return {
        mode: 'dark',
        primary: highContrast ? highContrastPrimaryColor : primaryColor,
        secondary: highContrast ? highContrastSecondaryColor : secondaryColor,
        background: {
          default: highContrast ? '#000000' : '#121212', 
          paper: highContrast ? '#121212' : '#1e1e1e',
        },
        text: {
          primary: highContrast ? '#ffffff' : '#e0e0e0',
          secondary: highContrast ? '#f5f5f5' : '#aaaaaa',
        },
        divider: highContrast ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.12)',
        error: {
          main: highContrast ? '#ff5252' : '#f44336',
        },
        warning: {
          main: highContrast ? '#ffab40' : '#ff9800',
        },
        info: {
          main: highContrast ? '#64b5f6' : '#2196f3',
        },
        success: {
          main: highContrast ? '#69f0ae' : '#4caf50',
        },
      };
    }
    
    // Light mode palette
    return {
      mode: 'light',
      primary: highContrast ? highContrastPrimaryColor : primaryColor,
      secondary: highContrast ? highContrastSecondaryColor : secondaryColor,
      background: {
        default: highContrast ? '#ffffff' : '#f5f7fa',
        paper: '#ffffff',
      },
      text: {
        primary: highContrast ? '#000000' : '#212121',
        secondary: highContrast ? '#212121' : '#757575',
      },
      divider: highContrast ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.12)',
      error: {
        main: highContrast ? '#d50000' : '#f44336',
      },
      warning: {
        main: highContrast ? '#ff6d00' : '#ff9800',
      },
      info: {
        main: highContrast ? '#0066cc' : '#2196f3',
      },
      success: {
        main: highContrast ? '#00c853' : '#4caf50',
      },
    };
  };
  
  // Calculate scaling factors
  const getFontScaling = () => {
    switch (textScaling) {
      case 'large':
        return 1.2;
      case 'extra-large':
        return 1.4;
      default:
        return 1;
    }
  };
  
  const fontScale = getFontScaling();
  
  // Accessibility styles
  const focusOutlineStyle = highContrast 
    ? `3px solid ${highContrastPrimaryColor.main}`
    : `2px solid ${alpha(primaryColor.main, 0.5)}`;
  
  // Set focus styles for a11y compliance
  const getAccessibleFocusStyles = {
    outline: 'none',
    boxShadow: 'none',
    '&:focus-visible': {
      outline: focusOutlineStyle,
      outlineOffset: '2px',
    },
  };
  
  // Create the theme with our settings
  return {
    palette: getPalette(),
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      fontSize: 14 * fontScale,
      h1: {
        fontWeight: 700,
        fontSize: 2.5 * fontScale + 'rem',
      },
      h2: {
        fontWeight: 600,
        fontSize: 2 * fontScale + 'rem',
      },
      h3: {
        fontWeight: 600,
        fontSize: 1.75 * fontScale + 'rem',
      },
      h4: {
        fontWeight: 600,
        fontSize: 1.5 * fontScale + 'rem',
      },
      h5: {
        fontWeight: 500,
        fontSize: 1.25 * fontScale + 'rem',
      },
      h6: {
        fontWeight: 500,
        fontSize: 1.1 * fontScale + 'rem',
      },
      body1: {
        fontSize: 1 * fontScale + 'rem',
      },
      body2: {
        fontSize: 0.875 * fontScale + 'rem',
      },
      button: {
        fontSize: 0.875 * fontScale + 'rem',
        textTransform: 'none',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          // Global accessibility styles
          'html, body': {
            height: '100%',
          },
          // Skip link for keyboard users (will be hidden visually but available for screen readers)
          '.skip-link': {
            position: 'absolute',
            top: '-40px',
            left: 0,
            background: mode === 'dark' ? '#000' : '#fff',
            color: highContrastPrimaryColor.main,
            padding: '8px',
            zIndex: 2000,
            transition: 'top 0.2s',
            fontWeight: 'bold',
            '&:focus': {
              top: 0,
            },
          },
          // Focus states for keyboard navigation
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])': {
            '&:focus-visible': {
              outline: focusOutlineStyle,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 8,
            textTransform: 'none',
            fontWeight: 500,
            ...getAccessibleFocusStyles,
            // Increase padding for touch targets on mobile
            padding: '8px 16px',
            // Ensure minimum touch target size (44x44px is recommended)
            minHeight: '44px',
            // Increase contrast for disabled state
            '&.Mui-disabled': {
              backgroundColor: mode === 'dark' 
                ? (highContrast ? '#444' : '#333') 
                : (highContrast ? '#e0e0e0' : '#f5f5f5'),
              color: mode === 'dark'
                ? (highContrast ? '#aaa' : '#777')
                : (highContrast ? '#666' : '#bdbdbd'),
            },
          },
          // High contrast outline for text buttons in dark mode
          text: {
            ...(mode === 'dark' && highContrast ? {
              border: '1px solid currentColor',
            } : {}),
          },
          // Improved focus state visibility
          outlined: {
            '&:focus-visible': {
              outline: focusOutlineStyle,
              outlineOffset: '2px',
            },
          },
          contained: {
            // Improve contrast for contained buttons
            color: highContrast ? '#ffffff' : undefined,
            '&:focus-visible': {
              outline: mode === 'dark' 
                ? `2px solid ${highContrast ? '#fff' : primaryColor.light}` 
                : focusOutlineStyle,
              outlineOffset: '2px',
            },
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
            // Add border in high contrast mode
            border: highContrast 
              ? `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` 
              : 'none',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            // Add border in high contrast mode
            border: highContrast 
              ? `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}` 
              : 'none',
          },
        },
      },
      // Improve contrast and size of form elements
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              // Increase contrast for field border
              '& fieldset': {
                borderColor: mode === 'dark' 
                  ? (highContrast ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.23)') 
                  : (highContrast ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.23)'),
                borderWidth: highContrast ? 2 : 1,
              },
              '&:hover fieldset': {
                borderColor: mode === 'dark' 
                  ? (highContrast ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.5)') 
                  : (highContrast ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'),
              },
              // Improved focus visuals
              '&.Mui-focused fieldset': {
                borderColor: highContrast ? highContrastPrimaryColor.main : primaryColor.main,
                borderWidth: 2,
              },
            },
            // Ensure form labels have good contrast
            '& .MuiInputLabel-root': {
              color: mode === 'dark' 
                ? (highContrast ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)') 
                : (highContrast ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.7)'),
              fontSize: 1 * fontScale + 'rem',
            },
            // Improve contrast for helper text
            '& .MuiFormHelperText-root': {
              color: mode === 'dark' 
                ? (highContrast ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)') 
                : (highContrast ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.6)'),
              fontSize: 0.75 * fontScale + 'rem',
            },
          },
        },
      },
      // Improve checkbox/radio visibility
      MuiCheckbox: {
        styleOverrides: {
          root: {
            padding: '9px', // Increase touch target size
            // High contrast visual 
            color: mode === 'dark' 
              ? (highContrast ? 'rgba(255,255,255,0.9)' : undefined) 
              : (highContrast ? 'rgba(0,0,0,0.9)' : undefined),
            '&.Mui-checked': {
              color: highContrast ? highContrastPrimaryColor.main : undefined,
            },
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            padding: '9px', // Increase touch target size
            // High contrast visual
            color: mode === 'dark' 
              ? (highContrast ? 'rgba(255,255,255,0.9)' : undefined) 
              : (highContrast ? 'rgba(0,0,0,0.9)' : undefined),
            '&.Mui-checked': {
              color: highContrast ? highContrastPrimaryColor.main : undefined,
            },
          },
        },
      },
      // Adjust chip styling
      MuiChip: {
        styleOverrides: {
          root: {
            height: 32 * fontScale,
            // Ensure good contrast in high contrast mode
            ...(highContrast && {
              border: `1px solid ${mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}`,
            }),
          },
          label: {
            fontSize: (0.75 * fontScale) + 'rem',
          },
        },
      },
      // Improve focus styling for icons
      MuiIconButton: {
        styleOverrides: {
          root: {
            ...getAccessibleFocusStyles,
            padding: '12px', // Ensure minimum 44x44 touch target
            color: mode === 'dark' 
              ? (highContrast ? 'rgba(255,255,255,0.9)' : undefined)
              : (highContrast ? 'rgba(0,0,0,0.9)' : undefined),
            '&:hover': {
              backgroundColor: mode === 'dark'
                ? (highContrast ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)')
                : (highContrast ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.04)'),
            },
          },
        },
      },
    },
  };
};

// The default theme (we can extend this to toggle themes)
const theme = createTheme(createAppTheme('light', false, 'normal'));

// Export pre-defined theme variants for quick switching
export const highContrastTheme = createTheme(createAppTheme('light', true, 'normal'));
export const darkTheme = createTheme(createAppTheme('dark', false, 'normal'));
export const darkHighContrastTheme = createTheme(createAppTheme('dark', true, 'normal'));
export const largeTextTheme = createTheme(createAppTheme('light', false, 'large'));
export const extraLargeTextTheme = createTheme(createAppTheme('light', false, 'extra-large'));

// Export theme creation function for dynamic theme switching
export const createCustomTheme = (mode: PaletteMode, highContrast: boolean, textScaling: 'normal' | 'large' | 'extra-large') => {
  return createTheme(createAppTheme(mode, highContrast, textScaling));
};

export default theme;