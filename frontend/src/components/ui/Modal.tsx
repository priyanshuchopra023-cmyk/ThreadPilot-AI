import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-6">
        {/* Backdrop with frosted dark navy blur */}
        <div
          className="fixed inset-0 bg-navy-950/50 backdrop-blur-xs transition-opacity animate-fade-in"
          onClick={handleOverlayClick}
          aria-hidden="true"
        />

        {/* Modal Window Container */}
        <div
          className={`
            relative w-full ${sizeClasses[size]} bg-white rounded-2xl border border-secondary-200/90 shadow-2xl
            animate-scale-in text-left overflow-hidden transform transition-all
          `}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
        >
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-secondary-100 bg-secondary-50/30">
              <div className="min-w-0 pr-4">
                {title && (
                  <h2 id="modal-title" className="text-base font-semibold text-secondary-900 tracking-tight">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-xs text-secondary-500 mt-0.5">{description}</p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 text-secondary-400 hover:text-secondary-700 hover:bg-secondary-100 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <div className="px-6 py-5">{children}</div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';

export default Modal;
