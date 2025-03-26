import { store } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { updateContentItem } from '../store/slices/contentSlice';
import { updateProject } from '../store/slices/projectsSlice';
import { updateAd } from '../store/slices/adsSlice';

// WebSocket connection status
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error' | 'reconnecting';

// Connection options
interface WebSocketOptions {
  pingInterval?: number;          // Ping interval in ms (default: 30000)
  reconnectInterval?: number;     // Base reconnect interval in ms (default: 1000)
  maxReconnectInterval?: number;  // Maximum reconnect interval in ms (default: 30000)
  reconnectDecay?: number;        // Exponential backoff rate (default: 1.5)
  maxReconnectAttempts?: number;  // Maximum reconnect attempts (default: Infinity)
  debug?: boolean;                // Enable debug logging (default: false)
  autoReconnect?: boolean;        // Auto reconnect on disconnect (default: true)
  queueSizeLimit?: number;        // Maximum size of message queue (default: 100)
}

// Default options
const DEFAULT_OPTIONS: WebSocketOptions = {
  pingInterval: 30000,
  reconnectInterval: 1000,
  maxReconnectInterval: 30000,
  reconnectDecay: 1.5,
  maxReconnectAttempts: Infinity,
  debug: process.env.NODE_ENV === 'development',
  autoReconnect: true,
  queueSizeLimit: 100,
};

/**
 * WebSocketService - Enhanced WebSocket service with robust connection handling
 */
class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts: number = 0;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Record<string, ((data: any) => void)[]> = {};
  private messageQueue: Array<any> = [];
  private options: WebSocketOptions;
  private lastTokenUsed: string | null = null;
  private lastActivity: number = Date.now();
  private inactivityTimer: ReturnType<typeof setInterval> | null = null;
  private connectionStartTime: number = 0;
  private bytesReceived: number = 0;
  private bytesSent: number = 0;
  private messagesReceived: number = 0;
  private messagesSent: number = 0;
  
  /**
   * Create a new WebSocketService
   * @param options Configuration options
   */
  constructor(options: WebSocketOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    
    // Bind methods to ensure correct this context
    this.connect = this.connect.bind(this);
    this.disconnect = this.disconnect.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.handleMessage = this.handleMessage.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleError = this.handleError.bind(this);
    this.send = this.send.bind(this);
    this.processQueue = this.processQueue.bind(this);
    
    // Start inactivity detection if auto reconnect is enabled
    if (this.options.autoReconnect) {
      this.startInactivityDetection();
    }
    
    // Add unload handler to clean up on page unload
    window.addEventListener('beforeunload', () => {
      this.cleanupBeforeUnload();
    });
  }
  
  /**
   * Start the inactivity detection timer
   * Will reconnect if no activity detected for a long period
   */
  private startInactivityDetection(): void {
    // Clear existing timer if any
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
    }
    
    // Check for inactivity every minute
    this.inactivityTimer = setInterval(() => {
      const now = Date.now();
      const inactiveTime = now - this.lastActivity;
      
      // If inactive for more than 5 minutes and connected, reconnect
      if (inactiveTime > 5 * 60 * 1000 && this.status === 'connected') {
        this.log('Connection inactive for 5 minutes, reconnecting...');
        this.reconnect();
      }
    }, 60 * 1000);
  }
  
  /**
   * Record activity to prevent inactivity detection from triggering
   */
  private recordActivity(): void {
    this.lastActivity = Date.now();
  }
  
  /**
   * Clean up resources before page unload
   */
  private cleanupBeforeUnload(): void {
    // Perform a clean disconnect without reconnection
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      // Send a close message if possible
      try {
        this.send({ type: 'client_disconnect', reason: 'page_unload' });
      } catch (e) {
        // Ignore errors during unload
      }
      
      // Disable auto reconnect during unload
      const wasAutoReconnect = this.options.autoReconnect;
      this.options.autoReconnect = false;
      
      // Close the socket
      this.disconnect();
      
      // Restore the setting in case the unload is canceled
      this.options.autoReconnect = wasAutoReconnect;
    }
  }
  
  /**
   * Conditional logging based on debug option
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WebSocketService]', ...args);
    }
  }
  
  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connected
   */
  public connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket) {
        this.disconnect();
      }
      
      // Get authentication token
      const token = localStorage.getItem('token');
      if (!token) {
        const error = new Error('No authentication token found');
        this.log('Connection error:', error);
        this.status = 'error';
        reject(error);
        return;
      }
      
      // Save the token for reconnection
      this.lastTokenUsed = token;
      
      try {
        this.status = 'connecting';
        this.connectionStartTime = Date.now();
        
        // Create WebSocket connection with auth token
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        let wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || '';
        
        // If WS_BASE_URL is not provided, construct it based on the current host
        if (!wsBaseUrl) {
          wsBaseUrl = `${protocol}//${window.location.host}/api/v1/ws`;
        }
        
        const wsUrl = `${wsBaseUrl}?token=${token}`;
        this.socket = new WebSocket(wsUrl);
        
        // Setup event handlers
        this.socket.onopen = () => {
          this.handleOpen();
          resolve();
        };
        
        this.socket.onmessage = this.handleMessage;
        this.socket.onclose = this.handleClose;
        this.socket.onerror = (error) => {
          this.handleError(error);
          reject(error);
        };
        
        // For browsers that support the binaryType property
        if ('binaryType' in this.socket) {
          this.socket.binaryType = 'arraybuffer'; // More efficient binary handling
        }
      } catch (error) {
        this.log('WebSocket connection error:', error);
        this.status = 'error';
        this.scheduleReconnect();
        reject(error);
      }
    });
  }
  
  /**
   * Reconnect to the WebSocket server
   */
  public reconnect(): void {
    this.disconnect();
    this.status = 'reconnecting';
    this.connect().catch(error => {
      this.log('Reconnection failed:', error);
    });
  }
  
  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.status = 'disconnected';
    
    if (this.socket) {
      // Remove event handlers
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      // Close the connection if it's open
      if (this.socket.readyState === WebSocket.OPEN) {
        try {
          this.socket.close(1000, 'Client disconnecting');
        } catch (e) {
          this.log('Error closing WebSocket:', e);
        }
      }
      
      this.socket = null;
    }
    
    // Clear timers
    this.clearTimers();
  }
  
  /**
   * Clear all timers
   */
  private clearTimers(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }
  
  /**
   * Get current connection status
   */
  public getStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Send a message to the server
   * If connection is not open, message will be queued
   */
  public send(message: any): boolean {
    // Record activity
    this.recordActivity();
    
    // Add timestamp to message
    if (typeof message === 'object') {
      message.timestamp = message.timestamp || new Date().toISOString();
      message.client_id = message.client_id || this.generateClientId();
    }
    
    // If connected, send immediately
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const serialized = JSON.stringify(message);
        this.socket.send(serialized);
        this.bytesSent += serialized.length;
        this.messagesSent++;
        return true;
      } catch (e) {
        this.log('Error sending message:', e);
        this.queueMessage(message);
        return false;
      }
    } else {
      // Otherwise, queue the message
      this.queueMessage(message);
      
      // If we're not connecting or reconnecting, try to reconnect
      if (this.status !== 'connecting' && this.status !== 'reconnecting' && this.options.autoReconnect) {
        this.scheduleReconnect();
      }
      
      return false;
    }
  }
  
  /**
   * Add a message to the queue
   */
  private queueMessage(message: any): void {
    // Limit queue size
    if (this.messageQueue.length >= (this.options.queueSizeLimit || 100)) {
      // Remove oldest message
      this.messageQueue.shift();
    }
    
    this.messageQueue.push(message);
    this.log(`Message queued. Queue size: ${this.messageQueue.length}`);
  }
  
  /**
   * Process queued messages
   */
  private processQueue(): void {
    if (!this.messageQueue.length || !this.isConnected()) {
      return;
    }
    
    this.log(`Processing message queue. Size: ${this.messageQueue.length}`);
    
    // Take a snapshot of the queue and clear it
    const queueSnapshot = [...this.messageQueue];
    this.messageQueue = [];
    
    // Send all queued messages
    for (const message of queueSnapshot) {
      this.send(message);
    }
  }
  
  /**
   * Generate a unique client ID for message deduplication
   */
  private generateClientId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Add event handler for specific message types
   * @returns Function to remove the handler
   */
  public on(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    
    this.messageHandlers[type].push(handler);
    
    // Return function to remove this handler
    return () => {
      if (this.messageHandlers[type]) {
        this.messageHandlers[type] = this.messageHandlers[type].filter(h => h !== handler);
      }
    };
  }
  
  /**
   * Add a handler for all messages
   * @returns Function to remove the handler
   */
  public addMessageHandler(handler: (data: any) => void): () => void {
    return this.on('all', handler);
  }
  
  /**
   * Check if websocket is connected
   */
  public isConnected(): boolean {
    return this.status === 'connected' && this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  /**
   * Get connection statistics
   */
  public getStats(): any {
    const now = Date.now();
    const connectionDuration = this.connectionStartTime ? now - this.connectionStartTime : 0;
    
    return {
      status: this.status,
      reconnectAttempts: this.reconnectAttempts,
      messageQueueSize: this.messageQueue.length,
      messagesReceived: this.messagesReceived,
      messagesSent: this.messagesSent,
      bytesReceived: this.bytesReceived,
      bytesSent: this.bytesSent,
      connectionDuration: connectionDuration,
      connectionDurationFormatted: this.formatDuration(connectionDuration),
      lastActivity: this.lastActivity ? new Date(this.lastActivity).toISOString() : null,
      inactiveTime: now - this.lastActivity,
    };
  }
  
  /**
   * Format duration in milliseconds to a human-readable string
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    
    const seconds = Math.floor(ms / 1000) % 60;
    const minutes = Math.floor(ms / 60000) % 60;
    const hours = Math.floor(ms / 3600000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    this.status = 'connected';
    this.log('WebSocket connected');
    
    // Reset reconnect attempts on successful connection
    this.reconnectAttempts = 0;
    
    // Record activity
    this.recordActivity();
    
    // Setup ping interval to keep connection alive
    if (this.options.pingInterval && this.options.pingInterval > 0) {
      this.pingInterval = setInterval(() => {
        if (this.isConnected()) {
          this.send({ type: 'ping', timestamp: new Date().toISOString() });
        } else {
          // Clear interval if not connected
          this.clearTimers();
        }
      }, this.options.pingInterval);
    }
    
    // Process any queued messages
    this.processQueue();
  }
  
  /**
   * Handle WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    // Record activity and update stats
    this.recordActivity();
    this.messagesReceived++;
    
    if (typeof event.data === 'string') {
      this.bytesReceived += event.data.length;
    } else if (event.data instanceof ArrayBuffer) {
      this.bytesReceived += event.data.byteLength;
    } else if (event.data instanceof Blob) {
      this.bytesReceived += event.data.size;
    }
    
    // Process message based on type
    if (event.data instanceof ArrayBuffer || event.data instanceof Blob) {
      // Handle binary data - convert to string or process as binary
      this.handleBinaryMessage(event.data);
      return;
    }
    
    // Handle text messages
    try {
      const data = JSON.parse(event.data);
      const messageType = data.type;
      
      // Process standard message types
      if (messageType === 'pong') {
        // Ping response - update latency metric if timestamp included
        if (data.original_timestamp) {
          const latency = Date.now() - new Date(data.original_timestamp).getTime();
          this.log(`Connection latency: ${latency}ms`);
        }
        return;
      }
      
      // Dispatch to Redux store based on message type
      this.dispatchToStore(data);
      
      // Call registered handlers for this message type
      if (this.messageHandlers[messageType]) {
        this.messageHandlers[messageType].forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            console.error(`Error in message handler for ${messageType}:`, err);
          }
        });
      }
      
      // Call handlers for 'all' messages
      if (this.messageHandlers['all']) {
        this.messageHandlers['all'].forEach(handler => {
          try {
            handler(data);
          } catch (err) {
            console.error('Error in "all" message handler:', err);
          }
        });
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }
  
  /**
   * Handle binary messages
   */
  private handleBinaryMessage(data: ArrayBuffer | Blob): void {
    // Convert blob to array buffer if needed
    if (data instanceof Blob) {
      const fileReader = new FileReader();
      fileReader.onload = (event) => {
        if (event.target?.result instanceof ArrayBuffer) {
          this.processBinaryData(event.target.result);
        }
      };
      fileReader.readAsArrayBuffer(data);
    } else {
      this.processBinaryData(data);
    }
  }
  
  /**
   * Process binary data
   */
  private processBinaryData(data: ArrayBuffer): void {
    // Implement binary data processing as needed
    this.log(`Received binary data of size ${data.byteLength} bytes`);
    
    // Example: If the first 4 bytes indicate a message type
    const view = new DataView(data);
    const messageType = view.getUint32(0);
    
    // Call binary message handlers
    if (this.messageHandlers[`binary_${messageType}`]) {
      this.messageHandlers[`binary_${messageType}`].forEach(handler => {
        try {
          handler(data);
        } catch (err) {
          console.error(`Error in binary message handler for type ${messageType}:`, err);
        }
      });
    }
  }
  
  /**
   * Dispatch messages to the Redux store
   */
  private dispatchToStore(data: any): void {
    const { type } = data;
    
    switch (type) {
      case 'notification':
        store.dispatch(addNotification({
          id: data.id || `notification-${Date.now()}`,
          type: data.notificationType || 'info',
          message: data.message,
          read: false,
          createdAt: data.timestamp || new Date().toISOString()
        }));
        break;
        
      case 'content_update':
        if (data.content) {
          store.dispatch(updateContentItem(data.content));
        }
        break;
        
      case 'project_update':
        if (data.project) {
          store.dispatch(updateProject(data.project));
        }
        break;
        
      case 'ad_update':
        if (data.ad) {
          store.dispatch(updateAd(data.ad));
        }
        break;
        
      // Add additional message types as needed
    }
  }
  
  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    const wasConnected = this.status === 'connected';
    this.status = 'disconnected';
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.log(`WebSocket closed: ${event.code} ${event.reason}`);
    
    // Don't reconnect if it was a normal closure or auth issue
    const isAuthError = event.code === 1008; // Policy violation - often used for auth errors
    const isNormalClosure = event.code === 1000 && event.reason === 'Client disconnecting';
    
    if (wasConnected && !isNormalClosure && !isAuthError && this.options.autoReconnect) {
      this.scheduleReconnect();
    } else if (isAuthError) {
      this.log('Authentication error, not reconnecting');
      // Possibly trigger a re-authentication flow here
    }
  }
  
  /**
   * Handle WebSocket error
   */
  private handleError(event: Event): void {
    this.status = 'error';
    console.error('WebSocket error:', event);
    
    // Force close and reconnect
    if (this.socket) {
      try {
        this.socket.close();
      } catch (e) {
        // Ignore errors during error handling
      }
      this.socket = null;
    }
    
    if (this.options.autoReconnect) {
      this.scheduleReconnect();
    }
  }
  
  /**
   * Schedule a reconnection attempt with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // Check if max reconnect attempts reached
    if (this.options.maxReconnectAttempts !== Infinity && 
        this.reconnectAttempts >= (this.options.maxReconnectAttempts || Infinity)) {
      this.log('Maximum reconnect attempts reached, giving up');
      return;
    }
    
    // Calculate reconnect delay with exponential backoff
    const delay = Math.min(
      (this.options.reconnectInterval || 1000) * Math.pow(this.options.reconnectDecay || 1.5, this.reconnectAttempts),
      this.options.maxReconnectInterval || 30000
    );
    
    this.reconnectAttempts++;
    this.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
    
    this.reconnectTimer = setTimeout(() => {
      this.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.options.maxReconnectAttempts || 'Infinity'})`);
      this.status = 'reconnecting';
      this.connect().catch(error => {
        this.log('Reconnection failed:', error);
      });
    }, delay);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export { websocketService };
export default websocketService;