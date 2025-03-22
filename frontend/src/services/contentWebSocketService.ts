import { TaskStatusResponse, ContentVariation } from './contentGenerationService';

// Import the base WebSocket implementation
import { websocketService } from './websocket';

export interface ContentGenerationEvent {
  event_type: 'generation_started' | 'generation_progress' | 'generation_completed' | 'generation_failed';
  task_id: string;
  data: Partial<TaskStatusResponse>;
  timestamp: string;
}

export interface QualityAssessmentEvent {
  event_type: 'assessment_started' | 'assessment_progress' | 'assessment_completed' | 'assessment_failed';
  content_id: string;
  task_id: string;
  data: any;
  timestamp: string;
}

export interface ABTestEvent {
  event_type: 'abtest_started' | 'abtest_updated' | 'abtest_completed' | 'abtest_failed';
  test_id: string;
  data: any;
  timestamp: string;
}

export type ContentWebSocketEvent = ContentGenerationEvent | QualityAssessmentEvent | ABTestEvent;

// Map of task IDs to their event handlers
type TaskEventHandlers = Map<
  string, 
  (eventData: ContentGenerationEvent) => void
>;

// Map of quality assessment IDs to their event handlers
type AssessmentEventHandlers = Map<
  string, 
  (eventData: QualityAssessmentEvent) => void
>;

// Map of AB test IDs to their event handlers
type ABTestEventHandlers = Map<
  string, 
  (eventData: ABTestEvent) => void
>;

class ContentWebSocketService {
  private taskEventHandlers: TaskEventHandlers = new Map();
  private assessmentEventHandlers: AssessmentEventHandlers = new Map();
  private abTestEventHandlers: ABTestEventHandlers = new Map();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;

    websocketService.addMessageHandler(this.handleWebSocketMessage);
    this.initialized = true;
  }

  private handleWebSocketMessage = (data: any) => {
    if (!data || !data.event_type) return;

    // Handle content generation events
    if (data.event_type.startsWith('generation_') && data.task_id) {
      const handler = this.taskEventHandlers.get(data.task_id);
      if (handler) {
        handler(data as ContentGenerationEvent);
      }
    }
    
    // Handle quality assessment events
    if (data.event_type.startsWith('assessment_') && data.content_id) {
      const handler = this.assessmentEventHandlers.get(data.content_id);
      if (handler) {
        handler(data as QualityAssessmentEvent);
      }
    }
    
    // Handle AB test events
    if (data.event_type.startsWith('abtest_') && data.test_id) {
      const handler = this.abTestEventHandlers.get(data.test_id);
      if (handler) {
        handler(data as ABTestEvent);
      }
    }
  };

  // Generation event subscription methods
  subscribeToGenerationTask(
    taskId: string,
    callback: (eventData: ContentGenerationEvent) => void
  ): () => void {
    this.taskEventHandlers.set(taskId, callback);
    return () => this.taskEventHandlers.delete(taskId);
  }

  // Quality assessment subscription methods
  subscribeToQualityAssessment(
    contentId: string,
    callback: (eventData: QualityAssessmentEvent) => void
  ): () => void {
    this.assessmentEventHandlers.set(contentId, callback);
    return () => this.assessmentEventHandlers.delete(contentId);
  }

  // AB test subscription methods
  subscribeToABTest(
    testId: string,
    callback: (eventData: ABTestEvent) => void
  ): () => void {
    this.abTestEventHandlers.set(testId, callback);
    return () => this.abTestEventHandlers.delete(testId);
  }

  // Connection management methods
  connect() {
    websocketService.connect();
  }

  disconnect() {
    websocketService.disconnect();
  }

  isConnected(): boolean {
    return websocketService.isConnected();
  }
}

// Create a singleton instance
export const contentWebSocketService = new ContentWebSocketService();