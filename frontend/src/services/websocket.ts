import { store } from '../store';
import { addNotification } from '../store/slices/uiSlice';
import { updateContentItem } from '../store/slices/contentSlice';
import { updateProject } from '../store/slices/projectsSlice';
import { updateAd } from '../store/slices/adsSlice';

// WebSocket connection status
type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private status: ConnectionStatus = 'disconnected';
  private messageHandlers: Record<string, ((data: any) => void)[]> = {};
  
  // Connect to the WebSocket server
  public connect(): void {
    if (this.socket) {
      this.disconnect();
    }
    
    // Get authentication token
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      this.status = 'error';
      return;
    }
    
    try {
      this.status = 'connecting';
      
      // Create WebSocket connection with auth token
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/v1/ws?token=${token}`;
      this.socket = new WebSocket(wsUrl);
      
      // Setup event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.status = 'error';
      this.scheduleReconnect();
    }
  }
  
  // Disconnect from the WebSocket server
  public disconnect(): void {
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      
      this.socket = null;
    }
    
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.status = 'disconnected';
  }
  
  // Get current connection status
  public getStatus(): ConnectionStatus {
    return this.status;
  }
  
  // Send a message to the server
  public send(message: any): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected, message not sent');
    }
  }
  
  // Add event handler for specific message types
  public on(type: string, handler: (data: any) => void): () => void {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    
    this.messageHandlers[type].push(handler);
    
    // Return function to remove this handler
    return () => {
      this.messageHandlers[type] = this.messageHandlers[type].filter(h => h !== handler);
    };
  }
  
  // Add a handler for all messages
  public addMessageHandler(handler: (data: any) => void): () => void {
    return this.on('all', handler);
  }
  
  // Check if websocket is connected
  public isConnected(): boolean {
    return this.status === 'connected' && this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }
  
  // Handle WebSocket open event
  private handleOpen(): void {
    this.status = 'connected';
    console.log('WebSocket connected');
    
    // Setup ping interval to keep connection alive
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 30000);
  }
  
  // Handle WebSocket messages
  private handleMessage(event: MessageEvent): void {
    try {
      const data = JSON.parse(event.data);
      const messageType = data.type;
      
      // Process standard message types
      if (messageType === 'pong') {
        // Ping response, do nothing
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
  
  // Dispatch messages to the Redux store
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
    }
  }
  
  // Handle WebSocket close event
  private handleClose(event: CloseEvent): void {
    this.status = 'disconnected';
    
    // Clear ping interval
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    console.log(`WebSocket closed: ${event.code} ${event.reason}`);
    
    // Schedule reconnect unless it was a normal closure
    if (event.code !== 1000) {
      this.scheduleReconnect();
    }
  }
  
  // Handle WebSocket error
  private handleError(event: Event): void {
    this.status = 'error';
    console.error('WebSocket error:', event);
    
    // Force close and reconnect
    if (this.socket) {
      this.socket.close();
    }
    
    this.scheduleReconnect();
  }
  
  // Schedule a reconnection attempt
  private scheduleReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    
    // Reconnect after 5 seconds
    this.reconnectTimer = setTimeout(() => {
      console.log('Attempting to reconnect WebSocket...');
      this.connect();
    }, 5000);
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export { websocketService };
export default websocketService;