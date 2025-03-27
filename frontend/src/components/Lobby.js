import React, { useEffect, useState, useRef } from 'react';
import { FiMic, FiMicOff, FiUser, FiVolume2, FiMessageCircle, FiSend } from 'react-icons/fi';
import io from 'socket.io-client';
import '../LobbyStyles.css';
import VolumeMeter from './VolumeMeter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
const MEDIA_SERVER_URL = process.env.REACT_APP_MEDIA_SERVER_URL || 'http://localhost:3002';

const Lobby = ({ token, username, userAvatar }) => {
  const [users, setUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [micVolume, setMicVolume] = useState(100);
  const [audioVolume, setAudioVolume] = useState(100);
  const [localVolume, setLocalVolume] = useState(0);
  const [userVolumes, setUserVolumes] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  // Refs
  const socketRef = useRef(null);
  const mediaSocketRef = useRef(null);
  const audioContextRef = useRef(null);
  const audioAnalyzerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioQueuesRef = useRef({});
  const audioProcessorsRef = useRef({});
  const chatRef = useRef(null);
  
  // Room ID (for now we'll just use "lobby" as the only room)
  const roomId = "lobby";

  // Connect to socket and set up audio processing when component mounts
  useEffect(() => {
    if (!token) return;

    // Connect to main socket.io server
    socketRef.current = io(`${API_URL}/lobby`, {
      auth: {
        token: `Bearer ${token}`
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Connect to media relay server
    mediaSocketRef.current = io(MEDIA_SERVER_URL, {
      reconnection: true,
      reconnectionAttempts: 5
    });

    // Set up main socket event listeners
    setupMainSocketEvents();
    
    // Set up media socket events
    setupMediaSocketEvents();
    
    // Set up audio processing
    setupAudioProcessing();

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      if (mediaSocketRef.current) {
        mediaSocketRef.current.disconnect();
      }
      
      // Stop local media stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      
      // Clean up audio processors
      Object.values(audioProcessorsRef.current).forEach(processor => {
        if (processor.audioContext) {
          processor.audioContext.close();
        }
      });
      
      // Stop media recorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [token, username, userAvatar]);

  const setupMainSocketEvents = () => {
    const socket = socketRef.current;
    
    socket.on('connect', () => {
      console.log('Connected to main server with socket ID:', socket.id);
      setConnectionStatus('connected');
      
      // Emit join lobby event
      socket.emit('joinLobby', {
        username,
        avatar: userAvatar
      });
    });
    
    socket.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to main server after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      
      // Re-emit join lobby event
      socket.emit('joinLobby', {
        username,
        avatar: userAvatar
      });
    });
    
    socket.on('connect_error', (error) => {
      console.error('Main socket connection error:', error);
      setConnectionStatus('error');
    });
    
    socket.on('disconnect', (reason) => {
      console.log('Disconnected from main server:', reason);
      setConnectionStatus('disconnected');
    });

    socket.on('duplicateSession', () => {
      alert('You have another active session open. Please use only one browser tab.');
      window.location.href = '/';
    });

    // Listen for users in the lobby
    socket.on('lobbyUsers', (lobbyUsers) => {
      console.log('Users in lobby:', lobbyUsers);
      
      // Set the users directly without depending on previous state
      setUsers(lobbyUsers.map(user => ({
        ...user,
        animationClass: 'user-joining'
      })));
      
      // After animation completes, remove the animation class
      setTimeout(() => {
        setUsers(prevUsers => 
          prevUsers.map(user => ({ ...user, animationClass: '' }))
        );
      }, 500);
    });

    // Listen for user join events
    socket.on('userJoined', (user) => {
      console.log('User joined:', user);
      
      // Add the new user with animation class
      setUsers(prevUsers => [
        ...prevUsers,
        { ...user, animationClass: 'user-joining' }
      ]);
      
      // After animation completes, remove the animation class
      setTimeout(() => {
        setUsers(prevUsers => 
          prevUsers.map(u => 
            u.id === user.id ? { ...u, animationClass: '' } : u
          )
        );
      }, 500);
    });

    // Listen for user leave events
    socket.on('userLeft', (userId) => {
      console.log('User left:', userId);
      
      // Add leaving animation class
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, animationClass: 'user-leaving' } 
            : user
        )
      );
      
      // Remove user after animation completes
      setTimeout(() => {
        setUsers(prevUsers => 
          prevUsers.filter(user => user.id !== userId)
        );
      }, 500);
      
      // Clean up audio processor for this user
      if (audioProcessorsRef.current[userId]) {
        if (audioProcessorsRef.current[userId].audioContext) {
          audioProcessorsRef.current[userId].audioContext.close();
        }
        delete audioProcessorsRef.current[userId];
      }
      
      // Clean up audio queue for this user
      if (audioQueuesRef.current[userId]) {
        delete audioQueuesRef.current[userId];
      }
    });

    // Add chat message handler
    socket.on('chatMessage', (message) => {
      // Don't add duplicate messages from self
      if (message.sender === username && message.id === Date.now().toString()) return;
      
      setChatMessages(prev => [...prev, message]);
      
      // Auto-scroll chat to bottom
      if (chatRef.current) {
        setTimeout(() => {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100);
      }
    });

    // Handle chat history when joining
    socket.on('chatHistory', (history) => {
      console.log(`Received chat history with ${history.length} messages`);
      setChatMessages(history);
      
      // Auto-scroll chat to bottom
      if (chatRef.current) {
        setTimeout(() => {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100);
      }
    });
    
    // Handle chat cleared event
    socket.on('chatCleared', (info) => {
      console.log('Chat has been cleared:', info);
      setChatMessages([{
        id: 'system-message',
        sender: 'System',
        text: info.message,
        timestamp: info.timestamp,
        isSystemMessage: true
      }]);
      
      // Auto-scroll chat to bottom
      if (chatRef.current) {
        setTimeout(() => {
          chatRef.current.scrollTop = chatRef.current.scrollHeight;
        }, 100);
      }
    });
  };
  
  const setupMediaSocketEvents = () => {
    const mediaSocket = mediaSocketRef.current;
    
    mediaSocket.on('connect', () => {
      console.log('Connected to media server with socket ID:', mediaSocket.id);
      
      // Join the room
      mediaSocket.emit('joinRoom', {
        roomId,
        userId: token, // Using token as userId for convenience
        username,
        avatar: userAvatar
      });
    });
    
    mediaSocket.on('disconnect', () => {
      console.log('Disconnected from media server');
      setConnectionStatus('media-disconnected');
    });
    
    mediaSocket.on('connect_error', (error) => {
      console.error('Media socket connection error:', error);
      setConnectionStatus('media-error');
    });
    
    mediaSocket.on('duplicateSession', () => {
      alert('You have another active session open. Please use only one browser tab.');
      window.location.href = '/';
    });
    
    mediaSocket.on('roomUsers', (roomUsers) => {
      console.log('Users in room from media server:', roomUsers);
      // We don't need to update users here as main server already does this
    });
    
    mediaSocket.on('userSpeaking', ({ id, speaking }) => {
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === id ? { ...user, speaking } : user
        )
      );
    });
    
    // Handle incoming audio chunks
    mediaSocket.on('audioChunk', ({ id, chunk }) => {
      processAudioChunk(id, chunk);
    });
  };
  
  const setupAudioProcessing = async () => {
    try {
      // Request user media with audio only
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('Local stream obtained with tracks:', stream.getTracks().map(t => t.kind).join(', '));
      setLocalStream(stream);
      
      // Mute audio by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      
      // Create audio context for local audio monitoring
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyzer for volume meter
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.minDecibels = -85;
      analyzer.maxDecibels = -10;
      analyzer.smoothingTimeConstant = 0.2;
      audioAnalyzerRef.current = analyzer;
      
      // Connect microphone to analyzer
      const microphone = audioContext.createMediaStreamSource(stream);
      microphone.connect(analyzer);
      
      // Create script processor for monitoring volume
      const bufferSize = 2048;
      const scriptProcessor = audioContext.createScriptProcessor(bufferSize, 1, 1);
      
      scriptProcessor.onaudioprocess = () => {
        const array = new Uint8Array(analyzer.frequencyBinCount);
        analyzer.getByteFrequencyData(array);
        
        // Get average volume
        let sum = 0;
        for (let i = 0; i < array.length; i++) {
          sum += array[i];
        }
        const avg = sum / array.length;
        const volume = Math.min(100, avg * 3); // Scale to 0-100
        
        setLocalVolume(volume);
      };
      
      // Connect the script processor
      scriptProcessor.connect(audioContext.destination);
      
      // Set up media recorder to capture audio chunks
      setupMediaRecorder(stream);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access your microphone. Please check your permissions and try again.');
    }
  };
  
  const setupMediaRecorder = (stream) => {
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus',
      audioBitsPerSecond: 32000 // Lower bitrate for performance
    });
    
    mediaRecorderRef.current = mediaRecorder;
    
    // Handle data available event
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0 && !isMuted && mediaSocketRef.current?.connected) {
        // Convert Blob to ArrayBuffer for transmission
        const reader = new FileReader();
        reader.onload = () => {
          const arrayBuffer = reader.result;
          // Send audio chunk to media server
          mediaSocketRef.current.emit('audioChunk', {
            chunk: arrayBuffer
          });
        };
        reader.readAsArrayBuffer(event.data);
      }
    };
    
    // Start recording in small chunks
    mediaRecorder.start(100); // 100ms chunks
  };
  
  // Process incoming audio chunks
  const processAudioChunk = (userId, chunk) => {
    // Initialize audio queue if needed
    if (!audioQueuesRef.current[userId]) {
      audioQueuesRef.current[userId] = [];
    }
    
    // Add chunk to queue
    audioQueuesRef.current[userId].push(chunk);
    
    // Initialize audio processor if needed
    if (!audioProcessorsRef.current[userId]) {
      initializeAudioProcessor(userId);
    }
    
    // Update volume indicator for this user
    updateUserVolume(userId, chunk);
  };
  
  // Initialize audio processor for a user
  const initializeAudioProcessor = (userId) => {
    try {
      // Create a new audio context
      const audioContext = new AudioContext();
      
      // Create a gain node to control volume
      const gainNode = audioContext.createGain();
      gainNode.gain.value = audioVolume / 100;
      gainNode.connect(audioContext.destination);
      
      // Create an analyzer for volume metering
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 512;
      analyzer.smoothingTimeConstant = 0.2;
      analyzer.connect(gainNode);
      
      // Store the processor
      audioProcessorsRef.current[userId] = {
        audioContext,
        gainNode,
        analyzer,
        nextTime: 0
      };
      
      // Start processing audio chunks
      processAudioQueue(userId);
    } catch (error) {
      console.error(`Error initializing audio processor for user ${userId}:`, error);
    }
  };
  
  // Process audio queue for a user
  const processAudioQueue = async (userId) => {
    const processor = audioProcessorsRef.current[userId];
    const queue = audioQueuesRef.current[userId];
    
    if (!processor || !queue || queue.length === 0) return;
    
    try {
      const chunk = queue.shift();
      
      // Convert ArrayBuffer to AudioBuffer
      const audioBuffer = await processor.audioContext.decodeAudioData(chunk);
      
      // Create source node
      const source = processor.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      
      // Connect source to analyzer
      source.connect(processor.analyzer);
      
      // Schedule playback
      const currentTime = processor.audioContext.currentTime;
      const startTime = Math.max(currentTime, processor.nextTime);
      
      source.start(startTime);
      processor.nextTime = startTime + audioBuffer.duration;
      
      // Process next chunk after this one finishes
      source.onended = () => {
        processAudioQueue(userId);
      };
    } catch (error) {
      console.error(`Error processing audio for user ${userId}:`, error);
      // Continue processing the queue even if there was an error
      processAudioQueue(userId);
    }
  };
  
  // Update volume indicator for a user
  const updateUserVolume = (userId, chunk) => {
    const processor = audioProcessorsRef.current[userId];
    if (!processor) return;
    
    // Create a temporary buffer to analyze volume
    const arrayBuffer = new Uint8Array(processor.analyzer.frequencyBinCount);
    processor.analyzer.getByteFrequencyData(arrayBuffer);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < arrayBuffer.length; i++) {
      sum += arrayBuffer[i];
    }
    const avg = sum / arrayBuffer.length || 0;
    
    // Check if volume is significant
    if (avg > 10) {
      const volume = Math.min(100, avg * 3); // Scale to 0-100
      setUserVolumes(prev => ({
        ...prev,
        [userId]: volume
      }));
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      
      // Log the current state for debugging
      console.log('Audio tracks:', audioTracks);
      console.log('Current mute state before toggle:', isMuted);
      
      // Toggle the mute state
      const newMuteState = !isMuted;
      setIsMuted(newMuteState);
      
      // Update the tracks' enabled property
      audioTracks.forEach(track => {
        track.enabled = !newMuteState;
        console.log(`Set audio track ${track.id} enabled to ${!newMuteState}`);
      });
      
      // Log the new state for verification
      console.log('New mute state after toggle:', newMuteState);
      
      // Notify other users about mute status
      if (mediaSocketRef.current) {
        mediaSocketRef.current.emit('muteUpdate', newMuteState);
      }
    } else {
      console.warn('Cannot toggle mute: No local stream available');
    }
  };

  // Handle mic volume change
  const handleMicVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setMicVolume(newVolume);
    
    if (localStream) {
      // Try to adjust gain if supported by the browser
      try {
        const audioTrack = localStream.getAudioTracks()[0];
        if (audioTrack && audioTrack.getSettings && audioTrack.applyConstraints) {
          const constraints = audioTrack.getConstraints();
          const newConstraints = {
            ...constraints,
            advanced: [{ gain: newVolume / 100 }]
          };
          
          // Apply the constraints with the new gain
          audioTrack.applyConstraints(newConstraints)
            .catch(error => console.error('Error applying volume constraints:', error));
        }
      } catch (error) {
        console.error('Error adjusting mic volume:', error);
      }
    }
  };
  
  // Handle audio volume change
  const handleAudioVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setAudioVolume(newVolume);
    
    // Update gain nodes for all audio processors
    Object.values(audioProcessorsRef.current).forEach(processor => {
      if (processor.gainNode) {
        processor.gainNode.gain.value = newVolume / 100;
      }
    });
  };

  // Send chat message
  const sendMessage = () => {
    if (!messageInput.trim() || !socketRef.current) return;
    
    const messageId = Date.now().toString();
    const newMessage = {
      id: messageId,
      sender: username,
      avatar: userAvatar,
      text: messageInput,
      timestamp: new Date().toISOString(),
    };
    
    // Add message to local state first to make UI feel responsive
    setChatMessages(prev => [...prev, newMessage]);
    
    // Emit message to server
    socketRef.current.emit('chatMessage', newMessage);
    
    // Clear input
    setMessageInput('');
    
    // Auto-scroll chat to bottom
    if (chatRef.current) {
      setTimeout(() => {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }, 100);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="lobby-container">
      <div className="users-wrapper">
        <div className="users-controls">
          <button
            className={`mute-button ${isMuted ? 'muted' : 'unmuted'}`}
            onClick={toggleMute}
            title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isMuted ? <FiMicOff /> : <FiMic />}
          </button>
          <div className="volume-controls">
            <label htmlFor="mic-volume">Mic</label>
            <input
              id="mic-volume"
              type="range"
              min="0"
              max="100"
              value={micVolume}
              onChange={handleMicVolumeChange}
            />
            <label htmlFor="audio-volume">Audio</label>
            <input
              id="audio-volume"
              type="range"
              min="0"
              max="100"
              value={audioVolume}
              onChange={handleAudioVolumeChange}
            />
          </div>
          <div className="connection-status">
            Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
          </div>
        </div>
        <div className="users-list">
          {users.map(user => (
            <div 
              key={user.id} 
              className={`user-card ${user.animationClass} ${user.speaking ? 'speaking' : ''}`}
            >
              <div className="avatar-container">
                <img 
                  src={user.avatar || '/default-avatar.png'} 
                  alt={user.username} 
                  className="user-avatar" 
                />
                {user.id === socketRef.current?.id && (
                  <div className="volume-indicator">
                    <VolumeMeter volume={localVolume} />
                  </div>
                )}
                {user.id !== socketRef.current?.id && (
                  <div className="volume-indicator">
                    <VolumeMeter volume={userVolumes[user.id] || 0} />
                  </div>
                )}
              </div>
              <div className="user-info">
                <span className="username">{user.username}</span>
                <span className="user-status">
                  {user.id === socketRef.current?.id ? 
                    (isMuted ? 'Muted' : 'Speaking') : 
                    (user.speaking ? 'Speaking' : 'Listening')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="chat-section">
        <div className="chat-header">
          <h3>Lobby Chat</h3>
        </div>
        <div className="chat-messages" ref={chatRef}>
          {chatMessages.length > 0 ? (
            chatMessages.map(msg => (
              <div 
                key={msg.id} 
                className={`chat-message ${msg.sender === username ? 'own-message' : ''} ${msg.isSystemMessage ? 'system-message' : ''}`}
              >
                {!msg.isSystemMessage ? (
                  <>
                    <div className="message-avatar">
                      <img src={msg.avatar || '/default-avatar.png'} alt={msg.sender} />
                    </div>
                    <div className="message-content">
                      <div className="message-header">
                        <span className="message-sender">{msg.sender}</span>
                        <span className="message-time">{formatTime(msg.timestamp)}</span>
                      </div>
                      <div className="message-text">{msg.text}</div>
                    </div>
                  </>
                ) : (
                  <div className="system-message-content">
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                    <div className="system-message-text">{msg.text}</div>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="no-messages">No messages yet</div>
          )}
        </div>
        <div className="chat-input-container">
          <input
            type="text"
            className="chat-input"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type a message..."
          />
          <button className="send-button" onClick={sendMessage}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby; 