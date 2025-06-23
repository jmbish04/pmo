# Documentation Viewer System

A complete documentation delivery system built with Cloudflare Workers + R2, featuring AI-powered content generation and multiple frontend integration options.

## Features

- **Dynamic Content Loading**: Serve documentation from Cloudflare R2 with intelligent caching
- **AI Agent Assignment**: Automatically assign AI agents to generate missing documentation
- **Multiple Frontend Options**: CDN-embeddable, Remix-compatible, and standalone versions
- **Responsive Design**: Beautiful, modern UI that works on all devices
- **Zero Dependencies**: Self-contained JavaScript that works in any modern browser
- **Customizable**: Easy to customize colors, sections, and behavior

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │  Cloudflare     │    │   Cloudflare    │
│   (Multiple     │◄──►│   Workers       │◄──►│      R2         │
│   Options)      │    │   (API)         │    │   (Storage)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   AI Agents     │
                       │   (Queue)       │
                       └─────────────────┘
```

## Quick Start

### 1. Deploy the Worker

```bash
# Install dependencies
npm install

# Deploy to Cloudflare Workers
npx wrangler deploy
```

### 2. Configure R2 Bucket

Create a Cloudflare R2 bucket and update your `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "DOCS_BUCKET"
bucket_name = "your-docs-bucket"
```

### 3. Upload Documentation

Upload JSON documentation files to your R2 bucket:

```bash
# Example: Upload agents documentation
npx wrangler r2 object put DOCS_BUCKET/agents.json --file=docs_json_r2/agents.json
```

## Frontend Integration Options

### Option 1: CDN-Embeddable (Recommended)

The easiest way to integrate the documentation viewer into any website.

#### Basic Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>My Documentation</title>
</head>
<body>
    <!-- Include the embeddable script -->
    <script src="/docs-viewer-embed.js"></script>
    
    <!-- Add a container for the viewer -->
    <div id="docs-viewer"></div>
    
    <!-- The viewer will automatically initialize -->
</body>
</html>
```

#### Advanced Configuration

```html
<script>
// Custom configuration
const config = {
    containerId: 'my-docs-viewer',
    apiBase: '/api/docs',
    sections: [
        { id: 'getting-started', label: 'Getting Started' },
        { id: 'api-reference', label: 'API Reference' },
        { id: 'examples', label: 'Examples' }
    ],
    defaultSection: 'getting-started',
    title: 'My Documentation',
    description: 'Custom documentation for my project'
};

// Initialize the viewer
const viewer = new DocsViewer(config);
</script>
```

### Option 2: Remix Integration

For Remix applications, use the React component version.

#### Installation

```bash
npm install react @remix-run/react @remix-run/node
```

#### Usage

```tsx
import DocumentationViewer from './docs-viewer-remix';

export default function DocsPage() {
  return (
    <DocumentationViewer
      apiBase="/api/docs"
      sections={[
        { id: 'agents', label: 'AI Agents' },
        { id: 'orchestration', label: 'Orchestration' },
        { id: 'api', label: 'API Reference' }
      ]}
      defaultSection="agents"
    />
  );
}
```

### Option 3: Standalone HTML

Use the complete HTML page for a standalone documentation site.

```html
<!-- Access at /docs-viewer.html -->
```

## API Reference

### GET /api/docs/{section}

Retrieve documentation for a specific section.

**Response:**
```json
{
  "status": "found",
  "content": {
    "title": "AI Agents",
    "description": "Overview of AI agents...",
    "sections": [
      {
        "title": "Introduction",
        "content": "AI agents are...",
        "code": "// Example code"
      }
    ],
    "examples": [
      {
        "title": "Basic Agent",
        "code": "// Example implementation"
      }
    ],
    "bestPractices": [
      "Always handle errors gracefully",
      "Use proper logging"
    ],
    "troubleshooting": {
      "commonIssues": [
        {
          "issue": "Agent not responding",
          "solution": "Check the agent configuration..."
        }
      ]
    }
  },
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### POST /api/docs/assign-agent

Assign an AI agent to generate documentation for a section.

**Request:**
```json
{
  "section": "new-section",
  "priority": "medium",
  "requirements": [
    "Comprehensive overview",
    "Code examples",
    "Best practices"
  ]
}
```

**Response:**
```json
{
  "status": "queued",
  "requestId": "req_123456789",
  "message": "AI agent assigned successfully",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## Configuration Options

### DocsViewer Configuration

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `containerId` | string | `'docs-viewer'` | DOM element ID for the viewer container |
| `apiBase` | string | `'/api/docs'` | API endpoint for fetching documentation |
| `sections` | array | Default sections | Custom navigation sections with labels |
| `defaultSection` | string | `'agents'` | Which section to load by default |
| `title` | string | `'Documentation Viewer'` | Custom page title |
| `description` | string | Default description | Custom page description |

### Worker Configuration

Update `wrangler.toml`:

```toml
name = "docs-viewer-worker"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[[r2_buckets]]
binding = "DOCS_BUCKET"
bucket_name = "your-docs-bucket"

[env.production]
name = "docs-viewer-worker-prod"

[env.staging]
name = "docs-viewer-worker-staging"
```

## Documentation Format

Documentation files should be JSON with the following structure:

```json
{
  "title": "Section Title",
  "description": "Brief description of the section",
  "sections": [
    {
      "title": "Subsection Title",
      "content": "Detailed content...",
      "code": "// Optional code example"
    }
  ],
  "examples": [
    {
      "title": "Example Title",
      "code": "// Code example"
    }
  ],
  "bestPractices": [
    "Best practice 1",
    "Best practice 2"
  ],
  "troubleshooting": {
    "commonIssues": [
      {
        "issue": "Common problem",
        "solution": "How to solve it"
      }
    ]
  }
}
```

## Customization

### Styling

The viewer uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --text-primary: #1f2937;
  --text-secondary: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f9fafb;
  --border-color: #e5e7eb;
}
```

### Custom Sections

Add custom sections by modifying the configuration:

```javascript
const customSections = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'installation', label: 'Installation' },
  { id: 'configuration', label: 'Configuration' },
  { id: 'api', label: 'API Reference' },
  { id: 'examples', label: 'Examples' },
  { id: 'troubleshooting', label: 'Troubleshooting' }
];
```

## Development

### Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build for production
npm run build

# Deploy to Cloudflare Workers
npm run deploy
```

### File Structure

```
├── src/
│   ├── index.ts              # Main Worker entry point
│   ├── docs/
│   │   └── handler.ts        # Documentation API handlers
│   └── utils/
│       └── logger.ts         # Logging utilities
├── public/
│   ├── docs-viewer.html      # Standalone HTML version
│   ├── docs-viewer-embed.js  # CDN-embeddable script
│   ├── docs-viewer-remix.tsx # Remix component
│   └── example-embed.html    # Embed example
├── docs_json_r2/
│   └── agents.json           # Sample documentation
└── wrangler.toml             # Worker configuration
```

### Adding New Documentation

1. Create a JSON file in `docs_json_r2/`
2. Upload to R2 bucket: `npx wrangler r2 object put DOCS_BUCKET/section-name.json --file=docs_json_r2/section-name.json`
3. Add the section to your frontend configuration

## Examples

### Basic HTML Integration

See `public/example-embed.html` for a complete example.

### Remix Integration

See `public/remix-example.tsx` for Remix usage.

### Standalone Usage

Access `public/docs-viewer.html` for a standalone documentation site.

## Troubleshooting

### Common Issues

1. **Documentation not loading**
   - Check R2 bucket configuration in `wrangler.toml`
   - Verify file exists in R2 bucket
   - Check browser console for errors

2. **AI agent assignment failing**
   - Verify the `/api/docs/assign-agent` endpoint is working
   - Check Worker logs for errors
   - Ensure proper request format

3. **Styling issues**
   - Verify CSS is being injected properly
   - Check for CSS conflicts with existing styles
   - Use browser dev tools to inspect elements

### Debug Mode

Enable debug logging by setting the `DEBUG` environment variable:

```bash
DEBUG=true npm run dev
```

## Performance

- **Caching**: Documentation is cached in R2 with appropriate headers
- **CDN**: Cloudflare's global CDN ensures fast loading worldwide
- **Compression**: Responses are automatically compressed
- **Lazy Loading**: Content is loaded on-demand

## Security

- **CORS**: Configured for cross-origin requests
- **Rate Limiting**: Built-in rate limiting for API endpoints
- **Input Validation**: All inputs are validated and sanitized
- **HTTPS**: All communications are encrypted

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details. 