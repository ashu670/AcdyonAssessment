import SandboxPanel from './SandboxPanel.jsx';

export default function SandboxModal({ onClose, onOverrideChange, sourceHealth = [], onRunIngestion }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-md animate-fadeIn">
      <div
        className="max-w-4xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto animate-zoomIn"
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
