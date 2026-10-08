import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Minus, 
  Send, 
  Calculator, 
  Search, 
  Clock, 
  User, 
  Headphones, 
  Phone, 
  Mail, 
  ArrowRight, 
  Truck, 
  Plane, 
  Ship, 
  Train, 
  RotateCcw, 
  ExternalLink, 
  Sparkles
} from 'lucide-react';
import { COUNTRY_LIST, getCitiesForCountry } from '../data/locations';

/**
 * Official Vector WhatsApp Logo Component
 */
export function WhatsAppLogo({ size = 24, color = "#FFFFFF" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}
    >
      <path 
        fillRule="evenodd" 
        clipRule="evenodd" 
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 6.46 17.5 2 12.04 2ZM17.63 16.15C17.4 16.79 16.48 17.36 15.74 17.52C15.24 17.62 14.59 17.7 12.4 16.79C9.6 15.63 7.8 12.78 7.66 12.6C7.52 12.42 6.54 11.11 6.54 9.76C6.54 8.41 7.23 7.75 7.51 7.46C7.74 7.22 8.12 7.11 8.48 7.11C8.6 7.11 8.7 7.12 8.8 7.12C9.07 7.14 9.21 7.15 9.39 7.58C9.61 8.12 10.15 9.44 10.22 9.57C10.28 9.71 10.33 9.88 10.24 10.06C10.16 10.24 10.1 10.32 9.97 10.46C9.84 10.61 9.73 10.71 9.59 10.88C9.44 11.04 9.29 11.21 9.45 11.49C9.62 11.78 10.21 12.74 11.07 13.51C12.19 14.51 13.1 14.83 13.43 14.96C13.68 15.06 13.97 15.04 14.15 14.85C14.38 14.6 14.66 14.2 14.94 13.81C15.14 13.53 15.39 13.49 15.66 13.59C15.93 13.68 17.38 14.4 17.68 14.55C17.98 14.7 18.18 14.78 18.25 14.9C18.32 15.02 18.32 15.62 18.09 16.26L17.63 16.15Z" 
        fill={color}
      />
    </svg>
  );
}

/**
 * Verified WhatsApp Official Business Badge
 */
export function WhatsAppVerifiedBadge({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }}>
      <circle cx="9" cy="9" r="8" fill="#25D366" />
      <path d="M5.5 9.2L7.7 11.4L12.5 6.6" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * WhatsApp Read Receipts (Double Blue Ticks)
 */
export function WhatsAppTicks({ size = 15, color = "#53BDEB" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 11" fill="none" style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }}>
      <path d="M11.05 1L5.35 6.7L3.05 4.4L1.75 5.7L5.35 9.3L12.35 2.3L11.05 1Z" fill={color} />
      <path d="M14.55 1L8.85 6.7L7.95 5.8L6.65 7.1L8.85 9.3L15.85 2.3L14.55 1Z" fill={color} />
    </svg>
  );
}

function TrackingPromptInput({ onSubmit, isDark }) {
  const [val, setVal] = useState('');
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        if (val.trim()) {
          onSubmit(val.trim());
          setVal('');
        }
      }}
      style={{ marginTop: '8px', display: 'flex', gap: '6px', width: '100%', maxWidth: '350px' }}
    >
      <input
        type="text"
        placeholder="Enter consignment code (e.g. ACE-2T34-79011)"
        value={val}
        onChange={e => setVal(e.target.value)}
        style={{
          flex: 1,
          padding: '8px 12px',
          fontSize: '12.5px',
          borderRadius: '18px',
          border: isDark ? '1px solid #475569' : '1px solid #CBD5E1',
          outline: 'none',
          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
          color: isDark ? '#F8FAFC' : '#0F172A'
        }}
      />
      <button
        type="submit"
        disabled={!val.trim()}
        style={{
          backgroundColor: val.trim() ? '#25D366' : (isDark ? '#334155' : '#CBD5E1'),
          color: '#FFFFFF',
          border: 'none',
          borderRadius: '18px',
          padding: '0 15px',
          fontSize: '12px',
          fontWeight: 700,
          cursor: val.trim() ? 'pointer' : 'default',
          transition: 'background-color 0.2s',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}
      >
        <span>Track</span>
      </button>
    </form>
  );
}

export default function AiAssistant({ 
  onSearchTracking, 
  onProceedToShipment, 
  setView,
  allShipments = [], 
  currentUser = null,
  activeRole = 'guest',
  theme = 'light'
}) {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [unreadCount, setUnreadCount] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [msgSeq, setMsgSeq] = useState(2);

  // Quote State
  const [quoteState, setQuoteState] = useState({
    originCountry: 'Ghana',
    originCity: 'Accra',
    destinationCountry: 'United Kingdom',
    destinationCity: 'London',
    weight: '25',
    method: 'Air Freight Priority',
    calculated: null
  });

  // Lead State
  const [leadState, setLeadState] = useState({
    name: currentUser?.name || '',
    contact: currentUser?.email || currentUser?.phone || '',
    note: '',
    submitted: false,
    ticketId: ''
  });

  // Human Callback
  const [callbackNumber, setCallbackNumber] = useState('');
  const [callbackRequested, setCallbackRequested] = useState(false);

  // Initial WhatsApp Welcome Message
  const [messages, setMessages] = useState([
    {
      id: 'init-1',
      sender: 'bot',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text: `👋 **Hello${currentUser?.name ? ' ' + currentUser.name : ''}! Welcome to ACE Global Logistics on WhatsApp.** 🚢✈️\n\nI'm your official 24/7 logistics assistant. How may I assist your cargo or shipping needs today?`,
      type: 'welcome',
      quickActions: [
        { label: 'Track Consignment', icon: 'search', action: 'track' },
        { label: 'Instant Freight Quote', icon: 'calculator', action: 'quote' },
        { label: 'Transit Times & ETAs', icon: 'clock', action: 'delivery' },
        { label: 'Talk to Live Dispatcher', icon: 'headphones', action: 'human' },
        { label: 'Open in WhatsApp App', icon: 'whatsapp', action: 'external_wa' }
      ]
    }
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen, isMinimized]);

  const handleOpen = () => {
    setIsOpen(true);
    setIsMinimized(false);
    setUnreadCount(0);
  };

  const nextId = () => {
    setMsgSeq(s => s + 1);
    return 'msg-' + Date.now() + '-' + msgSeq;
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: nextId(),
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `👋 **Hi there! How can I help you today?**\n\nSelect an option below or type your question or tracking code directly:`,
        type: 'welcome',
        quickActions: [
          { label: 'Track Consignment', icon: 'search', action: 'track' },
          { label: 'Instant Freight Quote', icon: 'calculator', action: 'quote' },
          { label: 'Transit Times', icon: 'clock', action: 'delivery' },
          { label: 'Talk to Live Dispatcher', icon: 'headphones', action: 'human' },
          { label: 'Open in WhatsApp App', icon: 'whatsapp', action: 'external_wa' }
        ]
      }
    ]);
  };

  const addBotReply = (text, options = {}) => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: nextId(),
          sender: 'bot',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text,
          ...options
        }
      ]);
    }, 450);
  };

  // Direct WhatsApp Web / Mobile redirect helper
  const handleOpenExternalWhatsApp = (customText = "Hello ACE Logistics Support, I would like to inquire about a shipment.") => {
    const encoded = encodeURIComponent(customText);
    const waUrl = `https://wa.me/233245550192?text=${encoded}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  // FLOW 1: QUOTE
  const triggerQuoteFlow = () => {
    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'I need a freight rate quote.'
      }
    ]);

    addBotReply(
      "Please select your origin, destination, cargo weight, and transport tier below:",
      {
        type: 'quote_card',
        quickActions: [
          { label: 'Air Express Priority', icon: 'plane', action: 'quote_air' },
          { label: 'Ocean Container Freight', icon: 'ship', action: 'quote_ocean' },
          { label: 'Ground Freight Fleet', icon: 'truck', action: 'quote_ground' },
          { label: 'Rail Intermodal', icon: 'train', action: 'quote_rail' }
        ]
      }
    );
  };

  const handleCalculateQuote = (overrideMethod = null) => {
    const selectedMethod = overrideMethod || quoteState.method;
    const w = parseFloat(quoteState.weight) || 10;
    let rate = 9.0;
    let days = '2–4 Business Days';

    if (selectedMethod.includes('Ocean')) {
      rate = 2.5;
      days = '14–22 Days';
    } else if (selectedMethod.includes('Ground') || selectedMethod.includes('Road')) {
      rate = 4.0;
      days = '1–3 Business Days';
    } else if (selectedMethod.includes('Rail')) {
      rate = 4.5;
      days = '4–6 Business Days';
    }

    const freight = Math.round(w * rate);
    const fuel = Math.round(freight * 0.12);
    const customs = 30;
    const total = freight + fuel + customs;

    const result = {
      method: selectedMethod,
      weight: w,
      origin: `${quoteState.originCity}, ${quoteState.originCountry}`,
      destination: `${quoteState.destinationCity}, ${quoteState.destinationCountry}`,
      freight,
      fuel,
      customs,
      total,
      estimatedDelivery: days
    };

    setQuoteState(prev => ({
      ...prev,
      method: selectedMethod,
      calculated: result
    }));

    addBotReply(
      `Estimated rate: **$${result.total} USD** for ${result.weight} kg via **${result.method}** (${result.estimatedDelivery})`,
      {
        type: 'quote_result',
        quoteData: result
      }
    );
  };

  // FLOW 2: TRACK SHIPMENT
  const triggerTrackingFlow = () => {
    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Check consignment status.'
      }
    ]);

    addBotReply(
      "Please enter your registered 12-character consignment tracking code (e.g. `ACE-2T34-79011`):",
      {
        type: 'tracking_prompt'
      }
    );
  };

  const handleLookupTracking = (trackingNum) => {
    const cleanNumber = (trackingNum || '').trim().toUpperCase();
    if (!cleanNumber) return;

    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Track ${cleanNumber}`
      }
    ]);

    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      const stripped = cleanNumber.replace(/[^A-Z0-9]/g, '');
      
      const found = allShipments.find(s => {
        const sNum = (s.trackingNumber || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const sId = (s.id || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        return sNum === stripped || sId === stripped;
      });

      if (found) {
        setMessages(prev => [
          ...prev,
          {
            id: nextId(),
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `✅ Consignment **${found.trackingNumber || found.id}** is currently **${found.status}**.`,
            type: 'tracking_result',
            shipmentData: found
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: nextId(),
            sender: 'bot',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            text: `⚠️ **Consignment "${cleanNumber}" is not registered in our database.**\n\nPlease double check the tracking code from your receipt or contact our dispatch team on WhatsApp for manual verification.`,
            type: 'tracking_not_found',
            quickActions: [
              { label: 'Re-enter Code', icon: 'search', action: 'track' },
              { label: 'Speak to Dispatcher', icon: 'headphones', action: 'human' },
              { label: 'Chat in WhatsApp App', icon: 'whatsapp', action: 'external_wa' }
            ]
          }
        ]);
      }
    }, 400);
  };

  // FLOW 3: ESTIMATED DELIVERY
  const triggerDeliveryFlow = () => {
    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'What are the global delivery transit times?'
      }
    ]);

    const today = new Date();
    const addDays = (d) => {
      const target = new Date(today);
      target.setDate(target.getDate() + d);
      return target.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const estimates = [
      { mode: 'Air Freight Priority', duration: '1–3 Days', arrival: addDays(3), icon: 'plane', color: '#0284C7', bg: isDark ? 'rgba(2,132,199,0.18)' : '#F0F9FF' },
      { mode: 'Ground Express Fleet', duration: '2–4 Days', arrival: addDays(4), icon: 'truck', color: '#D97706', bg: isDark ? 'rgba(217,119,6,0.18)' : '#FFFBEB' },
      { mode: 'Rail Intermodal Express', duration: '4–6 Days', arrival: addDays(6), icon: 'train', color: '#059669', bg: isDark ? 'rgba(5,150,105,0.18)' : '#ECFDF5' },
      { mode: 'Ocean Container Freight', duration: '14–22 Days', arrival: addDays(18), icon: 'ship', color: '#2563EB', bg: isDark ? 'rgba(37,99,235,0.18)' : '#EFF6FF' }
    ];

    addBotReply(
      "Here are our guaranteed standard transit times across primary trade corridors:",
      {
        type: 'delivery_matrix',
        deliveryEstimates: estimates,
        quickActions: [
          { label: 'Get Instant Quote', action: 'quote' },
          { label: 'Track Consignment', action: 'track' }
        ]
      }
    );
  };

  // FLOW 4: COLLECT INFO / LEAD
  const triggerLeadFlow = () => {
    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'I want to speak with sales or corporate accounts.'
      }
    ]);

    addBotReply(
      "Please provide your contact info and our logistics coordinator will reply via WhatsApp/call within 20 minutes:",
      {
        type: 'lead_form'
      }
    );
  };

  const handleLeadSubmit = (e) => {
    e.preventDefault();
    if (!leadState.name || !leadState.contact) return;

    const ticket = 'ACE-WA-' + Math.floor(1000 + Math.random() * 9000);
    const leadRecord = {
      ...leadState,
      ticketId: ticket,
      createdAt: new Date().toISOString()
    };

    try {
      const existing = JSON.parse(localStorage.getItem('ace_customer_leads') || '[]');
      existing.unshift(leadRecord);
      localStorage.setItem('ace_customer_leads', JSON.stringify(existing));
    } catch {}

    setLeadState(prev => ({
      ...prev,
      submitted: true,
      ticketId: ticket
    }));

    addBotReply(
      `Thank you, **${leadState.name}**! Your request ticket **#${ticket}** is recorded. Our corporate desk will reach out shortly.`,
      {
        type: 'lead_confirmation',
        ticketId: ticket,
        quickActions: [
          { label: 'Calculate Quote', action: 'quote' },
          { label: 'Open in WhatsApp App', action: 'external_wa' }
        ]
      }
    );
  };

  // FLOW 5: HUMAN TRANSFER
  const triggerHumanFlow = () => {
    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        sender: 'user',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: 'Connect me with a live human dispatcher.'
      }
    ]);

    addBotReply(
      "Our terminal dispatch desk is active 24/7. Connect immediately through:",
      {
        type: 'human_transfer',
        quickActions: [
          { label: 'Join Live WhatsApp Agent', action: 'simulate_agent_join' },
          { label: 'Open WhatsApp Directly', action: 'external_wa' },
          { label: 'Call Hotline Directly', action: 'call_hotline' }
        ]
      }
    );
  };

  const handleSimulateAgentJoin = () => {
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev,
        {
          id: nextId(),
          sender: 'bot',
          isHumanAgent: true,
          agentName: "Sarah O'Connor (Heathrow Dispatch)",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          text: `👋 **Sarah O'Connor (Operations Dispatcher)** has joined the chat:\n\n"Hello! I am on duty right now. How can I assist you with your consignment, customs clearance, or delivery schedule?"`,
          type: 'live_agent'
        }
      ]);
    }, 500);
  };

  const handleRequestCallback = (e) => {
    e.preventDefault();
    if (!callbackNumber) return;

    setCallbackRequested(true);
    addBotReply(
      `✅ Callback confirmed for **${callbackNumber}**. A duty officer will phone or WhatsApp you within 10 minutes.`,
      { type: 'text' }
    );
  };

  // Natural Language Intent Matching & Message Sender
  const handleSendMessage = (e) => {
    e?.preventDefault();
    const text = inputMessage.trim();
    if (!text) return;

    const userMsg = {
      id: nextId(),
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text
    };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');

    // Persist prompt to MongoDB via backend /api/chat endpoint
    try {
      const chatApiUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000/api/chat'
        : '/api/chat';

      fetch(chatApiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sessionId: 'client-wa-' + (currentUser?.id || 'guest'),
          userId: currentUser?.id || null,
          userEmail: currentUser?.email || null
        })
      }).catch(err => console.debug('MongoDB chat persist notice:', err));
    } catch {}

    const lower = text.toLowerCase();

    // Check if previous message was awaiting tracking input
    const lastBotMsg = [...messages].reverse().find(m => m.sender === 'bot');
    const isExpectingTracking = lastBotMsg?.type === 'tracking_prompt' || lastBotMsg?.type === 'tracking_not_found';

    // Tracking
    const aceMatch = text.match(/ACE[- ]?[0-9]{4}[- ]?[A-Z0-9]+/i) || text.match(/[A-Z0-9]{6,20}/i);
    if (isExpectingTracking || lower.includes('track') || lower.includes('status') || lower.includes('where is') || (aceMatch && lower.includes('ace'))) {
      if (isExpectingTracking) {
        handleLookupTracking(text);
      } else if (aceMatch) {
        const code = aceMatch[0].replace(/\s+/g, '-');
        handleLookupTracking(code);
      } else {
        triggerTrackingFlow();
      }
      return;
    }

    // Quote
    if (lower.includes('quote') || lower.includes('price') || lower.includes('cost') || lower.includes('rate') || lower.includes('how much')) {
      const weightMatch = lower.match(/(\d+(\.\d+)?)\s*(kg|kilos|lbs)?/);
      if (weightMatch) {
        setQuoteState(prev => ({ ...prev, weight: weightMatch[1] }));
      }
      triggerQuoteFlow();
      return;
    }

    // Delivery / ETA
    if (lower.includes('delivery') || lower.includes('transit') || lower.includes('how long') || lower.includes('eta') || lower.includes('time')) {
      triggerDeliveryFlow();
      return;
    }

    // WhatsApp Direct
    if (lower.includes('whatsapp') || lower.includes('app') || lower.includes('wa')) {
      handleOpenExternalWhatsApp(text);
      addBotReply("Opening your native WhatsApp conversation with our dispatch desk right now...", {
        quickActions: [
          { label: 'Open in WhatsApp App', icon: 'whatsapp', action: 'external_wa' },
          { label: 'Continue Chatting Here', icon: 'headphones', action: 'human' }
        ]
      });
      return;
    }

    // Human / Call
    if (lower.includes('human') || lower.includes('agent') || lower.includes('support') || lower.includes('person') || lower.includes('call') || lower.includes('talk')) {
      triggerHumanFlow();
      return;
    }

    // Contact
    if (lower.includes('contact') || lower.includes('email') || lower.includes('phone') || lower.includes('message')) {
      triggerLeadFlow();
      return;
    }

    // Fallback friendly reply
    addBotReply(
      "Thank you for contacting ACE Logistics on WhatsApp. How would you like me to assist you right now?",
      {
        quickActions: [
          { label: 'Track Consignment', icon: 'search', action: 'track' },
          { label: 'Instant Freight Quote', icon: 'calculator', action: 'quote' },
          { label: 'Transit Times', icon: 'clock', action: 'delivery' },
          { label: 'Talk to Live Agent', icon: 'headphones', action: 'human' },
          { label: 'Open in WhatsApp App', icon: 'whatsapp', action: 'external_wa' }
        ]
      }
    );
  };

  const renderIcon = (iconName) => {
    switch (iconName) {
      case 'calculator': return <Calculator size={13} />;
      case 'search': return <Search size={13} />;
      case 'clock': return <Clock size={13} />;
      case 'user': return <User size={13} />;
      case 'headphones': return <Headphones size={13} />;
      case 'plane': return <Plane size={13} />;
      case 'ship': return <Ship size={13} />;
      case 'truck': return <Truck size={13} />;
      case 'train': return <Train size={13} />;
      case 'whatsapp': return <WhatsAppLogo size={13} color="#25D366" />;
      default: return <Sparkles size={13} />;
    }
  };

  return (
    <div className="ace-whatsapp-assistant-root">
      {/* 1. FLOATING WHATSAPP TRIGGER BUTTON */}
      {!isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'clamp(14px, 3vw, 24px)',
          right: 'clamp(12px, 3vw, 24px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '8px'
        }}>
          {/* Friendly Floating WhatsApp Pill */}
          <div 
            onClick={handleOpen}
            className="ace-wa-pill"
            style={{
              background: isDark ? '#1F2C34' : '#FFFFFF',
              color: isDark ? '#E9EDEF' : '#111B21',
              border: '1px solid rgba(37, 211, 102, 0.35)',
              borderRadius: '24px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 700,
              boxShadow: '0 6px 20px rgba(0,0,0,0.16)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              transition: 'all 0.2s ease'
            }}
          >
            <WhatsAppLogo size={18} color="#25D366" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Chat on <strong style={{ color: '#25D366' }}>WhatsApp</strong></span>
              <span style={{ 
                width: '7px', 
                height: '7px', 
                borderRadius: '50%', 
                backgroundColor: '#25D366', 
                display: 'inline-block',
                boxShadow: '0 0 8px #25D366'
              }} />
            </div>
          </div>

          {/* Launcher Button (Iconic Green Circle with WhatsApp Logo) */}
          <button
            onClick={handleOpen}
            aria-label="Open WhatsApp Assistant"
            className="ace-wa-float-btn"
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: '2px solid #FFFFFF',
              boxShadow: '0 8px 24px rgba(37, 211, 102, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            <WhatsAppLogo size={34} color="#FFFFFF" />
            
            {/* Unread Message Counter Badge */}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '11px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}>
                1
              </span>
            )}
          </button>
        </div>
      )}

      {/* 2. AUTHENTIC WHATSAPP CHAT PANEL */}
      {isOpen && (
        <div 
          className="ace-wa-panel"
          style={{
            position: 'fixed',
            bottom: 'clamp(10px, 2.5vw, 24px)',
            right: 'clamp(10px, 2.5vw, 24px)',
            zIndex: 99999,
            width: 'min(410px, calc(100vw - 16px))',
            maxWidth: 'calc(100vw - 16px)',
            height: isMinimized ? '62px' : 'clamp(500px, 80vh, 660px)',
            maxHeight: 'calc(100vh - 20px)',
            backgroundColor: isDark ? '#111B21' : '#EFEAE2',
            borderRadius: '16px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35)',
            border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxSizing: 'border-box',
            fontFamily: 'Segoe UI, -apple-system, BlinkMacSystemFont, Roboto, sans-serif'
          }}
        >
          {/* WHATSAPP BUSINESS HEADER */}
          <div style={{
            backgroundColor: isDark ? '#202C33' : '#075E54',
            color: '#FFFFFF',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            borderBottom: isDark ? '1px solid #2A3942' : 'none',
            flexShrink: 0
          }}
          onClick={() => isMinimized && setIsMinimized(false)}
          >
            {/* Profile Avatar & Identity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                position: 'relative',
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#25D366',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                border: '1.5px solid rgba(255,255,255,0.4)',
                flexShrink: 0
              }}>
                <WhatsAppLogo size={24} color="#FFFFFF" />
                {/* Live Online Status Dot */}
                <span style={{
                  position: 'absolute',
                  bottom: '1px',
                  right: '1px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#25D366',
                  border: '2px solid #FFFFFF'
                }} />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '0.2px' }}>
                    ACE Logistics
                  </span>
                  <WhatsAppVerifiedBadge size={15} />
                </div>
                <div style={{ fontSize: '11px', color: '#E9EDEF', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Official Business Account • Online</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }} onClick={e => e.stopPropagation()}>
              {/* Direct Open in WhatsApp App */}
              <button 
                onClick={() => handleOpenExternalWhatsApp()} 
                title="Open in WhatsApp Web / App"
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  cursor: 'pointer', 
                  padding: '6px', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9
                }}
              >
                <ExternalLink size={15} color="#FFFFFF" />
              </button>

              {/* Reset Conversation */}
              <button 
                onClick={handleResetChat} 
                title="Reset chat" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  cursor: 'pointer', 
                  padding: '6px', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9
                }}
              >
                <RotateCcw size={14} color="#FFFFFF" />
              </button>

              {/* Minimize / Expand */}
              <button 
                onClick={() => setIsMinimized(!isMinimized)} 
                title={isMinimized ? 'Expand' : 'Minimize'} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  cursor: 'pointer', 
                  padding: '6px', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9
                }}
              >
                <Minus size={15} color="#FFFFFF" />
              </button>

              {/* Close */}
              <button 
                onClick={() => setIsOpen(false)} 
                title="Close" 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#FFFFFF', 
                  cursor: 'pointer', 
                  padding: '6px', 
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  opacity: 0.9
                }}
              >
                <X size={17} color="#FFFFFF" />
              </button>
            </div>
          </div>

          {/* CHAT BODY CONTENT (WHEN EXPANDED) */}
          {!isMinimized && (
            <>
              {/* MESSAGES THREAD (WITH AUTHENTIC WHATSAPP WALLPAPER PATTERN) */}
              <div 
                className="ace-wa-thread"
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  padding: '14px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  backgroundColor: isDark ? '#0B141A' : '#EFEAE2',
                  backgroundImage: isDark 
                    ? `radial-gradient(circle at 50% 50%, rgba(32,44,51,0.5) 1px, transparent 1px)`
                    : `radial-gradient(circle at 50% 50%, rgba(0,0,0,0.04) 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }}
              >
                {/* Security & Encryption Notice (WhatsApp Style) */}
                <div style={{
                  alignSelf: 'center',
                  backgroundColor: isDark ? 'rgba(32,44,51,0.85)' : 'rgba(255,255,255,0.85)',
                  color: isDark ? '#8696A0' : '#54656F',
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                  textAlign: 'center',
                  maxWidth: '85%',
                  lineHeight: 1.4,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}>
                  <WhatsAppVerifiedBadge size={12} />
                  <span>Messages with ACE Logistics are verified & operational.</span>
                </div>

                {/* Messages Loop */}
                {messages.map((msg) => {
                  const isBot = msg.sender === 'bot';

                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isBot ? 'flex-start' : 'flex-end',
                        maxWidth: '88%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isBot ? 'flex-start' : 'flex-end'
                      }}
                    >
                      {/* WhatsApp Speech Bubble */}
                      <div
                        className={isBot ? 'ace-wa-bot-bubble' : 'ace-wa-user-bubble'}
                        style={{
                          backgroundColor: isBot 
                            ? (isDark ? '#202C33' : '#FFFFFF') 
                            : (isDark ? '#005C4B' : '#D9FDD3'),
                          color: isBot 
                            ? (isDark ? '#E9EDEF' : '#111B21') 
                            : (isDark ? '#E9EDEF' : '#111B21'),
                          borderRadius: isBot 
                            ? '0px 10px 10px 10px' 
                            : '10px 0px 10px 10px',
                          padding: '8px 12px 6px 12px',
                          fontSize: '13px',
                          lineHeight: 1.45,
                          boxShadow: '0 1px 1px rgba(0,0,0,0.12)',
                          position: 'relative',
                          wordBreak: 'break-word',
                          border: isDark ? '1px solid rgba(255,255,255,0.04)' : 'none'
                        }}
                      >
                        {/* Bot Sender Label */}
                        {isBot && (
                          <div style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: '#008069',
                            marginBottom: '3px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <span>{msg.agentName || 'ACE Logistics Support'}</span>
                            <WhatsAppVerifiedBadge size={11} />
                          </div>
                        )}

                        {/* Formatted Text Content */}
                        {msg.text.split('\n\n').map((para, pIdx) => (
                          <p key={pIdx} style={{ margin: pIdx > 0 ? '6px 0 0' : 0, color: 'inherit' }}>
                            {para.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/).map((part, partIdx) => {
                              if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*') && part.length > 2)) {
                                const clean = part.replace(/^\*+|\*+$/g, '');
                                return <strong key={partIdx} style={{ color: 'inherit', fontWeight: 700 }}>{clean}</strong>;
                              }
                              if (part.startsWith('`') && part.endsWith('`')) {
                                return (
                                  <code key={partIdx} style={{
                                    backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)',
                                    color: 'inherit',
                                    padding: '1px 5px',
                                    borderRadius: '4px',
                                    fontSize: '12px',
                                    fontFamily: 'monospace'
                                  }}>
                                    {part.slice(1, -1)}
                                  </code>
                                );
                              }
                              return part;
                            })}
                          </p>
                        ))}

                        {/* Timestamp & Read Receipts */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: '2px',
                          marginTop: '4px',
                          fontSize: '10px',
                          color: isBot ? (isDark ? '#8696A0' : '#667781') : (isDark ? '#8696A0' : '#54656F'),
                          float: 'right',
                          marginLeft: '12px'
                        }}>
                          <span>{msg.timestamp}</span>
                          {!isBot && <WhatsAppTicks size={14} color="#53BDEB" />}
                        </div>
                      </div>

                      {/* 1. INTERACTIVE QUOTE CARD */}
                      {msg.type === 'quote_card' && (
                        <div style={{
                          marginTop: '8px',
                          backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                          border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
                          borderRadius: '12px',
                          padding: '12px',
                          width: '100%',
                          maxWidth: '340px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ fontSize: '10.5px', color: isDark ? '#8696A0' : '#54656F', fontWeight: 700 }}>Origin</label>
                              <select 
                                value={quoteState.originCountry}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  const cities = getCitiesForCountry(c);
                                  setQuoteState(prev => ({ ...prev, originCountry: c, originCity: cities[0] || 'Accra' }));
                                }}
                                style={{
                                  width: '100%',
                                  padding: '5px 6px',
                                  fontSize: '11.5px',
                                  borderRadius: '6px',
                                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                                  backgroundColor: isDark ? '#111B21' : '#FFFFFF',
                                  color: isDark ? '#F8FAFC' : '#0F172A'
                                }}
                              >
                                {COUNTRY_LIST.map(c => <option key={'q-org-' + c} value={c}>{c}</option>)}
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: '10.5px', color: isDark ? '#8696A0' : '#54656F', fontWeight: 700 }}>Destination</label>
                              <select 
                                value={quoteState.destinationCountry}
                                onChange={(e) => {
                                  const c = e.target.value;
                                  const cities = getCitiesForCountry(c);
                                  setQuoteState(prev => ({ ...prev, destinationCountry: c, destinationCity: cities[0] || 'London' }));
                                }}
                                style={{
                                  width: '100%',
                                  padding: '5px 6px',
                                  fontSize: '11.5px',
                                  borderRadius: '6px',
                                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                                  backgroundColor: isDark ? '#111B21' : '#FFFFFF',
                                  color: isDark ? '#F8FAFC' : '#0F172A'
                                }}
                              >
                                {COUNTRY_LIST.map(c => <option key={'q-dst-' + c} value={c}>{c}</option>)}
                              </select>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: '8px', marginBottom: '8px' }}>
                            <div>
                              <label style={{ fontSize: '10.5px', color: isDark ? '#8696A0' : '#54656F', fontWeight: 700 }}>Weight (kg)</label>
                              <input 
                                type="number" 
                                value={quoteState.weight}
                                onChange={e => setQuoteState(prev => ({ ...prev, weight: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '5px 8px',
                                  fontSize: '12px',
                                  borderRadius: '6px',
                                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                                  backgroundColor: isDark ? '#111B21' : '#FFFFFF',
                                  color: isDark ? '#F8FAFC' : '#0F172A'
                                }}
                              />
                            </div>
                            <div>
                              <label style={{ fontSize: '10.5px', color: isDark ? '#8696A0' : '#54656F', fontWeight: 700 }}>Transport Mode</label>
                              <select 
                                value={quoteState.method}
                                onChange={e => setQuoteState(prev => ({ ...prev, method: e.target.value }))}
                                style={{
                                  width: '100%',
                                  padding: '5px 6px',
                                  fontSize: '11.5px',
                                  borderRadius: '6px',
                                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                                  backgroundColor: isDark ? '#111B21' : '#FFFFFF',
                                  color: isDark ? '#F8FAFC' : '#0F172A'
                                }}
                              >
                                <option value="Air Freight Priority">Air Freight Priority (2-4 Days)</option>
                                <option value="Ocean Container Freight">Ocean Container (14-22 Days)</option>
                                <option value="Ground Express Fleet">Ground Freight (1-3 Days)</option>
                                <option value="Rail Intermodal Express">Rail Corridor (4-6 Days)</option>
                              </select>
                            </div>
                          </div>

                          <button
                            onClick={() => handleCalculateQuote()}
                            style={{
                              width: '100%',
                              backgroundColor: '#25D366',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px',
                              boxShadow: '0 2px 6px rgba(37,211,102,0.3)'
                            }}
                          >
                            <Calculator size={14} color="#FFFFFF" />
                            <span>Calculate Instant WhatsApp Quote</span>
                          </button>
                        </div>
                      )}

                      {/* QUOTE RESULT */}
                      {msg.type === 'quote_result' && msg.quoteData && (
                        <div style={{
                          marginTop: '8px',
                          backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                          border: isDark ? '1.5px solid #25D366' : '1.5px solid #25D366',
                          borderRadius: '12px',
                          padding: '12px',
                          width: '100%',
                          maxWidth: '340px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                            <div style={{ fontSize: '22px', fontWeight: 800, color: '#008069' }}>
                              ${msg.quoteData.total} <span style={{ fontSize: '12px', fontWeight: 600, color: isDark ? '#8696A0' : '#54656F' }}>USD</span>
                            </div>
                            <span style={{
                              fontSize: '11px',
                              color: '#008069',
                              fontWeight: 700,
                              backgroundColor: isDark ? 'rgba(37,211,102,0.18)' : '#D9FDD3',
                              padding: '3px 8px',
                              borderRadius: '10px'
                            }}>
                              {msg.quoteData.estimatedDelivery}
                            </span>
                          </div>

                          <div style={{ fontSize: '11.5px', color: isDark ? '#8696A0' : '#54656F', marginBottom: '10px', lineHeight: 1.4 }}>
                            <div>{msg.quoteData.origin} → {msg.quoteData.destination}</div>
                            <div>Tier: <strong>{msg.quoteData.method}</strong> • {msg.quoteData.weight} kg</div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                if (onProceedToShipment) {
                                  onProceedToShipment({
                                    weight: msg.quoteData.weight,
                                    method: msg.quoteData.method,
                                    origin: msg.quoteData.origin,
                                    destination: msg.quoteData.destination
                                  });
                                  setIsOpen(false);
                                }
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: '#075E54',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                              }}
                            >
                              <span>Book Shipment</span>
                              <ArrowRight size={13} color="#FFFFFF" />
                            </button>
                            <button
                              onClick={() => handleOpenExternalWhatsApp(`I would like to book this quote: ${msg.quoteData.origin} to ${msg.quoteData.destination}, ${msg.quoteData.weight}kg, $${msg.quoteData.total} USD.`)}
                              title="Confirm via WhatsApp App"
                              style={{
                                backgroundColor: '#25D366',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <WhatsAppLogo size={16} color="#FFFFFF" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 2. TRACKING PROMPT */}
                      {msg.type === 'tracking_prompt' && (
                        <TrackingPromptInput 
                          onSubmit={handleLookupTracking} 
                          isDark={isDark} 
                        />
                      )}

                      {/* TRACKING RESULT */}
                      {msg.type === 'tracking_result' && msg.shipmentData && (
                        <div style={{
                          marginTop: '8px',
                          backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                          border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
                          borderRadius: '12px',
                          padding: '12px',
                          width: '100%',
                          maxWidth: '340px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <strong style={{ fontSize: '13.5px', color: '#008069', letterSpacing: '0.3px' }}>
                              {msg.shipmentData.trackingNumber || msg.shipmentData.id}
                            </strong>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '2px 8px',
                              borderRadius: '8px',
                              backgroundColor: msg.shipmentData.status === 'DELIVERED' 
                                ? (isDark ? 'rgba(37,211,102,0.2)' : '#D9FDD3') 
                                : msg.shipmentData.status === 'IN TRANSIT' 
                                ? (isDark ? 'rgba(83,189,235,0.2)' : '#E0F2FE') 
                                : (isDark ? 'rgba(245,158,11,0.2)' : '#FFFBEB'),
                              color: msg.shipmentData.status === 'DELIVERED' 
                                ? '#25D366' 
                                : msg.shipmentData.status === 'IN TRANSIT' 
                                ? '#0284C7' 
                                : '#D97706'
                            }}>
                              {msg.shipmentData.status}
                            </span>
                          </div>

                          <div style={{ fontSize: '12px', color: isDark ? '#8696A0' : '#54656F', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '10px' }}>
                            <div>Route: <strong style={{ color: isDark ? '#E9EDEF' : '#111B21' }}>{msg.shipmentData.origin} → {msg.shipmentData.destination}</strong></div>
                            <div>Live Station: <strong style={{ color: isDark ? '#E9EDEF' : '#111B21' }}>{msg.shipmentData.currentLocation || 'In Transit'}</strong></div>
                            <div>ETA: <strong style={{ color: isDark ? '#E9EDEF' : '#111B21' }}>{msg.shipmentData.estimatedDelivery}</strong></div>
                          </div>

                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              onClick={() => {
                                if (onSearchTracking) {
                                  onSearchTracking(msg.shipmentData.trackingNumber || msg.shipmentData.id);
                                  setIsOpen(false);
                                }
                              }}
                              style={{
                                flex: 1,
                                backgroundColor: '#075E54',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px',
                                fontSize: '12px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px'
                              }}
                            >
                              <span>View Telemetry Map</span>
                              <ExternalLink size={12} color="#FFFFFF" />
                            </button>
                            <button
                              onClick={() => handleOpenExternalWhatsApp(`Checking status on consignment: ${msg.shipmentData.trackingNumber || msg.shipmentData.id}`)}
                              title="Discuss with WhatsApp Desk"
                              style={{
                                backgroundColor: '#25D366',
                                color: '#FFFFFF',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '8px 12px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <WhatsAppLogo size={16} color="#FFFFFF" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* 3. TRANSIT ESTIMATES MATRIX */}
                      {msg.type === 'delivery_matrix' && msg.deliveryEstimates && (
                        <div style={{
                          marginTop: '8px',
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: '6px',
                          width: '100%',
                          maxWidth: '340px'
                        }}>
                          {msg.deliveryEstimates.map((est, eIdx) => (
                            <div key={eIdx} style={{
                              backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                              border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
                              borderRadius: '8px',
                              padding: '8px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '3px' }}>
                                <span style={{ color: est.color }}>{renderIcon(est.icon)}</span>
                                <span style={{ fontSize: '11px', fontWeight: 700, color: isDark ? '#E9EDEF' : '#111B21' }}>{est.mode}</span>
                              </div>
                              <div style={{ fontSize: '12.5px', fontWeight: 800, color: est.color }}>{est.duration}</div>
                              <div style={{ fontSize: '10px', color: isDark ? '#8696A0' : '#54656F' }}>Expected: {est.arrival}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 4. LEAD CAPTURE FORM */}
                      {msg.type === 'lead_form' && !leadState.submitted && (
                        <form onSubmit={handleLeadSubmit} style={{
                          marginTop: '8px',
                          backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                          border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
                          borderRadius: '12px',
                          padding: '12px',
                          width: '100%',
                          maxWidth: '340px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '8px'
                        }}>
                          <div>
                            <label style={{ fontSize: '10.5px', color: isDark ? '#8696A0' : '#54656F', fontWeight: 700 }}>Your Name</label>
                            <input
                              type="text"
                              value={leadState.name}
                              onChange={e => setLeadState(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Full name"
                              required
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #CBD5E1', backgroundColor: isDark ? '#111B21' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#0F172A' }}
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '10.5px', color: isDark ? '#8696A0' : '#54656F', fontWeight: 700 }}>Phone / WhatsApp</label>
                            <input
                              type="text"
                              value={leadState.contact}
                              onChange={e => setLeadState(prev => ({ ...prev, contact: e.target.value }))}
                              placeholder="+233 ... or email"
                              required
                              style={{ width: '100%', padding: '6px 8px', fontSize: '12px', borderRadius: '6px', border: isDark ? '1px solid #334155' : '1px solid #CBD5E1', backgroundColor: isDark ? '#111B21' : '#FFFFFF', color: isDark ? '#F8FAFC' : '#0F172A' }}
                            />
                          </div>
                          <button
                            type="submit"
                            style={{
                              backgroundColor: '#25D366',
                              color: '#FFFFFF',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '6px'
                            }}
                          >
                            <Send size={13} color="#FFFFFF" />
                            <span>Submit WhatsApp Callback Request</span>
                          </button>
                        </form>
                      )}

                      {/* 5. HUMAN DIRECT TRANSFER */}
                      {msg.type === 'human_transfer' && (
                        <div style={{
                          marginTop: '8px',
                          backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                          border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
                          borderRadius: '12px',
                          padding: '12px',
                          width: '100%',
                          maxWidth: '340px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px'
                        }}>
                          <a 
                            href="https://wa.me/233245550192?text=Hello%20ACE%20Operations%20Desk%2C%20I%20have%20an%20urgent%20cargo%20inquiry."
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              backgroundColor: isDark ? 'rgba(37,211,102,0.15)' : '#D9FDD3',
                              color: '#008069',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 700
                            }}
                          >
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <WhatsAppLogo size={15} color="#25D366" /> WhatsApp Desk: +233 24 555 0192
                            </span>
                            <ExternalLink size={12} />
                          </a>

                          <a href="tel:+442079460991" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            backgroundColor: isDark ? 'rgba(32,44,51,0.5)' : '#F0F2F5',
                            color: isDark ? '#E9EDEF' : '#111B21',
                            textDecoration: 'none',
                            fontSize: '12px',
                            fontWeight: 700
                          }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Phone size={13} /> Global Command: +44 20 7946 0991
                            </span>
                            <ExternalLink size={12} />
                          </a>

                          {!callbackRequested ? (
                            <form onSubmit={handleRequestCallback} style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                              <input
                                type="tel"
                                placeholder="Your WhatsApp phone number"
                                value={callbackNumber}
                                onChange={e => setCallbackNumber(e.target.value)}
                                required
                                style={{
                                  flex: 1,
                                  padding: '6px 10px',
                                  fontSize: '11.5px',
                                  borderRadius: '6px',
                                  border: isDark ? '1px solid #334155' : '1px solid #CBD5E1',
                                  backgroundColor: isDark ? '#111B21' : '#FFFFFF',
                                  color: isDark ? '#F8FAFC' : '#0F172A',
                                  outline: 'none'
                                }}
                              />
                              <button type="submit" style={{ backgroundColor: '#075E54', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '0 12px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                                Request
                              </button>
                            </form>
                          ) : (
                            <div style={{ fontSize: '11px', color: '#25D366', fontWeight: 700, textAlign: 'center', padding: '4px' }}>
                              ✓ Callback confirmed for {callbackNumber}.
                            </div>
                          )}
                        </div>
                      )}

                      {/* QUICK ACTION BUTTONS (WHATSAPP BUSINESS CHIPS) */}
                      {msg.quickActions && msg.quickActions.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                          {msg.quickActions.map((qa, qaIdx) => (
                            <button
                              key={qaIdx}
                              onClick={() => {
                                if (qa.action === 'quote_air') {
                                  handleCalculateQuote('Air Freight Priority');
                                } else if (qa.action === 'quote_ocean') {
                                  handleCalculateQuote('Ocean Container Freight');
                                } else if (qa.action === 'quote_ground') {
                                  handleCalculateQuote('Ground Express Fleet');
                                } else if (qa.action === 'quote_rail') {
                                  handleCalculateQuote('Rail Intermodal Express');
                                } else if (qa.action === 'simulate_agent_join') {
                                  handleSimulateAgentJoin();
                                } else if (qa.action === 'external_wa') {
                                  handleOpenExternalWhatsApp();
                                } else if (qa.action === 'call_hotline') {
                                  window.location.href = 'tel:+233245550192';
                                } else {
                                  if (qa.action === 'quote') triggerQuoteFlow();
                                  else if (qa.action === 'track') triggerTrackingFlow();
                                  else if (qa.action === 'delivery') triggerDeliveryFlow();
                                  else if (qa.action === 'lead') triggerLeadFlow();
                                  else if (qa.action === 'human') triggerHumanFlow();
                                }
                              }}
                              style={{
                                backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                                color: isDark ? '#E9EDEF' : '#008069',
                                border: isDark ? '1px solid #2A3942' : '1px solid #D1D7DB',
                                borderRadius: '16px',
                                padding: '5px 12px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.06)'
                              }}
                            >
                              <span>
                                {renderIcon(qa.icon || (qa.action === 'quote' ? 'calculator' : qa.action === 'track' ? 'search' : qa.action === 'delivery' ? 'clock' : qa.action === 'lead' ? 'user' : 'headphones'))}
                              </span>
                              <span>{qa.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* WhatsApp Typing Indicator */}
                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}>
                    <div style={{
                      backgroundColor: isDark ? '#202C33' : '#FFFFFF',
                      borderRadius: '0px 10px 10px 10px',
                      padding: '8px 12px',
                      boxShadow: '0 1px 1px rgba(0,0,0,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ fontSize: '11px', color: '#008069', fontWeight: 600 }}>typing</span>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#25D366' }} />
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#25D366' }} />
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: '#25D366' }} />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* WHATSAPP ACTION CHIP BAR */}
              <div style={{
                padding: '6px 10px',
                backgroundColor: isDark ? '#1F2C34' : '#F0F2F5',
                borderTop: isDark ? '1px solid #2A3942' : '1px solid #E9EDEF',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                flexShrink: 0
              }}>
                <button onClick={triggerTrackingFlow} style={{ flexShrink: 0, padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '14px', backgroundColor: isDark ? '#202C33' : '#FFFFFF', color: '#008069', border: '1px solid rgba(0,128,105,0.3)', cursor: 'pointer' }}>
                  📦 Track
                </button>
                <button onClick={triggerQuoteFlow} style={{ flexShrink: 0, padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '14px', backgroundColor: isDark ? '#202C33' : '#FFFFFF', color: '#008069', border: '1px solid rgba(0,128,105,0.3)', cursor: 'pointer' }}>
                  💰 Rate Quote
                </button>
                <button onClick={triggerDeliveryFlow} style={{ flexShrink: 0, padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '14px', backgroundColor: isDark ? '#202C33' : '#FFFFFF', color: '#008069', border: '1px solid rgba(0,128,105,0.3)', cursor: 'pointer' }}>
                  ⏱️ Transit Times
                </button>
                <button onClick={triggerHumanFlow} style={{ flexShrink: 0, padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '14px', backgroundColor: isDark ? '#202C33' : '#FFFFFF', color: '#008069', border: '1px solid rgba(0,128,105,0.3)', cursor: 'pointer' }}>
                  👨‍💼 Dispatcher
                </button>
                <button onClick={() => handleOpenExternalWhatsApp()} style={{ flexShrink: 0, padding: '4px 10px', fontSize: '11px', fontWeight: 700, borderRadius: '14px', backgroundColor: '#25D366', color: '#FFFFFF', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <WhatsAppLogo size={11} color="#FFFFFF" />
                  <span>WhatsApp App</span>
                </button>
              </div>

              {/* WHATSAPP INPUT BAR */}
              <form onSubmit={handleSendMessage} style={{
                padding: '8px 10px',
                backgroundColor: isDark ? '#202C33' : '#F0F2F5',
                borderTop: isDark ? '1px solid #2A3942' : '1px solid #E9EDEF',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flexShrink: 0
              }}>
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: isDark ? '#2A3942' : '#FFFFFF',
                  borderRadius: '24px',
                  padding: '2px 14px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                }}>
                  <input
                    type="text"
                    placeholder="Type a message or consignment code..."
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      fontSize: '13px',
                      border: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      color: isDark ? '#E9EDEF' : '#111B21'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!inputMessage.trim()}
                  aria-label="Send WhatsApp message"
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: inputMessage.trim() ? '#25D366' : (isDark ? '#2A3942' : '#CBD5E1'),
                    color: '#FFFFFF',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inputMessage.trim() ? 'pointer' : 'default',
                    transition: 'all 0.2s',
                    flexShrink: 0
                  }}
                >
                  <Send size={16} color="#FFFFFF" />
                </button>
              </form>
            </>
          )}
        </div>
      )}

      {/* Embedded WhatsApp CSS Micro-Animations and Styles */}
      <style>{`
        .ace-wa-float-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 10px 28px rgba(37, 211, 102, 0.6) !important;
        }
        .ace-wa-pill:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2) !important;
        }
        .ace-wa-panel {
          animation: aceWaSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @keyframes aceWaSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
