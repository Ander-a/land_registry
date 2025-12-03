import { io } from 'socket.io-client';

/**
 * WebSocket Service
 * 
 * Real-time communication service using Socket.IO.
 * Features:
 * - Connect/disconnect management
 * - Authentication
 * - Real-time notifications
 * - Live validation updates
 * - Live consensus updates
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.authenticated = false;
    this.userId = null;
    this.listeners = {};
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Connect to WebSocket server
   * @param {string} url - WebSocket server URL (default: http://localhost:8000/ws)
   */
  connect(url = 'http://localhost:8000/ws') {
    if (this.socket && this.connected) {
      console.log('Already connected to WebSocket');
      return;
    }

    try {
      this.socket = io(url, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: this.maxReconnectAttempts
      });

      this.setupEventHandlers();
      console.log('Connecting to WebSocket server...');
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }

  /**
   * Setup Socket.IO event handlers
   */
  setupEventHandlers() {
    // Connection events
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Trigger connect callback
      this.trigger('connect', { connected: true });
      
      // Re-authenticate if we have user ID
      if (this.userId) {
        this.authenticate(this.userId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket:', reason);
      this.connected = false;
      this.authenticated = false;
      this.trigger('disconnect', { reason });
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.reconnectAttempts++;
      this.trigger('connect_error', { error, attempts: this.reconnectAttempts });
    });

    // Authentication events
    this.socket.on('connection_established', (data) => {
      console.log('Connection established:', data);
    });

    this.socket.on('authenticated', (data) => {
      console.log('Authenticated:', data);
      this.authenticated = true;
      this.trigger('authenticated', data);
    });

    this.socket.on('auth_error', (data) => {
      console.error('Authentication error:', data);
      this.authenticated = false;
      this.trigger('auth_error', data);
    });

    // Notification events
    this.socket.on('new_notification', (notification) => {
      console.log('New notification:', notification);
      this.trigger('new_notification', notification);
    });

    this.socket.on('validation_received', (data) => {
      console.log('Validation received:', data);
      this.trigger('validation_received', data);
    });

    this.socket.on('consensus_reached', (data) => {
      console.log('Consensus reached:', data);
      this.trigger('consensus_reached', data);
    });

    this.socket.on('badge_earned', (data) => {
      console.log('Badge earned:', data);
      this.trigger('badge_earned', data);
    });

    this.socket.on('trust_score_update', (data) => {
      console.log('Trust score update:', data);
      this.trigger('trust_score_update', data);
    });

    // Live update events
    this.socket.on('validation_count_update', (data) => {
      console.log('Validation count update:', data);
      this.trigger('validation_count_update', data);
    });

    this.socket.on('consensus_update', (data) => {
      console.log('Consensus update:', data);
      this.trigger('consensus_update', data);
    });

    // Status events
    this.socket.on('pong', () => {
      // Keep-alive response
    });

    this.socket.on('status', (data) => {
      console.log('WebSocket status:', data);
      this.trigger('status', data);
    });
  }

  /**
   * Authenticate with the server
   * @param {string} userId - User ID
   * @param {string} token - JWT token (optional)
   */
  authenticate(userId, token = null) {
    if (!this.socket || !this.connected) {
      console.error('Cannot authenticate: not connected');
      return;
    }

    this.userId = userId;
    
    // Get token from localStorage if not provided
    if (!token) {
      token = localStorage.getItem('token');
    }

    this.socket.emit('authenticate', {
      user_id: userId,
      token: token
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.authenticated = false;
      this.userId = null;
      console.log('Disconnected from WebSocket');
    }
  }

  /**
   * Register an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  /**
   * Remove an event listener
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners[event]) return;
    
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  /**
   * Trigger event listeners
   * @param {string} event - Event name
   * @param {any} data - Event data
   */
  trigger(event, data) {
    if (!this.listeners[event]) return;
    
    this.listeners[event].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
      }
    });
  }

  /**
   * Send ping to server (keep-alive)
   */
  ping() {
    if (this.socket && this.connected) {
      this.socket.emit('ping');
    }
  }

  /**
   * Get server status
   */
  getStatus() {
    if (this.socket && this.connected) {
      this.socket.emit('get_status');
    }
  }

  /**
   * Check if connected
   * @returns {boolean} Connection status
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Check if authenticated
   * @returns {boolean} Authentication status
   */
  isAuthenticated() {
    return this.authenticated;
  }

  /**
   * Get connection info
   * @returns {object} Connection information
   */
  getConnectionInfo() {
    return {
      connected: this.connected,
      authenticated: this.authenticated,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Start keep-alive ping interval
   * @param {number} interval - Ping interval in milliseconds (default: 30000)
   */
  startKeepAlive(interval = 30000) {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(() => {
      if (this.connected) {
        this.ping();
      }
    }, interval);
  }

  /**
   * Stop keep-alive ping interval
   */
  stopKeepAlive() {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }
}

// Export singleton instance
const websocketService = new WebSocketService();

// Auto-connect when token exists
const token = localStorage.getItem('token');
const user = localStorage.getItem('user');
if (token && user) {
  try {
    const userData = JSON.parse(user);
    websocketService.connect();
    // Will authenticate on connect event
  } catch (error) {
    console.error('Failed to parse user data:', error);
  }
}

export default websocketService;
