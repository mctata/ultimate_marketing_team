/**
 * Calendar WebSocket Service
 * 
 * This service handles WebSocket connections for real-time content calendar updates.
 * It manages connection state, reconnection, and message handling for calendar events.
 */

import { getAuthToken } from './authService';

// Define message types
export interface CalendarWebSocketMessage {
  type: string;
  [key: string]: any;
}

export interface ConnectionStatusMessage extends CalendarWebSocketMessage {
  type: 'connection_status';
  status: 'connected' | 'disconnected';
  user_id: string;
  timestamp: string;
}

export interface ProjectJoinedMessage extends CalendarWebSocketMessage {
  type: 'project_joined';
  project_id: string;
  users: string[];
  user_details: any[];
  last_modified: string;
  timestamp: string;
}

export interface UserJoinedProjectMessage extends CalendarWebSocketMessage {
  type: 'user_joined_project';
  project_id: string;
  user_id: string;
  user_data: any;
  timestamp: string;
}

export interface UserLeftProjectMessage extends CalendarWebSocketMessage {
  type: 'user_left_project';
  project_id: string;
  user_id: string;
  timestamp: string;
}

export interface ContentLockedMessage extends CalendarWebSocketMessage {
  type: 'content_locked';
  project_id: string;
  content_id: string;
  locked_by: string;
  user_data: any;
  timestamp: string;
}

export interface ContentUnlockedMessage extends CalendarWebSocketMessage {
  type: 'content_unlocked';
  project_id: string;
  content_id: string;
  previously_locked_by: string;
  timestamp: string;
}

export interface CalendarChangeMessage extends CalendarWebSocketMessage {
  type: 'calendar_change';
  project_id: string;
  change_type: 'create' | 'update' | 'delete' | 'publish' | 'bulk_create' | 'bulk_update';
  content_id: string;
  data: any;
  source_user_id: string;
  timestamp: string;
}

export interface ErrorMessage extends CalendarWebSocketMessage {
  type: 'error';
  error: string;
  timestamp: string;
}

export interface OperationStatusMessage extends CalendarWebSocketMessage {
  type: 'operation_status';
  operation_id: string;
  status: 'started' | 'conflict' | 'completed';
  can_proceed?: boolean;
  timestamp: string;
}

// Define message handlers
export type MessageHandler = (message: CalendarWebSocketMessage) => void;

class CalendarWebSocketService {
  private static instance: CalendarWebSocketService;
  private socket: WebSocket | null = null;
  private isConnected = false;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private currentProjectId: string | null = null;
  private currentUserId: string | null = null;
  private pendingMessages: CalendarWebSocketMessage[] = [];
  private heartbeatInterval: any = null;

  private constructor() {
    // Initialize message handler sets for each message type
    this.messageHandlers.set('connection_status', new Set());
    this.messageHandlers.set('project_joined', new Set());
    this.messageHandlers.set('user_joined_project', new Set());
    this.messageHandlers.set('user_left_project', new Set());
    this.messageHandlers.set('content_locked', new Set());
    this.messageHandlers.set('content_unlocked', new Set());
    this.messageHandlers.set('content_force_unlocked', new Set());
    this.messageHandlers.set('calendar_change', new Set());
    this.messageHandlers.set('error', new Set());
    this.messageHandlers.set('operation_status', new Set());
    this.messageHandlers.set('pong', new Set());

    // Also set a handler for all messages
    this.messageHandlers.set('*', new Set());
  }

  /**
   * Get the singleton instance of CalendarWebSocketService
   */
  public static getInstance(): CalendarWebSocketService {
    if (!CalendarWebSocketService.instance) {
      CalendarWebSocketService.instance = new CalendarWebSocketService();
    }
    return CalendarWebSocketService.instance;
  }

  /**
   * Connect to the WebSocket server
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected || this.isConnecting) {
      return this.isConnected;
    }

    this.isConnecting = true;

    try {
      const token = await getAuthToken();
      if (!token) {
        console.error('Cannot connect to WebSocket: No authentication token available');
        this.isConnecting = false;
        return false;
      }

      // Determine WebSocket URL (adjust for production environments)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const baseWsUrl = `${protocol}//${host}`;
      const wsUrl = `${baseWsUrl}/ws/calendar?token=${token}`;

      // Create WebSocket instance
      this.socket = new WebSocket(wsUrl);

      // Setup event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);

      return new Promise<boolean>((resolve) => {
        // Setup a timeout for connection
        const connectionTimeout = setTimeout(() => {
          this.isConnecting = false;
          resolve(false);
        }, 10000); // 10 seconds timeout

        // Add a temporary handler for the connection status message
        const connectionHandler = (message: ConnectionStatusMessage) => {
          if (message.type === 'connection_status' && message.status === 'connected') {
            clearTimeout(connectionTimeout);
            this.messageHandlers.get('connection_status')?.delete(connectionHandler);
            this.isConnecting = false;
            this.currentUserId = message.user_id;
            resolve(true);
          }
        };

        this.messageHandlers.get('connection_status')?.add(connectionHandler);
      });
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
      this.isConnecting = false;
      return false;
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket) {
      // Clear heartbeat interval
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }

      // Leave project if joined
      if (this.currentProjectId) {
        this.leaveProject(this.currentProjectId);
      }

      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.currentProjectId = null;
    }
  }

  /**
   * Check if the socket is currently connected
   */
  public isSocketConnected(): boolean {
    return this.isConnected;
  }

  /**
   * Join a project for real-time updates
   */
  public async joinProject(projectId: string, userData?: any): Promise<boolean> {
    if (!this.isConnected) {
      const connected = await this.connect();
      if (!connected) {
        return false;
      }
    }

    // Leave current project if any
    if (this.currentProjectId && this.currentProjectId !== projectId) {
      await this.leaveProject(this.currentProjectId);
    }

    // Set current project
    this.currentProjectId = projectId;

    // Send join project message
    return this.sendMessage({
      type: 'join_project',
      project_id: projectId,
      user_data: userData || {}
    });
  }

  /**
   * Leave a project
   */
  public leaveProject(projectId: string): boolean {
    if (this.currentProjectId === projectId) {
      this.currentProjectId = null;
    }

    return this.sendMessage({
      type: 'leave_project',
      project_id: projectId
    });
  }

  /**
   * Lock content for editing
   */
  public lockContent(contentId: string, userData?: any): boolean {
    return this.sendMessage({
      type: 'lock_content',
      content_id: contentId,
      user_data: userData || {}
    });
  }

  /**
   * Unlock content
   */
  public unlockContent(contentId: string): boolean {
    return this.sendMessage({
      type: 'unlock_content',
      content_id: contentId
    });
  }

  /**
   * Force unlock content (admin only)
   */
  public forceUnlockContent(contentId: string): boolean {
    return this.sendMessage({
      type: 'force_unlock_content',
      content_id: contentId
    });
  }

  /**
   * Start an operation (for conflict detection)
   */
  public startOperation(operationId: string, operationType: string, contentId: string, data?: any): boolean {
    return this.sendMessage({
      type: 'start_operation',
      operation_id: operationId,
      operation_type: operationType,
      content_id: contentId,
      data: data || {}
    });
  }

  /**
   * Complete an operation
   */
  public completeOperation(operationId: string, contentId: string): boolean {
    return this.sendMessage({
      type: 'complete_operation',
      operation_id: operationId,
      content_id: contentId
    });
  }

  /**
   * Register a message handler
   */
  public on(messageType: string, handler: MessageHandler): void {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, new Set());
    }
    this.messageHandlers.get(messageType)?.add(handler);
  }

  /**
   * Unregister a message handler
   */
  public off(messageType: string, handler: MessageHandler): void {
    this.messageHandlers.get(messageType)?.delete(handler);
  }

  /**
   * Send a message to the WebSocket server
   */
  private sendMessage(message: CalendarWebSocketMessage): boolean {
    if (this.socket && this.isConnected) {
      try {
        this.socket.send(JSON.stringify(message));
        return true;
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
        return false;
      }
    } else {
      // Queue message to be sent when connected
      this.pendingMessages.push(message);
      
      // Try to connect if not already connecting
      if (!this.isConnecting) {
        this.connect();
      }
      
      return false;
    }
  }

  /**
   * Handle WebSocket open event
   */
  private handleOpen(event: Event): void {
    console.log('WebSocket connected');
    this.isConnected = true;
    this.isConnecting = false;
    this.reconnectAttempts = 0;

    // Start heartbeat to keep connection alive
    this.startHeartbeat();

    // Send pending messages
    while (this.pendingMessages.length > 0) {
      const message = this.pendingMessages.shift();
      if (message) {
        this.sendMessage(message);
      }
    }
  }

  /**
   * Handle WebSocket message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as CalendarWebSocketMessage;
      
      // Call specific handlers for this message type
      const handlers = this.messageHandlers.get(message.type);
      if (handlers) {
        handlers.forEach(handler => handler(message));
      }
      
      // Call wildcard handlers
      const wildcardHandlers = this.messageHandlers.get('*');
      if (wildcardHandlers) {
        wildcardHandlers.forEach(handler => handler(message));
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    this.isConnected = false;
    this.isConnecting = false;
    
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Attempt to reconnect if closed unexpectedly
    if (event.code !== 1000) { // 1000 is normal closure
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event): void {
    console.error('WebSocket error:', event);
    this.isConnected = false;
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Maximum reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Attempting to reconnect in ${delay / 1000} seconds...`);
    
    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.sendMessage({ type: 'ping' });
      }
    }, 30000); // Send ping every 30 seconds
  }

  /**
   * Get the current user ID
   */
  public getCurrentUserId(): string | null {
    return this.currentUserId;
  }

  /**
   * Get the current project ID
   */
  public getCurrentProjectId(): string | null {
    return this.currentProjectId;
  }
}

export default CalendarWebSocketService;