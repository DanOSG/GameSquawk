import React, { useEffect, useState, useRef } from 'react';
import { FiMic, FiMicOff, FiUser, FiVolume2 } from 'react-icons/fi';
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
      
      // Emit join lobby event
      socketRef.current.emit('joinLobby', {
        username,
        avatar: userAvatar
      });
    });
    
    // Handle reconnection
    socketRef.current.on('reconnect', (attemptNumber) => {
      console.log(`Reconnected to lobby after ${attemptNumber} attempts`);
      
      // Re-emit join lobby event
      socketRef.current.emit('joinLobby', {
        username,
        avatar: userAvatar
      });
    });
    
    // Handle connection errors
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    // Handle disconnection
    socketRef.current.on('disconnect', (reason) => {
      console.log('Disconnected from lobby:', reason);
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
      
      // Mute audio by default
      stream.getAudioTracks().forEach(track => {
        track.enabled = false;
      });
      
      // Set up WebRTC peer connections and handlers
      socketRef.current.on('callUser', async ({ from, signal }) => {
        console.log(`Received call from ${from} with signal type ${signal.type}`);
        
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
        
        // Create new peer connection for incoming call
        const peerConnection = createPeerConnection(from);
        
        // Add local stream to peer connection
        if (stream) {
          stream.getTracks().forEach(track => {
            console.log(`Adding ${track.kind} track to peer connection for ${from}`);
            try {
              peerConnection.addTrack(track, stream);
            } catch (err) {
              console.error(`Error adding track to connection with ${from}:`, err);
            }
          });
        }
        
        try {
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
        
        if (peerConnection && peerConnection.signalingState !== 'closed') {
          peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
            .then(() => console.log(`Added ICE candidate for ${from}`))
            .catch(error => console.error(`Error adding ICE candidate for ${from}:`, error));
        } else {
          console.warn(`Cannot add ICE candidate for ${from}: connection closed or not available`);
        }
      });
      
      // Call existing users in the room
      socketRef.current.on('lobbyUsers', async (lobbyUsers) => {
        const currentUserIds = Object.keys(peerConnections);
        
        // Call new users that joined with a small delay between each
        for (let i = 0; i < lobbyUsers.length; i++) {
          const user = lobbyUsers[i];
          if (user.id !== socketRef.current.id && !currentUserIds.includes(user.id)) {
            // Add a small delay between each call to prevent overwhelming the system
            setTimeout(() => {
              callUser(user.id);
            }, i * 500);
          }
        }
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access your microphone. Please check your permissions and try again.');
    }
  };
  
  const createPeerConnection = (userId) => {
    // First remove any existing connection for this user
    if (peerConnections[userId]) {
      console.log(`Closing existing peer connection for ${userId}`);
      try {
        peerConnections[userId].close();
      } catch (err) {
        console.error(`Error closing existing peer connection for ${userId}:`, err);
      }
    }
    
    // Create new RTCPeerConnection with expanded ICE servers
    console.log(`Creating new peer connection for ${userId}`);
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' }
      ],
      iceCandidatePoolSize: 10,
      iceTransportPolicy: 'all',
      bundlePolicy: 'max-bundle',
      sdpSemantics: 'unified-plan'
    });
    
    // Set up ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log(`Generated ICE candidate for connection with ${userId}:`, event.candidate);
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
      
      // Wait a moment for the stream to initialize
      setTimeout(() => {
        try {
          // Create audio element for remote stream if it doesn't exist or recreate it
          if (audioElements.current[userId]) {
            console.log(`Updating existing audio element for ${userId}`);
            audioElements.current[userId].srcObject = stream;
            audioElements.current[userId].volume = audioVolume / 100;
            
            // Make sure it's playing
            audioElements.current[userId].play()
              .then(() => console.log(`Updated audio playback for ${userId}`))
              .catch(e => console.error(`Error playing updated stream for ${userId}:`, e));
          } else {
            console.log(`Creating new audio element for ${userId}`);
            const audioEl = document.createElement('audio');
            audioEl.id = `audio-${userId}`;
            audioEl.autoplay = true;
            audioEl.controls = true; // For debugging
            audioEl.style.position = 'absolute';
            audioEl.style.opacity = '0';
            audioEl.style.pointerEvents = 'none'; // Prevent interaction
            audioEl.style.zIndex = '-1'; // Behind everything
            audioEl.srcObject = stream;
            audioEl.volume = audioVolume / 100;
            audioEl.muted = false;
            
            // Listen for audio playback events
            audioEl.addEventListener('play', () => console.log(`Audio from ${userId} playing`));
            audioEl.addEventListener('pause', () => console.log(`Audio from ${userId} paused`));
            audioEl.addEventListener('error', (e) => console.error(`Audio error for ${userId}:`, e));
            
            document.body.appendChild(audioEl);
            audioElements.current[userId] = audioEl;
            
            // Force play the audio
            audioEl.play()
              .then(() => console.log(`Successfully playing audio from ${userId}`))
              .catch(error => console.error(`Error playing audio from ${userId}:`, error));
          }
          
          // Update UI to show user is speaking
          setUsers(prevUsers => 
            prevUsers.map(user => 
              user.id === userId ? { ...user, speaking: true } : user
            )
          );
          
          // Set up audio analyzer to detect speaking
          if (!audioContexts.current[userId]) {
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
          }
        } catch (error) {
          console.error(`Error handling track from ${userId}:`, error);
        }
      }, 500); // 500ms delay to ensure stream is ready
    };
    
    // Store the peer connection
    setPeerConnections(prev => ({
      ...prev,
      [userId]: peerConnection
    }));
    
    return peerConnection;
  };
  
  const callUser = async (userId) => {
    try {
      console.log(`Initiating call to user ${userId}`);
      
      // Create a fresh peer connection - don't reuse existing ones to avoid state issues
      const peerConnection = createPeerConnection(userId);
      
      // Add local stream to peer connection if available
      if (localStream) {
        console.log(`Adding tracks to connection with ${userId}`);
        localStream.getTracks().forEach(track => {
          try {
            peerConnection.addTrack(track, localStream);
          } catch (error) {
            console.error(`Error adding track to connection with ${userId}:`, error);
          }
        });
      } else {
        console.warn(`No local stream available when calling ${userId}`);
      }
      
      // Create offer
      console.log(`Creating offer for ${userId}`);
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      // Set local description
      console.log(`Setting local description for ${userId}`);
      await peerConnection.setLocalDescription(offer);
      
      // Send the offer after a short delay to ensure ICE gathering has started
      setTimeout(() => {
        if (peerConnection.signalingState !== 'closed') {
          const currentOffer = peerConnection.localDescription;
          console.log(`Sending offer to ${userId}:`, currentOffer);
          
          // Send offer to user
          socketRef.current.emit('callUser', {
            to: userId,
            signal: currentOffer
          });
        } else {
          console.log(`Connection closed before offer could be sent to ${userId}`);
        }
      }, 500);
    } catch (error) {
      console.error('Error calling user:', error);
    }
  };

  // Toggle mute state
  const toggleMute = () => {
    if (localStream) {
      const newMuteState = !isMuted;
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !newMuteState;
      });
      setIsMuted(newMuteState);
    }
  };

  // Handle mic volume change - use the Audio API's GainNode directly
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

  // Update audio elements when audioVolume changes
  useEffect(() => {
    Object.values(audioElements.current).forEach(audio => {
      if (audio) {
        audio.volume = audioVolume / 100;
      }
    });
  }, [audioVolume]);

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

  // Fix peer connections state management to avoid race conditions
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
        
        // First update our state, then close the connection
        const updatedConnections = { ...peerConnections };
        delete updatedConnections[user.id];
        setPeerConnections(updatedConnections);
        
        // Now close it after the state has been updated
        try {
          peerConnection.close();
        } catch (err) {
          console.error("Error closing peer connection:", err);
        }
        
        // Call again after a short delay
        setTimeout(() => callUser(user.id), 1500);
      }
    }
  };

  // Periodically check connections
  useEffect(() => {
    if (!socketRef.current) return;
    
    const interval = setInterval(checkAndRetryConnections, 10000); // Check every 10 seconds
    
    return () => clearInterval(interval);
  }, [socketRef.current, users, peerConnections]);

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>The Lobby</h1>
        <p>Voice chat with other members currently online</p>
      </div>
      
      <div className="controls-container">
        <button 
          className={`mute-button ${isMuted ? 'muted' : 'unmuted'}`}
          onClick={toggleMute}
        >
          {isMuted ? <FiMicOff /> : <FiMic />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        
        <div className="volume-controls">
          <div className="volume-control">
            <label htmlFor="mic-volume">Mic Volume:</label>
            <input 
              type="range" 
              id="mic-volume" 
              min="0" 
              max="200" 
              value={micVolume} 
              onChange={handleMicVolumeChange}
              disabled={isMuted}
            />
            <span>{micVolume}%</span>
          </div>
          
          <div className="volume-control">
            <label htmlFor="audio-volume">Audio Volume:</label>
            <input 
              type="range" 
              id="audio-volume" 
              min="0" 
              max="200" 
              value={audioVolume} 
              onChange={handleAudioVolumeChange}
            />
            <span>{audioVolume}%</span>
          </div>
        </div>
      </div>
      
      <div className="users-container">
        <div className={`user-bubble current-user ${isMuted ? 'muted' : 'speaking'}`}>
          {userAvatar ? (
            <img src={userAvatar} alt={username} />
          ) : (
            <div className="avatar-placeholder">
              <FiUser />
            </div>
          )}
          <div className="user-name">{username} (You)</div>
          {!isMuted && <VolumeMeter volume={localVolume} />}
        </div>
        
        {/* Display other users - make sure we're filtering correctly */}
        {users.length > 0 && (
          <div className="other-users">
            <p className="other-users-count">Other users: {users.filter(user => user.id !== socketRef.current?.id).length}</p>
          </div>
        )}
        
        {users.filter(user => {
          console.log(`Comparing user ${user.id} with socket ID ${socketRef.current?.id}`);
          return user.id !== socketRef.current?.id;
        }).map(user => (
          <div 
            key={user.id} 
            className={`user-bubble ${user.animationClass || ''} ${user.speaking ? 'speaking' : ''}`}
          >
            {user.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user.username ? user.username.charAt(0).toUpperCase() : <FiUser />}
              </div>
            )}
            <div className="user-name">{user.username}</div>
            {userVolumes[user.id] > 5 && <VolumeMeter volume={userVolumes[user.id]} />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Lobby; 