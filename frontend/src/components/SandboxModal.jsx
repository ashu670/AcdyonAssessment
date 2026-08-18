import SandboxPanel from './SandboxPanel.jsx';

export default function SandboxModal({ onClose, onOverrideChange, sourceHealth = [], onRunIngestion }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="w-[calc(100vw-24px)] max-w-4xl max-h-[calc(100vh-24px)] overflow-y-auto rounded-3xl animate-zoomIn"
        onClick={(e) => e.stopPropagation()}
      >
        <SandboxPanel
          onOverrideChange={onOverrideChange}
          sourceHealth={sourceHealth}
          onClose={onClose}
          onRunIngestion={onRunIngestion}
        />
      </div>
    </div>
  );
}
