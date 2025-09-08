// src/App.tsx
import { useState, useEffect, useRef } from 'react';
import { RAGChatService } from './services/ragService';
import type { Document } from './services/ragService';
import './global.css';

// Type definitions
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Document[];
}

// Initialize RAG service
const mistralApiKey = import.meta.env.VITE_MISTRAL_API_KEY;
let ragService: RAGChatService | null = null;

if (mistralApiKey) {
  ragService = new RAGChatService(mistralApiKey);
}

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'no-key'>('connecting');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isKnowledgeVisible, setIsKnowledgeVisible] = useState(false);
  const [knowledgeBase, setKnowledgeBase] = useState<Document[]>([]);
  const [newWebsiteUrl, setNewWebsiteUrl] = useState('');
  const [isAddingContent, setIsAddingContent] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load knowledge base
  const loadKnowledgeBase = () => {
    if (ragService) {
      setKnowledgeBase(ragService.getKnowledgeBase().getAllDocuments());
    }
  };

  // Initialize Testcompany content in knowledge base
  const initializeTestcompanyContent = async () => {
    if (!ragService) return;
    
    const kb = ragService.getKnowledgeBase();
    const existingDocs = kb.getAllDocuments();
    
    // Check if Testcompany content already exists
    const hasTestcompanyContent = existingDocs.some(doc => 
      doc.title.includes('Testcompany')
    );
    
    if (!hasTestcompanyContent) {
      // Add all Testcompany information to knowledge base
      const testcompanyDocs = [
        {
          title: 'Testcompany - Übersicht und Geschäftsbeschreibung',
          content: `Testcompany ist ein zukunftsorientierter Anbieter von Workspace-Lösungen und Innenarchitektur-Konzepten. 
          Seit der Gründung im Jahr 2010 konzentriert sich das Unternehmen darauf, Umgebungen zu schaffen, die Funktionalität, 
          Ästhetik und emotionale Wirkung vereinen. Wir glauben, dass jeder Raum eine Geschichte erzählt. 
          Unsere Mission ist es, Umgebungen zu gestalten, die inspirieren, die Produktivität unterstützen und die Identität 
          derjenigen widerspiegeln, die sie nutzen.`
        },
        {
          title: 'Testcompany - Öffnungszeiten',
          content: `Die Öffnungszeiten von Testcompany sind:
          Montag bis Freitag: 09:00 – 18:00 Uhr
          Samstag: 10:00 – 14:00 Uhr
          Sonntag: Geschlossen
          An Feiertagen: Sonderöffnungszeiten auf Anfrage`
        },
        {
          title: 'Testcompany - Kontaktinformationen',
          content: `Kontaktdaten von Testcompany:
          Adresse: Teststr. 1, 12345 Test, Deutschland
          Telefon: +49 (0)123 456789
          E-Mail: info@testcompany.com
          Website: www.testcompany.com
          Das Büro ist zentral gelegen und gut mit öffentlichen Verkehrsmitteln erreichbar. 
          Parkplätze sind in der Tiefgarage des Gebäudes vorhanden, Einfahrt über die Samplestraße.`
        },
        {
          title: 'Testcompany - Kerndienstleistungen',
          content: `Testcompany bietet folgende Kerndienstleistungen an:
          1. Innenarchitektur und Raumplanung - Professionelle Gestaltung von Arbeits- und Wohnräumen
          2. Maßgeschneidertes Möbeldesign - Individuelle Möbellösungen nach Kundenwunsch
          3. Projektmanagement und Bauüberwachung - Komplette Betreuung von Bauprojekten
          4. Lichtdesign und Akustikoptimierung - Optimale Beleuchtung und Raumakustik für produktive Umgebungen`
        },
        {
          title: 'Testcompany - Team und Philosophie',
          content: `Das multidisziplinäre Team von Testcompany umfasst Architekten, Designer, Ingenieure und Handwerker. 
          Gemeinsam verwandeln wir Ideen in greifbare, bewohnbare Räume. Unsere Unternehmensphilosophie: 
          Wir glauben, dass jeder Raum eine Geschichte erzählt. Unsere Mission ist es, Umgebungen zu gestalten, 
          die inspirieren, die Produktivität unterstützen und die Identität derjenigen widerspiegeln, die sie nutzen.`
        },
        {
          title: 'Testcompany - Kundenbewertungen',
          content: `Kundenstimme von Max R. aus Hamburg: "Die Zusammenarbeit mit Testcompany war ein Wendepunkt. 
          Ihre Liebe zum Detail und ihr kreativer Ansatz haben unser Büro in einen Ort verwandelt, an dem die Menschen 
          gerne arbeiten." Testcompany hat zahlreiche zufriedene Kunden in ganz Deutschland.`
        },
        {
          title: 'Testcompany - Nachhaltigkeit',
          content: `Testcompany legt großen Wert auf Nachhaltigkeit. Wir priorisieren umweltfreundliche Materialien, 
          energieeffiziente Systeme und lokale Partnerschaften. Nachhaltigkeit ist für uns kein Trend, 
          sondern eine Verantwortung. Alle unsere Projekte werden unter Berücksichtigung ökologischer Aspekte geplant und umgesetzt.`
        },
        {
          title: 'Testcompany - FAQ',
          content: `Häufig gestellte Fragen zu Testcompany:
          Frage: Arbeiten Sie auch mit Privatkunden?
          Antwort: Ja, wir bieten Dienstleistungen sowohl für gewerbliche als auch für private Projekte an.
          
          Frage: Kann ich online einen Termin buchen?
          Antwort: Auf jeden Fall – besuchen Sie einfach unsere Website und nutzen Sie das Buchungstool.`
        }
      ];
      
      // Add each document to knowledge base
      for (const doc of testcompanyDocs) {
        try {
          await kb.addDocument(doc.title, doc.content, { source: 'manual' as const });
        } catch (error) {
          console.error('Error adding Testcompany content:', error);
        }
      }
    }
  };

  // Test connection and initialize
  useEffect(() => {
    const testConnection = async () => {
      if (!mistralApiKey) {
        setConnectionStatus('no-key');
        return;
      }

      if (!ragService) {
        setConnectionStatus('error');
        return;
      }

      try {
        const testResult = await ragService.chatWithRAG('Hello, are you working?');
        
        if (testResult.response) {
          setConnectionStatus('connected');
          
          // Initialize Testcompany content
          await initializeTestcompanyContent();
          
          // Load knowledge base after initialization
          loadKnowledgeBase();
          
          // Add welcome message
          const welcomeMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'assistant',
            content: 'Hallo! Ich bin Ihr AI-Assistent mit umfangreichen Informationen über Testcompany. Ich kann Ihnen bei Fragen zu unseren Öffnungszeiten (Mo-Fr: 09:00-18:00, Sa: 10:00-14:00), Dienstleistungen, Kontaktdaten und vielem mehr helfen. Wie kann ich Ihnen heute helfen?',
            timestamp: new Date()
          };
          setMessages([welcomeMessage]);
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        console.error('Connection test failed:', error);
        setConnectionStatus('error');
      }
    };

    testConnection();
  }, []);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !ragService || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const result = await ragService.chatWithRAG(inputMessage, messages);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: result.response,
        timestamp: new Date(),
        sources: result.sources.length > 0 ? result.sources : undefined
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your message. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const addWebsiteContent = async () => {
    if (!newWebsiteUrl.trim() || !ragService) return;
    
    setIsAddingContent(true);
    try {
      await ragService.addWebsiteContent(newWebsiteUrl);
      setNewWebsiteUrl('');
      loadKnowledgeBase();
      alert('Website content added successfully!');
    } catch (error) {
      console.error('Error adding website:', error);
      alert('Error adding website content. Please check the URL and try again.');
    } finally {
      setIsAddingContent(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!ragService) return;
    
    setIsAddingContent(true);
    try {
      await ragService.addFileContent(file);
      loadKnowledgeBase();
      alert('File content added successfully!');
    } catch (error) {
      console.error('Error adding file:', error);
      alert('Error adding file content. Please check the file format and try again.');
    } finally {
      setIsAddingContent(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeDocument = (id: string) => {
    if (!ragService) return;
    
    const success = ragService.getKnowledgeBase().removeDocument(id);
    if (success) {
      loadKnowledgeBase();
      alert('Document removed successfully!');
    }
  };

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusDisplay = () => {
    switch (connectionStatus) {
      case 'connecting':
        return { text: 'Connecting to Mistral AI...', color: '#ffa500' };
      case 'connected':
        return { text: 'Connected to Mistral AI with RAG', color: '#4caf50' };
      case 'error':
        return { text: 'Error connecting to Mistral AI. Check your API key and network.', color: '#f44336' };
      case 'no-key':
        return { text: 'No API key found. Please set VITE_MISTRAL_API_KEY in your .env file.', color: '#f44336' };
      default:
        return { text: 'Unknown status', color: '#757575' };
    }
  };

  const status = getStatusDisplay();

  return (
    <div className="app-container">
      <h1>Mistral RAG AI Chatbot</h1>
      <p>Welcome to your AI-powered chat application with RAG (Retrieval-Augmented Generation).</p>
      <p style={{ color: status.color }}>
        <strong>Status:</strong> {status.text}
      </p>
      
      {/* Company Information Section - NEW */}
      <div className="company-info-section">
        <h2>Testcompany</h2>
        
        <div className="info-block">
          <h3>Business Description</h3>
          <p>Testcompany is a forward-thinking provider of workspace solutions and interior design concepts. Since its founding in 2010, the company has focused on creating environments that combine functionality, aesthetics, and emotional impact.</p>
        </div>

        <div className="info-block">
          <h3>Opening Hours</h3>
          <p>Monday to Friday: 09:00 – 18:00</p>
          <p>Saturday: 10:00 – 14:00</p>
          <p>Sunday: Closed</p>
          <p>Public Holidays: Special hours upon request</p>
        </div>

        <div className="info-block">
          <h3>Contact Information</h3>
          <p>📍 Address: Teststr. 1, 12345 Test, Germany</p>
          <p>📞 Phone: +49 (0)123 456789</p>
          <p>📧 Email: info@testcompany.com</p>
          <p>🌐 Website: www.testcompany.com</p>
        </div>

        <div className="info-block">
          <h3>Core Services</h3>
          <ul>
            <li>Interior architecture & space planning</li>
            <li>Custom furniture design</li>
            <li>Project management & construction oversight</li>
            <li>Lighting design & acoustic optimization</li>
          </ul>
        </div>

        <div className="info-block">
          <h3>Company Philosophy</h3>
          <p>We believe that every space tells a story. Our mission is to design environments that inspire, support productivity, and reflect the identity of those who use them.</p>
        </div>

        <div className="info-block">
          <h3>Team Overview</h3>
          <p>Our multidisciplinary team includes architects, designers, engineers, and craftspeople. Together, we turn ideas into tangible, livable spaces.</p>
        </div>

        <div className="info-block">
          <h3>Client Testimonials</h3>
          <blockquote>
            "Working with Testcompany was a game-changer. Their attention to detail and creative approach transformed our office into a place people love to be." – Max R., Hamburg
          </blockquote>
        </div>

        <div className="info-block">
          <h3>Sustainability Commitment</h3>
          <p>We prioritize eco-friendly materials, energy-efficient systems, and local partnerships. Sustainability is not a trend for us—it's a responsibility.</p>
        </div>

        <div className="info-block">
          <h3>Directions & Parking</h3>
          <p>Our office is centrally located and easily accessible via public transport. Parking is available in the building's underground garage, entrance via Samplestraße.</p>
        </div>

        <div className="info-block">
          <h3>Frequently Asked Questions</h3>
          <div className="faq-item">
            <p><strong>Q: Do you work with private clients?</strong></p>
            <p>A: Yes, we offer services for both commercial and residential projects.</p>
          </div>
          <div className="faq-item">
            <p><strong>Q: Can I book an appointment online?</strong></p>
            <p>A: Absolutely—just visit our website and use the booking tool.</p>
          </div>
        </div>
      </div>
      
      {connectionStatus === 'no-key' && (
        <div className="setup-warning">
          <h3>Setup Required:</h3>
          <ol>
            <li>Create a <code>.env</code> file in your project root</li>
            <li>Add your Mistral API key: <code>VITE_MISTRAL_API_KEY=your_api_key_here</code></li>
            <li>Get your API key from <a href="https://console.mistral.ai/" target="_blank" rel="noopener noreferrer">https://console.mistral.ai/</a></li>
            <li>Restart your development server</li>
          </ol>
        </div>
      )}

      {connectionStatus === 'connected' && (
        <div className="controls-section">
          <button
            onClick={() => setIsChatVisible(!isChatVisible)}
            className="chat-toggle-btn"
          >
            {isChatVisible ? 'Hide Chat' : 'Open Chat'}
          </button>
          <button
            onClick={() => setIsKnowledgeVisible(!isKnowledgeVisible)}
            className="knowledge-toggle-btn"
          >
            {isKnowledgeVisible ? 'Hide Knowledge Base' : 'Manage Knowledge Base'}
          </button>
        </div>
      )}

      {/* Knowledge Management Section */}
      {connectionStatus === 'connected' && isKnowledgeVisible && (
        <div className="knowledge-management">
          <h3>Knowledge Base Management</h3>
          
          {/* Add Website Content */}
          <div className="add-content-section">
            <h4>Add Website Content</h4>
            <div className="website-input-group">
              <input
                type="url"
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
                placeholder="Enter website URL (e.g., https://example.com)"
                className="website-input"
                disabled={isAddingContent}
              />
              <button
                onClick={addWebsiteContent}
                disabled={!newWebsiteUrl.trim() || isAddingContent}
                className="add-content-btn"
              >
                {isAddingContent ? 'Adding...' : 'Add Website'}
              </button>
            </div>
          </div>

          {/* Add File Content */}
          <div className="add-content-section">
            <h4>Upload Document</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.json"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
              className="file-input"
              disabled={isAddingContent}
            />
            <p className="file-info">Supported formats: .txt, .json</p>
          </div>

          {/* Knowledge Base Documents */}
          <div className="documents-section">
            <h4>Current Documents ({knowledgeBase.length})</h4>
            {knowledgeBase.length === 0 ? (
              <p>No documents in knowledge base yet.</p>
            ) : (
              <div className="documents-list">
                {knowledgeBase.map((doc) => (
                  <div key={doc.id} className="document-item">
                    <div className="document-header">
                      <h5>{doc.title}</h5>
                      <button
                        onClick={() => removeDocument(doc.id)}
                        className="remove-doc-btn"
                        title="Remove document"
                      >
                        ×
                      </button>
                    </div>
                    <div className="document-meta">
                      <span className="source-tag">{doc.metadata.source}</span>
                      <span className="date-tag">
                        {doc.metadata.createdAt.toLocaleDateString()}
                      </span>
                      {doc.metadata.url && (
                        <a 
                          href={doc.metadata.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="url-link"
                        >
                          View Source
                        </a>
                      )}
                    </div>
                    <div className="document-preview">
                      {doc.content.substring(0, 150)}
                      {doc.content.length > 150 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Widget */}
      {connectionStatus === 'connected' && isChatVisible && (
        <div className="chatbot-widget">
          <div className="chat-header">
            <h3>AI Assistant with RAG</h3>
            <button
              onClick={() => setIsChatVisible(false)}
              className="chat-close-btn"
            >
              ×
            </button>
          </div>

          <div className="messages-container">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.role === 'user' ? 'user-message' : 'assistant-message'}`}
              >
                <div className="message-content">{message.content}</div>
                {message.sources && message.sources.length > 0 && (
                  <div className="message-sources">
                    <strong>Sources:</strong>
                    {message.sources.map((source, index) => (
                      <span key={source.id} className="source-reference">
                        {source.title}
                        {index < message.sources!.length - 1 && ', '}
                      </span>
                    ))}
                  </div>
                )}
                <div className="message-time">
                  {formatTime(message.timestamp)}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="message assistant-message">
                <div className="typing-indicator">
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                  <div className="typing-dot"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-container">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything about the knowledge base..."
              disabled={isLoading}
              className="chat-input"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className={`chat-send-btn ${inputMessage.trim() && !isLoading ? 'active' : 'disabled'}`}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;