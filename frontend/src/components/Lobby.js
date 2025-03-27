import React, { useEffect, useState, useRef } from 'react';
import { FiMic, FiMicOff, FiUser, FiVolume2, FiMessageCircle, FiSend } from 'react-icons/fi';
import io from 'socket.io-client';
import '../LobbyStyles.css';
import VolumeMeter from './VolumeMeter';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Lobby = ({ token, username, userAvatar }) => {
  const [users, setUsers] = useState([]);
  const [isMuted, setIsMuted] = useState(true);
  const [localStream, setLocalStream] = useState(null);
  const [peerConnections, setPeerConnections] = useState({});
  const [micVolume, setMicVolume] = useState(100);
  const [audioVolume, setAudioVolume] = useState(100);
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const audioElements = useRef({});
  const audioContexts = useRef({});
  const audioGainNode = useRef(null);
  const [localVolume, setLocalVolume] = useState(0);
  const [userVolumes, setUserVolumes] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const chatRef = useRef(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  // Connect to socket and set up WebRTC when component mounts
  useEffect(() => {
    if (!token) return;

    // Connect to socket.io server with more options
    socketRef.current = io(`${API_URL}/lobby`, {
      auth: {
        token: `Bearer ${token}`
      },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Set up socket event listeners
    socketRef.current.on('connect', () => {
      console.log('Connected to lobby with socket ID:', socketRef.current.id);
      setConnectionStatus('connected');
      
      // Emit join lobby event
      socketRef.current.emit('joinLobby', {
        username,
        avatar: userAvatar
      });
    });
    
    // Handle reconnection
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to lobby after ${attemptNumber} attempts`);
      setConnectionStatus('connected');
      
      // Re-emit join lobby event
      socketRef.current.emit('joinLobby', {
        username,
        avatar: userAvatar
      });
    });
    
    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionStatus('error');
    });
    
    // Handle disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected from lobby:', reason);
      setConnectionStatus('disconnected');
    });

    // Handle duplicate session
    socketRef.current.on('duplicateSession', () => {
      alert('You have another active session open. Please use only one browser tab.');
      window.location.href = '/';
    });

    // Listen for users in the lobby
    socketRef.current.on('lobbyUsers', (lobbyUsers) => {
      console.log('Users in lobby:', lobbyUsers);
      console.log('My socket ID:', socketRef.current.id);
      
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
    socketRef.current.on('userJoined', (user) => {
      console.log('User joined:', user);
      console.log('My socket ID:', socketRef.current.id);
      
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
    socketRef.current.on('userLeft', (userId) => {
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
      
      // Close and clean up peer connection if exists
      if (peerConnections[userId]) {
        peerConnections[userId].close();
        setPeerConnections(prev => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    });

    // Set up WebRTC events
    setupWebRTC();

    // Handle call failure
    socketRef.current.on('callFailed', ({ to, reason }) => {
      console.log(`Call to user ${to} failed: ${reason}`);
      
      // Clean up failed peer connection
      if (peerConnections[to]) {
        peerConnections[to].close();
        setPeerConnections(prev => {
          const updated = { ...prev };
          delete updated[to];
          return updated;
        });
      }
      
      // Retry if the user is still in the lobby
      const userStillInLobby = users.some(user => user.id === to);
      if (userStillInLobby) {
        console.log(`User ${to} is still in lobby, retrying call in 2 seconds`);
        setTimeout(() => callUser(to), 2000);
      }
    });

    // Add chat message handler
    socketRef.current.on('chatMessage', (message) => {
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
    socketRef.current.on('chatHistory', (history) => {
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
    socketRef.current.on('chatCleared', (info) => {
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

    // Add this handler for debugging connection issues
    window.addEventListener('online', () => {
      console.log('Browser detected network connection restored');
      if (socketRef.current) {
        console.log('Reconnecting to socket after network restore');
        socketRef.current.connect();
      }
    });

    // Clean up on component unmount
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting from lobby');
        socketRef.current.disconnect();
      }
      
      // Close all peer connections
      Object.values(peerConnections).forEach(connection => {
        if (connection) connection.close();
      });
      
      // Stop local media stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Clean up audio elements and contexts
      Object.values(audioElements.current).forEach(audio => {
        if (audio) {
          audio.srcObject = null;
          audio.remove();
        }
      });
      
      Object.values(audioContexts.current).forEach(context => {
        if (context) {
          context.close();
        }
      });
    };
  }, [token, username, userAvatar]); // Only re-run if these dependencies change

  const setupWebRTC = async () => {
    try {
      console.log('Setting up WebRTC - requesting user media...');
      
      // Request user media with audio only - with specific audio constraints
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }, 
        video: false 
      });
      
      console.log('Local stream obtained with tracks:', stream.getTracks().map(t => t.kind).join(', '));
      setLocalStream(stream);
      
      // Mute audio by default but make sure tracks exist and are created
      stream.getAudioTracks().forEach(track => {
        console.log('Setting audio track enabled to false (muted)');
        track.enabled = false;
      });

      // Only set up WebRTC events once we have a stream
      setupWebRTCEvents();
      
      // Call existing users only once the stream is ready
      if (socketRef.current) {
        const lobbyUsers = users.filter(user => user.id !== socketRef.current.id);
        console.log(`Ready to call ${lobbyUsers.length} existing users in lobby`);
        
        // Introduce a delay to ensure everything is initialized
        setTimeout(() => {
          lobbyUsers.forEach((user, index) => {
            setTimeout(() => callUser(user.id), index * 1000);
          });
        }, 1000);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setConnectionStatus('audio-error');
      alert('Could not access your microphone. Please check your permissions and try again.');
    }
  };
  
  // Separate function to set up WebRTC event handlers
  const setupWebRTCEvents = () => {
    if (!socketRef.current) return;
    
    // Set up WebRTC peer connections and handlers
    socketRef.current.on('callUser', async ({ from, signal }) => {
      console.log(`Received call from ${from} with signal type ${signal.type}`);
      
      // Store the signal temporarily if the connection isn't ready
      const pendingSignal = { from, signal, type: 'offer' };
      
      // Clean up any existing connection first to prevent state issues
      if (peerConnections[from]) {
        console.log(`Cleaning up existing connection with ${from} before creating new one`);
        try {
          peerConnections[from].close();
        } catch (err) {
          console.error(`Error closing existing connection with ${from}:`, err);
        }
        
        // Update our state
        setPeerConnections(prev => {
          const updated = {...prev};
          delete updated[from];
          return updated;
        });
        
        // Clean up any existing audio element
        if (audioElements.current[from]) {
          try {
            audioElements.current[from].srcObject = null;
            audioElements.current[from].remove();
            delete audioElements.current[from];
          } catch (err) {
            console.error(`Error cleaning up audio element for ${from}:`, err);
          }
        }
      }
      
      // Make sure we have a local stream before proceeding
      if (!localStream) {
        console.error("Cannot answer call: No local stream available");
        return;
      }
      
      // Create new peer connection for incoming call
      const peerConnection = createPeerConnection(from);
      
      try {
        // Add local stream to peer connection
        localStream.getTracks().forEach(track => {
          console.log(`Adding ${track.kind} track to peer connection for ${from}`);
          try {
            peerConnection.addTrack(track, localStream);
          } catch (err) {
            console.error(`Error adding track to connection with ${from}:`, err);
          }
        });
        
        // Set remote description from signal
        console.log(`Setting remote description for ${from}`);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(signal));
        
        // Create answer
        console.log(`Creating answer for ${from}`);
        const answer = await peerConnection.createAnswer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        
        // Set local description
        console.log(`Setting local description for ${from}`);
        await peerConnection.setLocalDescription(answer);
        
        // Send answer to caller
        console.log(`Sending answer to ${from}`);
        socketRef.current.emit('answerCall', {
          to: from,
          signal: peerConnection.localDescription
        });
      } catch (err) {
        console.error(`Error processing call from ${from}:`, err);
      }
    });
    
    socketRef.current.on('callAccepted', ({ from, signal }) => {
      // Get existing peer connection
      const peerConnection = peerConnections[from];
      
      if (peerConnection) {
        console.log(`Call accepted by ${from}, setting remote description`);
        // Set remote description from signal
        peerConnection.setRemoteDescription(new RTCSessionDescription(signal))
          .then(() => {
            console.log(`Remote description set for ${from}`);
          })
          .catch(err => {
            console.error(`Error setting remote description for ${from}:`, err);
          });
      } else {
        console.warn(`Received answer from ${from} but no peer connection exists`);
      }
    });
    
    // Handle ICE candidates from other peers
    socketRef.current.on('iceCandidate', ({ from, candidate }) => {
      console.log(`Received ICE candidate from ${from}`);
      const peerConnection = peerConnections[from];
      
      // If we don't have a connection yet, buffer the ICE candidates
      if (!peerConnection) {
        console.log(`No peer connection for ${from} yet, buffering ICE candidate`);
        return; // We'll just drop these for now as we recreate connections frequently
      }
      
      if (peerConnection.signalingState !== 'closed') {
        peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
          .then(() => console.log(`Added ICE candidate for ${from}`))
          .catch(error => console.error(`Error adding ICE candidate for ${from}:`, error));
      } else {
        console.warn(`Cannot add ICE candidate for ${from}: connection closed or not available`);
      }
    });
  };

  const createPeerConnection = (userId) => {
    console.log(`Creating peer connection for ${userId}`);
    
    // If we have an existing connection, clean it up properly
    if (peerConnections[userId]) {
      try {
        const oldConnection = peerConnections[userId];
        console.log(`Closing existing peer connection for ${userId}`, oldConnection.signalingState);
        oldConnection.onicecandidate = null;
        oldConnection.ontrack = null;
        oldConnection.onnegotiationneeded = null;
        oldConnection.oniceconnectionstatechange = null;
        oldConnection.close();
      } catch (err) {
        console.error(`Error closing existing peer connection for ${userId}:`, err);
      }
    }
    
    // Create new RTCPeerConnection with expanded ICE servers
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        // Free TURN servers - using public test servers
        {
          urls: 'turn:relay.metered.ca:80',
          username: 'e8c6d63db6f3fc61a8b1e239',
          credential: 'hkA2QQkJhYkNvCOE'
        },
        {
          urls: 'turn:relay.metered.ca:443',
          username: 'e8c6d63db6f3fc61a8b1e239',
          credential: 'hkA2QQkJhYkNvCOE'
        },
        {
          urls: 'turn:relay.metered.ca:443?transport=tcp',
          username: 'e8c6d63db6f3fc61a8b1e239',
          credential: 'hkA2QQkJhYkNvCOE'
        }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      sdpSemantics: 'unified-plan'
    });
    
    // Set up ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Generated ICE candidate for connection with ${userId}`);
        socketRef.current.emit('iceCandidate', {
          to: userId,
          candidate: event.candidate
        });
      } else {
        console.log(`ICE candidate generation completed for ${userId}`);
      }
    };
    
    // Log negotiation needed events
    peerConnection.onnegotiationneeded = () => {
      console.log(`Negotiation needed for connection with ${userId}`);
    };
    
    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${userId}:`, peerConnection.iceConnectionState);
      console.log(`Connection state with ${userId}:`, peerConnection.connectionState);
      console.log(`Signaling state with ${userId}:`, peerConnection.signalingState);
      
      // Update the UI based on connection state
      if (peerConnection.iceConnectionState === 'connected' || 
          peerConnection.iceConnectionState === 'completed') {
        console.log(`Connection established with ${userId}`);
      }
      
      // If the connection was disconnected, try to restart ICE
      if (peerConnection.iceConnectionState === 'disconnected' || 
          peerConnection.iceConnectionState === 'failed') {
        console.log(`Attempting to restart ICE for connection with ${userId}`);
        try {
          peerConnection.restartIce();
        } catch (err) {
          console.error(`Error restarting ICE for ${userId}:`, err);
        }
      }
    };
    
    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      if (!event.streams || event.streams.length === 0) {
        console.warn(`Received track from ${userId} but no stream available`);
        return;
      }
      
      // Handle remote audio stream
      console.log(`Received track from ${userId}`, event.streams[0]);
      console.log(`Track settings:`, event.track.getSettings());
      
      // Use the first stream
      const stream = event.streams[0];
      
      // Create or update audio element immediately
      try {
        if (audioElements.current[userId]) {
          console.log(`Updating existing audio element for ${userId}`);
          audioElements.current[userId].srcObject = stream;
          audioElements.current[userId].volume = audioVolume / 100;
        } else {
          console.log(`Creating new audio element for ${userId}`);
          const audioEl = document.createElement('audio');
          audioEl.id = `audio-${userId}`;
          audioEl.autoplay = true;
          audioEl.playsInline = true; // Important for iOS
          audioEl.controls = true; // Enable controls for debugging
          audioEl.style.position = 'fixed';
          audioEl.style.bottom = '0';
          audioEl.style.right = '0';
          audioEl.style.zIndex = '9999';
          audioEl.style.width = '200px';
          audioEl.srcObject = stream;
          audioEl.volume = audioVolume / 100;
          audioEl.muted = false;
          
          // Add event listeners for debugging
          audioEl.addEventListener('play', () => console.log(`Audio element for ${userId} started playing`));
          audioEl.addEventListener('pause', () => console.log(`Audio element for ${userId} paused`));
          audioEl.addEventListener('canplay', () => console.log(`Audio element for ${userId} can play`));
          audioEl.addEventListener('canplaythrough', () => console.log(`Audio element for ${userId} can play through`));
          audioEl.addEventListener('error', (e) => console.error(`Audio element error for ${userId}:`, e));
          
          // Add the element to the DOM
          document.body.appendChild(audioEl);
          audioElements.current[userId] = audioEl;
          
          // Force play with retry mechanism
          const playWithRetry = (retries = 5) => {
            console.log(`Attempting to play audio from ${userId}, ${retries} attempts left`);
            audioEl.play()
              .then(() => console.log(`Successfully playing audio from ${userId}`))
              .catch(error => {
                console.error(`Error playing audio from ${userId}:`, error);
                if (retries > 0) {
                  console.log(`Retrying playback for ${userId} in 1 second`);
                  setTimeout(() => playWithRetry(retries - 1), 1000);
                } else {
                  console.error(`Failed to play audio after multiple attempts for ${userId}`);
                  // Try with user interaction simulation as a last resort
                  document.addEventListener('click', function playOnClick() {
                    audioEl.play()
                      .then(() => {
                        console.log(`Played audio after user interaction for ${userId}`);
                        document.removeEventListener('click', playOnClick);
                      })
                      .catch(e => console.error(`Still couldn't play audio for ${userId}:`, e));
                  }, { once: true });
                }
              });
          };
          
          playWithRetry();
        }
        
        // Set up audio analyzer to detect speaking
        if (!audioContexts.current[userId]) {
          try {
            // Create audio analyzer only after ensuring the stream and element exist
            console.log(`Setting up audio analyzer for ${userId}`);
            const audioContext = new AudioContext();
            audioContexts.current[userId] = audioContext;
            const source = audioContext.createMediaStreamSource(stream);
            const analyzer = audioContext.createAnalyser();
            analyzer.fftSize = 512;
            analyzer.minDecibels = -85;
            analyzer.maxDecibels = -10;
            analyzer.smoothingTimeConstant = 0.2;
            source.connect(analyzer);
            
            // Check audio levels to detect speaking
            const dataArray = new Uint8Array(analyzer.frequencyBinCount);
            let speakingTimeout;
            
            const checkAudioLevel = () => {
              if (!audioContexts.current[userId]) return; // Stop if context was closed
              
              analyzer.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              const volume = Math.min(100, average * 3); // Scale to 0-100
              
              // Debug level
              if (average > 0) {
                console.log(`Audio level for ${userId}: ${average.toFixed(2)}, volume: ${volume.toFixed(2)}`);
              }
              
              // Update volume level for this user
              setUserVolumes(prev => ({
                ...prev,
                [userId]: volume
              }));
              
              // Consider speaking if average level is above threshold
              if (average > 20) {
                // If user is speaking, update UI and clear timeout
                clearTimeout(speakingTimeout);
                setUsers(prevUsers => 
                  prevUsers.map(user => 
                    user.id === userId ? { ...user, speaking: true } : user
                  )
                );
                
                // Set timeout to stop speaking indication
                speakingTimeout = setTimeout(() => {
                  setUsers(prevUsers => 
                    prevUsers.map(user => 
                      user.id === userId ? { ...user, speaking: false } : user
                    )
                  );
                }, 500);
              }
              
              requestAnimationFrame(checkAudioLevel);
            };
            
            checkAudioLevel();
          } catch (error) {
            console.error(`Error setting up audio analyzer for ${userId}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error handling track from ${userId}:`, error);
      }
    };
    
    // Store the peer connection
    setPeerConnections(prev => ({
      ...prev,
      [userId]: peerConnection
    }));
    
    return peerConnection;
  };
  
  const callUser = async (userId) => {
    if (!localStream) {
      console.error("Cannot call user: No local stream available");
      return;
    }
    
    try {
      console.log(`Initiating call to user ${userId}`);
      
      // Ensure we're still connected to the socket
      if (!socketRef.current || !socketRef.current.connected) {
        console.error("Cannot call user: Socket not connected");
        return;
      }
      
      // Create a fresh peer connection
      const peerConnection = createPeerConnection(userId);
      
      // Add all tracks from local stream to peer connection
      localStream.getTracks().forEach(track => {
        console.log(`Adding ${track.kind} track to peer connection for ${userId}`);
        try {
          peerConnection.addTrack(track, localStream);
        } catch (error) {
          console.error(`Error adding track to connection with ${userId}:`, error);
        }
      });
      
      // Create offer
      console.log(`Creating offer for ${userId}`);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      // Set local description
      console.log(`Setting local description for ${userId}`);
      await peerConnection.setLocalDescription(offer);
      
      // Give time for ICE gathering before sending the offer
      // This helps ensure more ICE candidates are included in the initial offer
      setTimeout(() => {
        if (!peerConnection || peerConnection.signalingState === 'closed') {
          console.log(`Connection closed before offer could be sent to ${userId}`);
          return;
        }
        
        const currentOffer = peerConnection.localDescription;
        if (!currentOffer) {
          console.error(`No local description available for ${userId}`);
          return;
        }
        
        console.log(`Sending offer to ${userId}`);
        socketRef.current.emit('callUser', {
          to: userId,
          signal: currentOffer
        });
      }, 1000); // Wait 1 second for ICE gathering
    } catch (error) {
      console.error(`Error calling user ${userId}:`, error);
    }
  };

  // Toggle mute state with improved debugging
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
      
      // Broadcast mute status to update UI for other users
      if (socketRef.current) {
        socketRef.current.emit('speakingUpdate', !newMuteState);
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
      // Get the audio track
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        // Create a gain setting for the audio track
        const constraints = audioTrack.getConstraints();
        const newConstraints = {
          ...constraints,
          advanced: [{ gain: newVolume / 100 }]
        };
        
        // Apply the constraints with the new gain
        audioTrack.applyConstraints(newConstraints)
          .catch(error => console.error('Error applying volume constraints:', error));
      }
    }
  };
  
  // Handle audio volume change
  const handleAudioVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setAudioVolume(newVolume);
    
    // Update volume for all audio elements
    Object.values(audioElements.current).forEach(audio => {
      if (audio) {
        audio.volume = newVolume / 100;
      }
    });
  };

  // Set up local volume meter
  useEffect(() => {
    if (!localStream) return;
    
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(localStream);
    microphone.connect(analyser);
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const checkVolume = () => {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const average = sum / bufferLength;
      const volume = Math.min(100, average * 3); // Scale to 0-100
      setLocalVolume(volume);
      
      requestAnimationFrame(checkVolume);
    };
    
    const animationFrame = requestAnimationFrame(checkVolume);
    
    return () => {
      cancelAnimationFrame(animationFrame);
      if (microphone) microphone.disconnect();
      if (audioContext) audioContext.close();
    };
  }, [localStream]);

  // Periodically check connections and retry failed ones
  useEffect(() => {
    if (!socketRef.current) return;
    
    const checkAndRetryConnections = () => {
      console.log('Checking and retrying peer connections...');
      
      // Go through all users who should be connected
      const otherUsers = users.filter(user => user.id !== socketRef.current?.id);
      
      for (const user of otherUsers) {
        const peerConnection = peerConnections[user.id];
        
        if (!peerConnection) {
          // No connection exists, create one
          console.log(`No connection exists for ${user.id}, initiating call`);
          setTimeout(() => callUser(user.id), 500);
        } else if (peerConnection.connectionState === 'failed' || 
                   peerConnection.connectionState === 'disconnected' ||
                   peerConnection.iceConnectionState === 'failed' ||
                   peerConnection.iceConnectionState === 'disconnected') {
          // Connection exists but is in a bad state, recreate it
          console.log(`Connection to ${user.id} is in bad state (${peerConnection.connectionState}/${peerConnection.iceConnectionState}), recreating`);
          
          // Close and recreate connection
          peerConnection.close();
          setTimeout(() => callUser(user.id), 1000);
        }
      }
    };
    
    const interval = setInterval(checkAndRetryConnections, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [socketRef.current, users, peerConnections]);

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
          <div className="connection-controls">
            <div className="connection-status">
              Status: <span className={`status-${connectionStatus}`}>{connectionStatus}</span>
            </div>
            <button 
              className="reconnect-button"
              onClick={() => {
                // Clean up all connections
                console.log("Manual reconnect initiated");
                Object.keys(peerConnections).forEach(peerId => {
                  if (peerConnections[peerId]) {
                    console.log(`Closing connection to ${peerId}`);
                    try {
                      peerConnections[peerId].close();
                    } catch (e) {
                      console.error(`Error closing connection to ${peerId}:`, e);
                    }
                  }
                });
                
                // Clear connections state
                setPeerConnections({});
                
                // Reset audio elements
                Object.keys(audioElements.current).forEach(id => {
                  if (audioElements.current[id]) {
                    try {
                      audioElements.current[id].srcObject = null;
                      audioElements.current[id].remove();
                    } catch (e) {
                      console.error(`Error removing audio element for ${id}:`, e);
                    }
                  }
                });
                audioElements.current = {};
                
                // Reset audio contexts
                Object.keys(audioContexts.current).forEach(id => {
                  if (audioContexts.current[id]) {
                    try {
                      audioContexts.current[id].close();
                    } catch (e) {
                      console.error(`Error closing audio context for ${id}:`, e);
                    }
                  }
                });
                audioContexts.current = {};
                
                // Call all users again with slight delay
                setTimeout(() => {
                  users.forEach((user, index) => {
                    if (user.id !== socketRef.current?.id) {
                      setTimeout(() => callUser(user.id), index * 1000);
                    }
                  });
                }, 1000);
              }}
            >
              Reconnect Audio
            </button>
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