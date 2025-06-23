import type { LoaderFunction, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import DocumentationViewer from "./docs-viewer-remix";

export const meta: MetaFunction = () => {
  return [
    { title: "Documentation Viewer - Remix Example" },
    { name: "description", content: "Remix integration example for the documentation viewer" },
  ];
};

export const loader: LoaderFunction = async () => {
  // You can fetch initial data here if needed
  return json({
    sections: [
      { id: 'agents', label: 'AI Agents' },
      { id: 'orchestration', label: 'Orchestration' },
      { id: 'api', label: 'API Reference' },
      { id: 'deployment', label: 'Deployment' },
      { id: 'troubleshooting', label: 'Troubleshooting' }
    ],
    defaultSection: 'agents'
  });
};

export default function DocsPage() {
  const { sections, defaultSection } = useLoaderData<typeof loader>();

  return (
    <div className="remix-docs-page">
      <header className="page-header">
        <div className="container">
          <h1>Documentation Viewer</h1>
          <p>Remix integration example with AI-powered documentation</p>
        </div>
      </header>

      <main className="page-main">
        <div className="container">
          <DocumentationViewer
            apiBase="/api/docs"
            sections={sections}
            defaultSection={defaultSection}
          />
        </div>
      </main>

      <style jsx>{`
        .remix-docs-page {
          min-height: 100vh;
          background: #f9fafb;
        }

        .page-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 60px 0;
          text-align: center;
        }

        .page-header h1 {
          font-size: 3rem;
          font-weight: 700;
          margin-bottom: 16px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .page-header p {
          font-size: 1.2rem;
          opacity: 0.9;
          max-width: 600px;
          margin: 0 auto;
        }

        .page-main {
          padding: 40px 0;
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        @media (max-width: 768px) {
          .page-header h1 {
            font-size: 2rem;
          }

          .page-header p {
            font-size: 1rem;
          }

          .container {
            padding: 0 16px;
          }
        }
      `}</style>
    </div>
  );
} 