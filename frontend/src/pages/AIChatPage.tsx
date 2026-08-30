/**
 * AIChatPage - Speech-First AI Assistant for KrishiMitra
 * 
 * Primary interaction: Voice (🎙️)
 * Secondary interaction: Text (⌨️)
 * 
 * User experience: "मैं KrushiMitra से बात कर रहा हूँ"
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardHeader } from '../components/DashboardHeader';
import { Mic, Square, Volume2, ArrowLeft, Keyboard, Send, ChevronRight, Sprout } from 'lucide-react';

type Mode = 'voice' | 'text';
type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

interface NavigationAction {
  enabled: boolean;
  label: string;
  label_english?: string;
  route: string;
  params?: Record<string, string>;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  type: 'text' | 'voice';
  audioUrl?: string;
  navigation?: NavigationAction;
}

export function AIChatPage() {
  const navigate = useNavigate();
  
  // Mode state
  const [mode, setMode] = useState<Mode>('voice');
  
  // Voice mode states
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Text mode state
  const [textInput, setTextInput] = useState('');
  const [typingDetected, setTypingDetected] = useState(false);
  
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  
  // Audio playback
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Stop any ongoing recording
      if (mediaRecorderRef.current && isRecording) {
        try {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
        } catch (e) {
          console.error('Error stopping recording on unmount:', e);
        }
      }
    };
  }, [isRecording]);
  
  // ==========================================
  // HELPER FUNCTIONS (defined early to avoid hoisting issues)
  // ==========================================
  
  const base64ToBlob = (base64: string, mimeType: string): Blob => {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  };
  
  const getVoiceStateDisplay = () => {
    switch (voiceState) {
      case 'listening':
        return { 
          icon: <Mic size={64} strokeWidth={2} className="text-red-600" />, 
          text: 'सुन रहा हूँ...', 
          color: 'text-red-600' 
        };
      case 'processing':
        return { 
          icon: <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />, 
          text: 'सोच रहा हूँ...', 
          color: 'text-blue-600' 
        };
      case 'speaking':
        return { 
          icon: <Volume2 size={64} strokeWidth={2} className="text-green-600 animate-pulse" />, 
          text: 'बोल रहा हूँ...', 
          color: 'text-green-600' 
        };
      default:
        return { 
          icon: <Mic size={64} strokeWidth={2} className="text-gray-600" />, 
          text: 'बोलने के लिए टैप करें', 
          color: 'text-gray-600' 
        };
    }
  };
  
  // ==========================================
  // VOICE RECORDING FUNCTIONS
  // ==========================================
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setVoiceState('processing');
    }
  };
  
  // Smart text detection: Stop recording when user starts typing
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // If user starts typing while recording, stop the recording
      if (isRecording && e.key.length === 1) {
        console.log('Detected typing, stopping recording');
        setTypingDetected(true);
        
        // Stop recording inline to avoid hoisting issues
        if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          setVoiceState('processing');
        }
        
        // Switch to text mode after a brief moment
        setTimeout(() => {
          setMode('text');
          setTypingDetected(false);
        }, 500);
      }
    };
    
    if (isRecording) {
      window.addEventListener('keypress', handleKeyPress);
      return () => window.removeEventListener('keypress', handleKeyPress);
    }
  }, [isRecording]);
  
  // ==========================================
  // VOICE RECORDING
  // ==========================================
  
  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      // Collect audio chunks
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      // Handle recording stop
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Only send if we have audio data
        if (audioChunksRef.current.length > 0) {
          await sendVoiceMessage(audioBlob);
        }
      };
      
      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setVoiceState('listening');
      
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('माइक्रोफ़ोन एक्सेस नहीं मिला। कृपया माइक्रोफ़ोन की अनुमति दें।');
      setVoiceState('idle');
    }
  };
  
  // ==========================================
  // SEND VOICE MESSAGE
  // ==========================================
  
  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      setVoiceState('processing');
      
      // Create FormData
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.wav');
      if (conversationId) {
        formData.append('conversation_id', conversationId);
      }
      formData.append('language', 'hi-IN');
      
      // Call voice API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/ai/voice`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Voice request failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process voice');
      }
      
      // Update conversation ID
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      
      // Add user message (transcript)
      const userMessage: Message = {
        role: 'user',
        content: data.transcript,
        timestamp: new Date().toISOString(),
        type: 'voice'
      };
      
      // Create audio URL from base64
      const audioBase64 = data.audio_base64;
      const responseAudioBlob = base64ToBlob(audioBase64, 'audio/wav');
      const audioUrl = URL.createObjectURL(responseAudioBlob);
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response_text,
        timestamp: new Date().toISOString(),
        type: 'voice',
        audioUrl,
        navigation: data.navigation
      };
      
      setMessages(prev => [...prev, userMessage, assistantMessage]);
      
      // Play response audio automatically
      setVoiceState('speaking');
      await playAudio(audioUrl);
      
      setVoiceState('idle');
      
    } catch (error: any) {
      console.error('Voice error:', error);
      setError(error.message || 'आवाज़ समझ नहीं आई, कृपया दोबारा बोलें।');
      setVoiceState('idle');
    }
  };
  
  // ==========================================
  // SEND TEXT MESSAGE
  // ==========================================
  
  const sendTextMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!textInput.trim()) return;
    
    try {
      setError(null);
      
      const messageText = textInput.trim();
      setTextInput('');
      
      // Add user message immediately
      const userMessage: Message = {
        role: 'user',
        content: messageText,
        timestamp: new Date().toISOString(),
        type: 'text'
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Call chat API
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/v1/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: messageText,
          conversation_id: conversationId,
          language: 'hi'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Chat request failed');
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }
      
      // Update conversation ID
      if (data.conversation_id) {
        setConversationId(data.conversation_id);
      }
      
      // Create audio URL if available
      let audioUrl: string | undefined;
      if (data.audio_base64) {
        const responseAudioBlob = base64ToBlob(data.audio_base64, 'audio/wav');
        audioUrl = URL.createObjectURL(responseAudioBlob);
      }
      
      // Add assistant message
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response_text,
        timestamp: new Date().toISOString(),
        type: 'text',
        audioUrl,
        navigation: data.navigation
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.message || 'जवाब देने में समस्या आ रही है। कृपया दोबारा कोशिश करें।');
    }
  };
  
  // ==========================================
  // AUDIO PLAYBACK
  // ==========================================
  
  const playAudio = (audioUrl: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Stop any currently playing audio
        if (audioRef.current) {
          try {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
          } catch (e) {
            console.error('Error stopping previous audio:', e);
          }
          audioRef.current = null;
        }
        
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        
        audio.onended = () => {
          setIsPlayingAudio(false);
          audioRef.current = null;
          resolve();
        };
        
        audio.onerror = (error) => {
          console.error('Audio playback error:', error);
          setIsPlayingAudio(false);
          audioRef.current = null;
          reject(new Error('Audio playback failed'));
        };
        
        setIsPlayingAudio(true);
        audio.play().catch((playError) => {
          console.error('Audio play error:', playError);
          setIsPlayingAudio(false);
          audioRef.current = null;
          reject(playError);
        });
        
      } catch (error) {
        console.error('Audio initialization error:', error);
        setIsPlayingAudio(false);
        audioRef.current = null;
        reject(error);
      }
    });
  };
  
  const playMessageAudio = async (audioUrl: string) => {
    try {
      setVoiceState('speaking');
      await playAudio(audioUrl);
      setVoiceState('idle');
    } catch (error) {
      console.error('Playback error:', error);
      setVoiceState('idle');
    }
  };
  
  // ==========================================
  // RENDER: VOICE MODE
  // ==========================================
  
  if (mode === 'voice') {
    const stateDisplay = getVoiceStateDisplay();
    
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3.5">
            <div className="max-w-[420px] mx-auto flex items-center justify-between">
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ArrowLeft size={24} strokeWidth={2} className="text-gray-600" />
              </button>
              <h1 className="text-[19px] font-bold text-[#0b5e2c]">
                KrishiMitra
              </h1>
              <button
                onClick={() => setMode('text')}
                className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="टाइप करने के लिए स्विच करें"
              >
                <Keyboard size={24} strokeWidth={2} className="text-gray-600" />
              </button>
            </div>
          </div>
          
          {/* Voice Conversation Area */}
          <div className="flex-1 flex flex-col items-center justify-center max-w-[420px] mx-auto w-full px-4">
            {/* State Display */}
            <div className="text-center mb-8">
              <div className="mb-6 flex justify-center">{stateDisplay.icon}</div>
              <div className={`text-[20px] font-semibold ${stateDisplay.color} mb-2`}>
                {stateDisplay.text}
              </div>
              
              {/* Transcript Display */}
              {messages.length > 0 && (
                <div className="mt-6 p-5 bg-white rounded-xl shadow-sm max-w-[350px] border border-gray-200">
                  <div className="text-[15px] text-gray-700 leading-relaxed">
                    {messages[messages.length - 1].content}
                  </div>
                  <div className="text-[12px] text-gray-500 mt-3 font-medium">
                    {messages[messages.length - 1].role === 'user' ? 'आप' : 'KrishiMitra'}
                  </div>
                </div>
              )}
            </div>
            
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-[350px] w-full">
                <div className="text-[14px] text-red-900 leading-relaxed">{error}</div>
              </div>
            )}
            
            {/* Typing Detected Notification */}
            {typingDetected && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl max-w-[350px] w-full flex items-center gap-2">
                <Keyboard size={18} strokeWidth={2} className="text-blue-600" />
                <div className="text-[14px] text-blue-900">टाइपिंग मोड में जा रहे हैं...</div>
              </div>
            )}
            
            {/* Microphone Button */}
            <div className="mb-8">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={voiceState !== 'idle'}
                  className="w-[120px] h-[120px] rounded-full bg-[#0b5e2c] text-white
                           flex items-center justify-center
                           hover:bg-[#0d7436] active:scale-95 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed
                           shadow-xl"
                >
                  <Mic size={56} strokeWidth={2} />
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="w-[120px] h-[120px] rounded-full bg-red-600 text-white
                           flex items-center justify-center
                           hover:bg-red-700 active:scale-95 transition-all
                           shadow-xl animate-pulse"
                >
                  <Square size={48} strokeWidth={2} fill="white" />
                </button>
              )}
            </div>
            
            {/* Instructions */}
            <div className="text-center text-gray-600 text-[13px] max-w-[300px]">
              {!isRecording ? (
                <p>माइक्रोफ़ोन बटन दबाएं और अपना सवाल बोलें</p>
              ) : (
                <p>बोलना खत्म होने पर स्टॉप बटन दबाएं</p>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }
  
  // ==========================================
  // RENDER: TEXT MODE
  // ==========================================
  
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col">
      <DashboardHeader />
      
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-4 py-3.5">
          <div className="max-w-[420px] mx-auto flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} strokeWidth={2} className="text-gray-600" />
            </button>
            <h1 className="text-[19px] font-bold text-[#0b5e2c]">
              KrishiMitra
            </h1>
            <button
              onClick={() => setMode('voice')}
              className="p-2 -mr-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="आवाज़ के लिए स्विच करें"
            >
              <Mic size={24} strokeWidth={2} className="text-gray-600" />
            </button>
          </div>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 max-w-[420px] mx-auto w-full">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <div className="w-20 h-20 bg-green-50 rounded-2xl flex items-center justify-center mb-4">
                <Sprout size={48} strokeWidth={2} className="text-[#0b5e2c]" />
              </div>
              <h2 className="text-[22px] font-bold text-gray-900 mb-2 leading-tight">
                नमस्कार! मैं KrishiMitra हूँ
              </h2>
              <p className="text-[15px] text-gray-600 max-w-[300px] leading-relaxed">
                खेती, मौसम, बाज़ार भाव, या सरकारी योजनाओं के बारे में पूछें
              </p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#0b5e2c] text-white rounded-br-md'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-bl-md shadow-sm'
                    }`}
                  >
                    <div className="text-[15px] leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                    
                    {/* Play audio button for assistant messages */}
                    {message.role === 'assistant' && message.audioUrl && (
                      <button
                        onClick={() => playMessageAudio(message.audioUrl!)}
                        disabled={isPlayingAudio}
                        className="mt-3 flex items-center gap-1.5 text-[13px] text-[#0b5e2c] font-medium hover:text-[#0d7436]
                                 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Volume2 size={16} strokeWidth={2} />
                        <span>सुनें</span>
                      </button>
                    )}
                    
                    {/* Navigation button for assistant messages with navigation action */}
                    {message.role === 'assistant' && message.navigation?.enabled && (
                      <button
                        onClick={() => {
                          const nav = message.navigation!;
                          // Build route with query params if provided
                          let route = nav.route;
                          if (nav.params && Object.keys(nav.params).length > 0) {
                            const params = new URLSearchParams(nav.params);
                            route = `${nav.route}?${params.toString()}`;
                          }
                          navigate(route);
                        }}
                        className="mt-3 inline-flex items-center gap-2 px-4 py-2.5 bg-[#0b5e2c] text-white 
                                 rounded-xl text-[14px] font-semibold hover:bg-[#0d7436]
                                 active:scale-95 transition-all shadow-sm"
                      >
                        <span>{message.navigation.label}</span>
                        <ChevronRight size={16} strokeWidth={2.5} />
                      </button>
                    )}
                    
                    <div className={`text-[10px] mt-1 ${message.role === 'user' ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(message.timestamp).toLocaleTimeString('hi-IN', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200 max-w-[420px] mx-auto w-full">
            <div className="text-[13px] text-red-900">{error}</div>
          </div>
        )}
        
        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-4 py-3 safe-area-bottom">
          <form onSubmit={sendTextMessage} className="max-w-[420px] mx-auto flex items-center gap-3">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="संदेश लिखें..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-[15px]
                       focus:outline-none focus:border-[#0b5e2c] focus:ring-2 focus:ring-[#0b5e2c]/20
                       transition-all"
            />
            <button
              type="submit"
              disabled={!textInput.trim()}
              className="w-[50px] h-[50px] rounded-xl bg-[#0b5e2c] text-white
                       flex items-center justify-center
                       hover:bg-[#0d7436] active:scale-95 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       shadow-sm"
            >
              <Send size={22} strokeWidth={2} />
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
