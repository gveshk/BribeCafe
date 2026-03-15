import React from 'react';
import { theme } from './tokens';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

const variantStyles: Record<BadgeVariant, { bg: string; color: string }> = {
  default: { bg: theme.colors.neutral[100], color: theme.colors.neutral[700] },
  success: { bg: theme.colors.success.light, color: theme.colors.success.dark },
  warning: { bg: theme.colors.warning.light, color: theme.colors.warning.dark },
  error: { bg: theme.colors.error.light, color: theme.colors.error.dark },
  info: { bg: theme.colors.info.light, color: theme.colors.info.dark },
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'md' }) => {
  const sizeStyles = size === 'sm' 
    ? { padding: '2px 6px', fontSize: '10px' }
    : { padding: '4px 8px', fontSize: '12px' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: theme.borderRadius.full,
        fontWeight: theme.typography.fontWeight.medium,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        ...sizeStyles,
        backgroundColor: variantStyles[variant].bg,
        color: variantStyles[variant].color,
      }}
    >
      {children}
    </span>
  );
};

export default Badge;
