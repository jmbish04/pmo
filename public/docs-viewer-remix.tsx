import React, { useState, useEffect } from 'react';

interface DocsViewerProps {
  apiBase?: string;
  sections?: Array<{ id: string; label: string }>;
  defaultSection?: string;
}

interface DocsContent {
  title?: string;
  description?: string;
  sections?: Array<{
    title: string;
    content?: string;
    code?: string;
  }>;
  examples?: Array<{
    title: string;
    code: string;
  }>;
  bestPractices?: string[];
  troubleshooting?: {
    commonIssues: Array<{
      issue: string;
      solution: string;
    }>;
  };
}

interface DocsResponse {
  status: 'found' | 'not_found' | 'error';
  content?: DocsContent;
  message?: string;
  timestamp: string;
}

interface AssignAgentRequest {
  section: string;
  priority?: 'low' | 'medium' | 'high';
  requirements?: string[];
}

interface AssignAgentResponse {
  status: 'queued' | 'error';
  requestId: string;
  message: string;
  timestamp: string;
}

const DocumentationViewer: React.FC<DocsViewerProps> = ({
  apiBase = '/api/docs',
  sections = [
    { id: 'agents', label: 'Agents' },
    { id: 'orchestration', label: 'Orchestration' },
    { id: 'api', label: 'API' },
    { id: 'deployment', label: 'Deployment' },
    { id: 'troubleshooting', label: 'Troubleshooting' }
  ],
  defaultSection = 'agents'
}) => {
  const [currentSection, setCurrentSection] = useState(defaultSection);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState<DocsContent | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [assignmentInProgress, setAssignmentInProgress] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadSection(currentSection);
  }, [currentSection]);

  const loadSection = async (sectionId: string) => {
    setLoading(true);
    setError(null);
    setContent(null);
    setNotFound(false);

    try {
      const response = await fetch(`${apiBase}/${sectionId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: DocsResponse = await response.json();
      
      if (data.status === 'found') {
        setContent(data.content || null);
      } else if (data.status === 'not_found') {
        setNotFound(true);
      } else {
        setError(data.message || 'Unknown error occurred');
      }
    } catch (err) {
      console.error('Error loading documentation:', err);
      setError(`Failed to load documentation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const assignAgent = async (section: string) => {
    if (assignmentInProgress) return;
    
    setAssignmentInProgress(true);
    
    try {
      const request: AssignAgentRequest = {
        section,
        priority: 'medium',
        requirements: [
          'Comprehensive overview',
          'Code examples',
          'Best practices',
          'Troubleshooting guide'
        ]
      };

      const response = await fetch(`${apiBase}/assign-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(request)
      });
      
      const data: AssignAgentResponse = await response.json();
      
      if (data.status === 'queued') {
        showMessage(`AI agent assigned to write documentation for "${section}". Request ID: ${data.requestId}`, 'success');
      } else {
        showMessage(data.message || 'Failed to assign AI agent', 'error');
      }
    } catch (err) {
      console.error('Error assigning agent:', err);
      showMessage('Failed to assign AI agent', 'error');
    } finally {
      setAssignmentInProgress(false);
    }
  };

  const showMessage = (text: string, type: 'success' | 'error') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const renderContent = (content: DocsContent) => {
    return (
      <div className="content-found">
        {content.title && <h1>{content.title}</h1>}
        {content.description && <p>{content.description}</p>}
        
        {content.sections?.map((section, index) => (
          <div key={index}>
            <h2>{section.title}</h2>
            {section.content && <p>{section.content}</p>}
            {section.code && (
              <pre>
                <code>{section.code}</code>
              </pre>
            )}
          </div>
        ))}
        
        {content.examples && content.examples.length > 0 && (
          <div className="examples">
            <h2>Examples</h2>
            {content.examples.map((example, index) => (
              <div key={index} className="example">
                <h3>{example.title}</h3>
                <pre>
                  <code>{example.code}</code>
                </pre>
              </div>
            ))}
          </div>
        )}
        
        {content.bestPractices && content.bestPractices.length > 0 && (
          <div className="best-practices">
            <h2>Best Practices</h2>
            <ul>
              {content.bestPractices.map((practice, index) => (
                <li key={index}>{practice}</li>
              ))}
            </ul>
          </div>
        )}
        
        {content.troubleshooting?.commonIssues && (
          <div className="troubleshooting">
            <h2>Troubleshooting</h2>
            {content.troubleshooting.commonIssues.map((issue, index) => (
              <div key={index} className="issue">
                <strong>{issue.issue}</strong>
                <p>{issue.solution}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="docs-viewer">
      <div className="header">
        <h1>Documentation Viewer</h1>
        <p>Dynamic documentation served from Cloudflare R2 with AI agent assignment capabilities</p>
      </div>

      <div className="nav">
        {sections.map((section) => (
          <button
            key={section.id}
            className={`nav-button ${section.id === currentSection ? 'active' : ''}`}
            onClick={() => setCurrentSection(section.id)}
          >
            {section.label}
          </button>
        ))}
      </div>

      <div className="content">
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <span>Loading documentation...</span>
          </div>
        )}

        {error && (
          <div className="error">
            Error: {error}
          </div>
        )}

        {notFound && (
          <div className="not-found">
            <h2>Coming soon...</h2>
            <p>The documentation for "{currentSection}" is not yet available.</p>
            <p>Our AI agents are working hard to create comprehensive documentation for this section.</p>
            <button
              className="assign-button"
              onClick={() => assignAgent(currentSection)}
              disabled={assignmentInProgress}
            >
              {assignmentInProgress ? (
                <>
                  <div className="spinner"></div>
                  Assigning...
                </>
              ) : (
                <>
                  <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd"></path>
                  </svg>
                  Assign AI Bot
                </>
              )}
            </button>
          </div>
        )}

        {content && renderContent(content)}
      </div>

      <style jsx>{`
        .docs-viewer {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #1f2937;
          background: #f9fafb;
        }

        .header {
          background: #ffffff;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          margin-bottom: 24px;
          border: 1px solid #e5e7eb;
        }

        .header h1 {
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .header p {
          color: #6b7280;
          font-size: 1.1rem;
        }

        .nav {
          display: flex;
          gap: 12px;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }

        .nav-button {
          padding: 12px 20px;
          border: 1px solid #e5e7eb;
          background: #ffffff;
          color: #1f2937;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .nav-button:hover {
          background: #f9fafb;
          border-color: #3b82f6;
          transform: translateY(-1px);
        }

        .nav-button.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }

        .nav-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .content {
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          border: 1px solid #e5e7eb;
          min-height: 500px;
          overflow: hidden;
        }

        .loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 500px;
          color: #6b7280;
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 3px solid #e5e7eb;
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-right: 12px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .not-found {
          text-align: center;
          padding: 60px 20px;
          color: #6b7280;
        }

        .not-found h2 {
          color: #1f2937;
          font-size: 1.5rem;
          margin-bottom: 16px;
        }

        .not-found p {
          margin-bottom: 24px;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }

        .assign-button {
          background: #f59e0b;
          color: white;
          border: none;
          padding: 14px 28px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .assign-button:hover:not(:disabled) {
          background: #d97706;
          transform: translateY(-1px);
        }

        .assign-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .assign-button .icon {
          width: 16px;
          height: 16px;
        }

        .content-found {
          padding: 32px;
        }

        .content-found h1 {
          color: #1f2937;
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 16px;
          padding-bottom: 16px;
          border-bottom: 2px solid #3b82f6;
        }

        .content-found h2 {
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 32px;
          margin-bottom: 16px;
        }

        .content-found h3 {
          color: #1f2937;
          font-size: 1.25rem;
          font-weight: 600;
          margin-top: 24px;
          margin-bottom: 12px;
        }

        .content-found p {
          margin-bottom: 16px;
          color: #1f2937;
        }

        .content-found code {
          background: #f9fafb;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 0.9em;
          color: #1f2937;
        }

        .content-found pre {
          background: #f9fafb;
          padding: 20px;
          border-radius: 8px;
          overflow-x: auto;
          border-left: 4px solid #3b82f6;
          margin: 16px 0;
        }

        .content-found pre code {
          background: none;
          padding: 0;
          color: #1f2937;
        }

        .error {
          color: #ef4444;
          text-align: center;
          padding: 40px 20px;
          font-weight: 500;
        }

        .message {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .examples {
          margin-top: 32px;
        }

        .example {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
        }

        .example h3 {
          margin-top: 0;
          margin-bottom: 12px;
          color: #1f2937;
        }

        .best-practices {
          background: #fef3c7;
          border: 1px solid #fde68a;
          border-radius: 8px;
          padding: 20px;
          margin-top: 32px;
        }

        .best-practices h2 {
          color: #92400e;
          margin-top: 0;
          margin-bottom: 16px;
        }

        .best-practices ul {
          list-style: none;
          padding: 0;
        }

        .best-practices li {
          padding: 8px 0;
          padding-left: 24px;
          position: relative;
        }

        .best-practices li::before {
          content: "✓";
          position: absolute;
          left: 0;
          color: #10b981;
          font-weight: bold;
        }

        .troubleshooting {
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 8px;
          padding: 20px;
          margin-top: 32px;
        }

        .troubleshooting h2 {
          color: #991b1b;
          margin-top: 0;
          margin-bottom: 16px;
        }

        .issue {
          margin-bottom: 16px;
          padding: 12px;
          background: white;
          border-radius: 4px;
          border-left: 4px solid #ef4444;
        }

        .issue strong {
          color: #1f2937;
        }

        .issue p {
          margin-top: 8px;
          margin-bottom: 0;
          color: #6b7280;
        }

        @media (max-width: 768px) {
          .docs-viewer {
            padding: 16px;
          }

          .nav {
            flex-direction: column;
          }

          .nav-button {
            text-align: center;
          }

          .content-found {
            padding: 20px;
          }

          .header h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DocumentationViewer; 