import { FolderPlus } from 'lucide-react';

export default function NoRepoLinked({ cta = true }: { cta?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <FolderPlus className="w-16 h-16 text-blue-500 mb-4" />
      <h2 className="text-2xl font-semibold mb-2">No Playwright Repository Linked</h2>
      <p className="text-gray-600 mb-6">
        To get started, link your Playwright automation repository. This enables AI-powered test management, execution, and analytics.
      </p>
      {cta && (
        <a
          href="/git"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Link Repository
        </a>
      )}
    </div>
  );
} 