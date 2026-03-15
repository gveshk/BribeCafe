import React, { useEffect, useRef } from 'react';
import { theme } from './tokens';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  footer?: React.ReactNode;
}

const sizeWidths: Record<'sm' | 'md' | 'lg' | 'xl', string> = {
  sm: '400px',
  md: '500px',
  lg: '700px',
  xl: '900px',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  footer,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: theme.spacing.md,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    boxShadow: theme.shadows.xl,
    width: '100%',
    maxWidth: sizeWidths[size],
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 200ms ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
    borderBottom: `1px solid ${theme.colors.neutral[200]}`,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.neutral[900],
    margin: 0,
  };

  const bodyStyle: React.CSSProperties = {
    padding: theme.spacing.md,
    overflowY: 'auto',
    flex: 1,
  };

  const footerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderTop: `1px solid ${theme.colors.neutral[200]}`,
  };

  return (
    <div style={overlayStyle} onClick={handleBackdropClick}>
      <div ref={modalRef} style={modalStyle}>
        <div style={headerStyle}>
          <h2 style={titleStyle}>{title}</h2>
          {showCloseButton && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </div>
        <div style={bodyStyle}>{children}</div>
        {footer && <div style={footerStyle}>{footer}</div>}
      </div>
    </div>
  );
};

export default Modal;
