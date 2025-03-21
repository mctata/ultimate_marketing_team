import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Toast notification that appears temporarily
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  action?: {
    label: string;
    callback: () => void;
  };
}

// System notification that persists in notification center
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  read: boolean;
  createdAt: string;
  title?: string;
  actionUrl?: string;
}

interface UiState {
  sidebarOpen: boolean;
  darkMode: boolean;
  notifications: Notification[];
  toasts: Toast[];
  currentTheme: string;
  loading: {
    [key: string]: boolean; // Map of loading states by key
  };
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    confirmLabel: string;
    cancelLabel: string;
    confirmAction: (() => void) | null;
    onCancel?: () => void;
  };
  offlineMode: boolean;
  pendingSyncActions: any[]; // Actions that need to be synced when back online
}

const initialState: UiState = {
  sidebarOpen: true,
  darkMode: localStorage.getItem('darkMode') === 'true',
  notifications: [],
  toasts: [],
  currentTheme: localStorage.getItem('theme') || 'default',
  loading: {},
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel',
    confirmAction: null,
  },
  offlineMode: false,
  pendingSyncActions: [],
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Sidebar
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    
    // Theme
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode.toString());
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', action.payload.toString());
    },
    setTheme: (state, action: PayloadAction<string>) => {
      state.currentTheme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    // Persistent Notifications - appear in notification center
    addNotification: (state, action: PayloadAction<Partial<Notification>>) => {
      const newNotification: Notification = {
        id: action.payload.id || Date.now().toString(),
        type: action.payload.type || 'info',
        message: action.payload.message || '',
        read: action.payload.read || false,
        createdAt: action.payload.createdAt || new Date().toISOString(),
        title: action.payload.title,
        actionUrl: action.payload.actionUrl,
      };
      
      // Don't add duplicates (same id)
      if (!state.notifications.some(n => n.id === newNotification.id)) {
        state.notifications.unshift(newNotification);
        // Keep only the 50 most recent notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      }
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find((n) => n.id === action.payload);
      if (notification) {
        notification.read = true;
      }
    },
    markAllNotificationsAsRead: (state) => {
      state.notifications.forEach(notification => {
        notification.read = true;
      });
    },
    deleteNotification: (state, action: PayloadAction<string>) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
    
    // Toast notifications - temporary pop-ups
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const toast: Toast = {
        id: Date.now().toString(),
        ...action.payload,
      };
      state.toasts.push(toast);
      
      // Also add as a notification if it's important
      if (action.payload.type === 'error' || action.payload.type === 'warning') {
        const notification: Notification = {
          id: toast.id,
          type: toast.type,
          message: toast.message,
          title: toast.title,
          read: false,
          createdAt: new Date().toISOString(),
        };
        state.notifications.unshift(notification);
        
        // Keep only the 50 most recent notifications
        if (state.notifications.length > 50) {
          state.notifications = state.notifications.slice(0, 50);
        }
      }
    },
    clearToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    clearAllToasts: (state) => {
      state.toasts = [];
    },
    
    // Loading state tracking
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
    },
    clearAllLoadingStates: (state) => {
      state.loading = {};
    },
    
    // Confirmation dialog
    openConfirmDialog: (state, action: PayloadAction<Omit<UiState['confirmDialog'], 'open'>>) => {
      state.confirmDialog = {
        ...action.payload,
        open: true,
      };
    },
    closeConfirmDialog: (state) => {
      state.confirmDialog = {
        ...state.confirmDialog,
        open: false,
      };
    },
    
    // Offline mode
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
      
      // Show toast notification when connection status changes
      if (action.payload) {
        state.toasts.push({
          id: Date.now().toString(),
          type: 'warning',
          message: 'You are currently offline. Changes will be saved when you reconnect.',
          duration: 5000,
        });
      } else {
        state.toasts.push({
          id: Date.now().toString(),
          type: 'success',
          message: 'You are back online. Syncing changes...',
          duration: 3000,
        });
      }
    },
    addPendingSyncAction: (state, action: PayloadAction<any>) => {
      state.pendingSyncActions.push(action.payload);
    },
    clearPendingSyncActions: (state) => {
      state.pendingSyncActions = [];
    },
    removePendingSyncAction: (state, action: PayloadAction<string>) => {
      state.pendingSyncActions = state.pendingSyncActions.filter(
        (action) => action.id !== action.payload
      );
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setTheme,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearNotifications,
  addToast,
  clearToast,
  clearAllToasts,
  setLoading,
  clearAllLoadingStates,
  openConfirmDialog,
  closeConfirmDialog,
  setOfflineMode,
  addPendingSyncAction,
  clearPendingSyncActions,
  removePendingSyncAction,
} = uiSlice.actions;

export default uiSlice.reducer;