/**
 * Documentation Viewer - CDN Embeddable Version
 * 
 * This script can be embedded in any website to provide documentation viewing capabilities.
 * It's completely self-contained and doesn't require any external dependencies.
 * 
 * Usage:
 * 1. Include this script in your HTML
 * 2. Add a container element with id="docs-viewer"
 * 3. Initialize with: new DocsViewer(config)
 */

(function() {
    'use strict';

    // CSS styles (injected into the page)
    const styles = `
        .docs-viewer {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #1f2937;
            background: #f9fafb;
        }

        .docs-viewer .header {
            background: #ffffff;
            padding: 24px;
            border-radius: 8px;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            margin-bottom: 24px;
            border: 1px solid #e5e7eb;
        }

        .docs-viewer .header h1 {
            color: #1f2937;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 8px;
        }

        .docs-viewer .header p {
            color: #6b7280;
            font-size: 1.1rem;
        }

        .docs-viewer .nav {
            display: flex;
            gap: 12px;
            margin-bottom: 24px;
            flex-wrap: wrap;
        }

        .docs-viewer .nav-button {
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

        .docs-viewer .nav-button:hover {
            background: #f9fafb;
            border-color: #3b82f6;
            transform: translateY(-1px);
        }

        .docs-viewer .nav-button.active {
            background: #3b82f6;
            color: white;
            border-color: #3b82f6;
        }

        .docs-viewer .nav-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .docs-viewer .content {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            border: 1px solid #e5e7eb;
            min-height: 500px;
            overflow: hidden;
        }

        .docs-viewer .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 500px;
            color: #6b7280;
        }

        .docs-viewer .spinner {
            width: 24px;
            height: 24px;
            border: 3px solid #e5e7eb;
            border-top: 3px solid #3b82f6;
            border-radius: 50%;
            animation: docs-spin 1s linear infinite;
            margin-right: 12px;
        }

        @keyframes docs-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .docs-viewer .not-found {
            text-align: center;
            padding: 60px 20px;
            color: #6b7280;
        }

        .docs-viewer .not-found h2 {
            color: #1f2937;
            font-size: 1.5rem;
            margin-bottom: 16px;
        }

        .docs-viewer .not-found p {
            margin-bottom: 24px;
            max-width: 500px;
            margin-left: auto;
            margin-right: auto;
        }

        .docs-viewer .assign-button {
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

        .docs-viewer .assign-button:hover:not(:disabled) {
            background: #d97706;
            transform: translateY(-1px);
        }

        .docs-viewer .assign-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
        }

        .docs-viewer .assign-button .icon {
            width: 16px;
            height: 16px;
        }

        .docs-viewer .content-found {
            padding: 32px;
        }

        .docs-viewer .content-found h1 {
            color: #1f2937;
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 16px;
            padding-bottom: 16px;
            border-bottom: 2px solid #3b82f6;
        }

        .docs-viewer .content-found h2 {
            color: #1f2937;
            font-size: 1.5rem;
            font-weight: 600;
            margin-top: 32px;
            margin-bottom: 16px;
        }

        .docs-viewer .content-found h3 {
            color: #1f2937;
            font-size: 1.25rem;
            font-weight: 600;
            margin-top: 24px;
            margin-bottom: 12px;
        }

        .docs-viewer .content-found p {
            margin-bottom: 16px;
            color: #1f2937;
        }

        .docs-viewer .content-found code {
            background: #f9fafb;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
            font-size: 0.9em;
            color: #1f2937;
        }

        .docs-viewer .content-found pre {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            overflow-x: auto;
            border-left: 4px solid #3b82f6;
            margin: 16px 0;
        }

        .docs-viewer .content-found pre code {
            background: none;
            padding: 0;
            color: #1f2937;
        }

        .docs-viewer .error {
            color: #ef4444;
            text-align: center;
            padding: 40px 20px;
            font-weight: 500;
        }

        .docs-viewer .message {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 20px;
            font-weight: 500;
        }

        .docs-viewer .message.success {
            background: #d1fae5;
            color: #065f46;
            border: 1px solid #a7f3d0;
        }

        .docs-viewer .message.error {
            background: #fee2e2;
            color: #991b1b;
            border: 1px solid #fecaca;
        }

        .docs-viewer .examples {
            margin-top: 32px;
        }

        .docs-viewer .example {
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 16px;
        }

        .docs-viewer .example h3 {
            margin-top: 0;
            margin-bottom: 12px;
            color: #1f2937;
        }

        .docs-viewer .best-practices {
            background: #fef3c7;
            border: 1px solid #fde68a;
            border-radius: 8px;
            padding: 20px;
            margin-top: 32px;
        }

        .docs-viewer .best-practices h2 {
            color: #92400e;
            margin-top: 0;
            margin-bottom: 16px;
        }

        .docs-viewer .best-practices ul {
            list-style: none;
            padding: 0;
        }

        .docs-viewer .best-practices li {
            padding: 8px 0;
            padding-left: 24px;
            position: relative;
        }

        .docs-viewer .best-practices li::before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }

        .docs-viewer .troubleshooting {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 8px;
            padding: 20px;
            margin-top: 32px;
        }

        .docs-viewer .troubleshooting h2 {
            color: #991b1b;
            margin-top: 0;
            margin-bottom: 16px;
        }

        .docs-viewer .issue {
            margin-bottom: 16px;
            padding: 12px;
            background: white;
            border-radius: 4px;
            border-left: 4px solid #ef4444;
        }

        .docs-viewer .issue strong {
            color: #1f2937;
        }

        .docs-viewer .issue p {
            margin-top: 8px;
            margin-bottom: 0;
            color: #6b7280;
        }

        @media (max-width: 768px) {
            .docs-viewer {
                padding: 16px;
            }

            .docs-viewer .nav {
                flex-direction: column;
            }

            .docs-viewer .nav-button {
                text-align: center;
            }

            .docs-viewer .content-found {
                padding: 20px;
            }

            .docs-viewer .header h1 {
                font-size: 1.5rem;
            }
        }
    `;

    // Inject styles into the page
    function injectStyles() {
        if (!document.getElementById('docs-viewer-styles')) {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'docs-viewer-styles';
            styleSheet.textContent = styles;
            document.head.appendChild(styleSheet);
        }
    }

    // Main Documentation Viewer class
    class DocsViewer {
        constructor(config = {}) {
            this.config = {
                containerId: config.containerId || 'docs-viewer',
                apiBase: config.apiBase || '/api/docs',
                sections: config.sections || [
                    { id: 'agents', label: 'Agents' },
                    { id: 'orchestration', label: 'Orchestration' },
                    { id: 'api', label: 'API' },
                    { id: 'deployment', label: 'Deployment' },
                    { id: 'troubleshooting', label: 'Troubleshooting' }
                ],
                defaultSection: config.defaultSection || 'agents',
                title: config.title || 'Documentation Viewer',
                description: config.description || 'Dynamic documentation served from Cloudflare R2 with AI agent assignment capabilities'
            };
            
            this.currentSection = this.config.defaultSection;
            this.assignmentInProgress = false;
            this.messages = [];
            
            // Inject styles
            injectStyles();
            
            // Initialize
            this.init();
        }

        init() {
            const container = document.getElementById(this.config.containerId);
            if (!container) {
                console.error(`Container with id "${this.config.containerId}" not found`);
                return;
            }

            this.container = container;
            this.render();
            this.loadSection(this.currentSection);
        }

        render() {
            this.container.innerHTML = `
                <div class="docs-viewer">
                    <div class="header">
                        <h1>${this.escapeHtml(this.config.title)}</h1>
                        <p>${this.escapeHtml(this.config.description)}</p>
                    </div>

                    <div class="nav" id="${this.config.containerId}-nav">
                        ${this.config.sections.map(section => `
                            <button 
                                class="nav-button ${section.id === this.currentSection ? 'active' : ''}"
                                data-section="${section.id}"
                            >
                                ${this.escapeHtml(section.label)}
                            </button>
                        `).join('')}
                    </div>

                    <div class="content" id="${this.config.containerId}-content">
                        <div class="loading">
                            <div class="spinner"></div>
                            <span>Loading...</span>
                        </div>
                    </div>
                </div>
            `;

            // Add event listeners
            this.addEventListeners();
        }

        addEventListeners() {
            const nav = document.getElementById(`${this.config.containerId}-nav`);
            if (nav) {
                nav.addEventListener('click', (e) => {
                    if (e.target.classList.contains('nav-button')) {
                        const sectionId = e.target.dataset.section;
                        if (sectionId) {
                            this.loadSection(sectionId);
                        }
                    }
                });
            }
        }

        async loadSection(sectionId) {
            this.currentSection = sectionId;
            this.updateNavigation();
            this.showLoading();

            try {
                const response = await fetch(`${this.config.apiBase}/${sectionId}`);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                
                if (data.status === 'found') {
                    this.displayContent(data.content);
                } else if (data.status === 'not_found') {
                    this.displayNotFound(sectionId);
                } else {
                    this.displayError(data.message || 'Unknown error occurred');
                }
            } catch (error) {
                console.error('Error loading documentation:', error);
                this.displayError(`Failed to load documentation: ${error.message}`);
            }
        }

        updateNavigation() {
            const nav = document.getElementById(`${this.config.containerId}-nav`);
            if (nav) {
                nav.querySelectorAll('.nav-button').forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.dataset.section === this.currentSection) {
                        btn.classList.add('active');
                    }
                });
            }
        }

        showLoading() {
            const content = document.getElementById(`${this.config.containerId}-content`);
            if (content) {
                content.innerHTML = `
                    <div class="loading">
                        <div class="spinner"></div>
                        <span>Loading documentation...</span>
                    </div>
                `;
            }
        }

        displayContent(content) {
            const contentDiv = document.getElementById(`${this.config.containerId}-content`);
            if (!contentDiv) return;
            
            if (typeof content === 'string') {
                contentDiv.innerHTML = `<div class="content-found">${content}</div>`;
            } else {
                contentDiv.innerHTML = this.renderStructuredContent(content);
            }
        }

        renderStructuredContent(content) {
            let html = '<div class="content-found">';
            
            if (content.title) {
                html += `<h1>${this.escapeHtml(content.title)}</h1>`;
            }
            
            if (content.description) {
                html += `<p>${this.escapeHtml(content.description)}</p>`;
            }
            
            if (content.sections) {
                content.sections.forEach(section => {
                    html += `<h2>${this.escapeHtml(section.title)}</h2>`;
                    if (section.content) {
                        html += `<p>${this.escapeHtml(section.content)}</p>`;
                    }
                    if (section.code) {
                        html += `<pre><code>${this.escapeHtml(section.code)}</code></pre>`;
                    }
                });
            }
            
            if (content.examples && content.examples.length > 0) {
                html += '<div class="examples">';
                html += '<h2>Examples</h2>';
                content.examples.forEach(example => {
                    html += `
                        <div class="example">
                            <h3>${this.escapeHtml(example.title)}</h3>
                            <pre><code>${this.escapeHtml(example.code)}</code></pre>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            if (content.bestPractices && content.bestPractices.length > 0) {
                html += '<div class="best-practices">';
                html += '<h2>Best Practices</h2>';
                html += '<ul>';
                content.bestPractices.forEach(practice => {
                    html += `<li>${this.escapeHtml(practice)}</li>`;
                });
                html += '</ul>';
                html += '</div>';
            }
            
            if (content.troubleshooting && content.troubleshooting.commonIssues) {
                html += '<div class="troubleshooting">';
                html += '<h2>Troubleshooting</h2>';
                content.troubleshooting.commonIssues.forEach(issue => {
                    html += `
                        <div class="issue">
                            <strong>${this.escapeHtml(issue.issue)}</strong>
                            <p>${this.escapeHtml(issue.solution)}</p>
                        </div>
                    `;
                });
                html += '</div>';
            }
            
            html += '</div>';
            return html;
        }

        displayNotFound(section) {
            const contentDiv = document.getElementById(`${this.config.containerId}-content`);
            if (!contentDiv) return;

            contentDiv.innerHTML = `
                <div class="not-found">
                    <h2>Coming soon...</h2>
                    <p>The documentation for "${this.escapeHtml(section)}" is not yet available.</p>
                    <p>Our AI agents are working hard to create comprehensive documentation for this section.</p>
                    <button class="assign-button" onclick="window.docsViewerInstance.assignAgent('${section}')" ${this.assignmentInProgress ? 'disabled' : ''}>
                        ${this.assignmentInProgress ? `
                            <div class="spinner"></div>
                            Assigning...
                        ` : `
                            <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path>
                            </svg>
                            Assign AI Bot
                        `}
                    </button>
                </div>
            `;
        }

        displayError(message) {
            const contentDiv = document.getElementById(`${this.config.containerId}-content`);
            if (contentDiv) {
                contentDiv.innerHTML = `<div class="error">Error: ${this.escapeHtml(message)}</div>`;
            }
        }

        async assignAgent(section) {
            if (this.assignmentInProgress) return;
            
            this.assignmentInProgress = true;
            const button = document.querySelector('.assign-button');
            if (button) {
                button.disabled = true;
                button.innerHTML = `
                    <div class="spinner"></div>
                    Assigning...
                `;
            }
            
            try {
                const response = await fetch(`${this.config.apiBase}/assign-agent`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        section: section,
                        priority: 'medium',
                        requirements: [
                            'Comprehensive overview',
                            'Code examples',
                            'Best practices',
                            'Troubleshooting guide'
                        ]
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'queued') {
                    this.showMessage(`AI agent assigned to write documentation for "${section}". Request ID: ${data.requestId}`, 'success');
                } else {
                    this.showMessage(data.message || 'Failed to assign AI agent', 'error');
                }
            } catch (error) {
                console.error('Error assigning agent:', error);
                this.showMessage('Failed to assign AI agent', 'error');
            } finally {
                this.assignmentInProgress = false;
                if (button) {
                    button.disabled = false;
                    button.innerHTML = `
                        <svg class="icon" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd"></path>
                        </svg>
                        Assign AI Bot
                    `;
                }
            }
        }

        showMessage(text, type) {
            const contentDiv = document.getElementById(`${this.config.containerId}-content`);
            if (!contentDiv) return;

            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${type}`;
            messageDiv.textContent = text;
            
            contentDiv.insertBefore(messageDiv, contentDiv.firstChild);
            
            // Remove message after 5 seconds
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.remove();
                }
            }, 5000);
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // Auto-initialize if container exists
    function autoInit() {
        const container = document.getElementById('docs-viewer');
        if (container && !window.docsViewerInstance) {
            window.docsViewerInstance = new DocsViewer();
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // Export for manual initialization
    window.DocsViewer = DocsViewer;
})(); 