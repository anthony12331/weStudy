export default function NotificationModal({ isOpen, title, message, type = 'info', onConfirm, onClose }) {
  if (!isOpen) return null;

  const isConfirm = type === 'confirm';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '12px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        textAlign: 'center'
      }}>
        <h3 style={{ marginTop: 0, color: type === 'error' ? '#EF4444' : '#1F2937' }}>
          {title || (type === 'error' ? '⚠️ Error' : 'Notice')}
        </h3>
        <p style={{ color: '#4B5563', fontSize: '15px', marginBottom: '24px' }}>
          {message}
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {isConfirm && (
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #D1D5DB',
                backgroundColor: 'white',
                color: '#374151',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}

          <button
            onClick={() => {
              if (isConfirm && onConfirm) onConfirm();
              onClose();
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: type === 'error' ? '#EF4444' : '#4F46E5',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {isConfirm ? 'Delete' : 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}