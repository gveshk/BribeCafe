import React from 'react';
import { theme } from './tokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    backgroundColor: theme.colors.primary[500],
    color: 'white',
    border: 'none',
  },
  secondary: {
    backgroundColor: theme.colors.neutral[800],
    color: 'white',
    border: 'none',
  },
  outline: {
    backgroundColor: 'transparent',
    color: theme.colors.primary[500],
    border: `1px solid ${theme.colors.primary[500]}`,
  },
  ghost: {
    backgroundColor: 'transparent',
    color: theme.colors.neutral[700],
    border: 'none',
  },
  danger: {
    backgroundColor: theme.colors.error.main,
    color: 'white',
    border: 'none',
  },
};

const sizeStyles: Record<ButtonSize, React.CSSProperties> = {
  sm: {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: theme.typography.fontSize.sm,
    borderRadius: theme.borderRadius.sm,
  },
  md: {
    padding: `${theme.spacing.sm} ${theme.spacing.md}`,
    fontSize: theme.typography.fontSize.base,
    borderRadius: theme.borderRadius.md,
  },
  lg: {
    padding: `${theme.spacing.md} ${theme.spacing.lg}`,
    fontSize: theme.typography.fontSize.lg,
    borderRadius: theme.borderRadius.lg,
  },
};

const hoverStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: { backgroundColor: theme.colors.primary[600] },
  secondary: { backgroundColor: theme.colors.neutral[700] },
  outline: { backgroundColor: theme.colors.primary[50] },
  ghost: { backgroundColor: theme.colors.neutral[100] },
  danger: { backgroundColor: theme.colors.error.dark },
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  style,
  ...props
}) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { loading: _loading, ...buttonProps } = props as typeof props & { loading?: boolean };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    fontWeight: theme.typography.fontWeight.medium,
    cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
    opacity: disabled || isLoading ? 0.6 : 1,
    transition: theme.transitions.fast,
    borderRadius: theme.borderRadius.md,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  const hoverStyle = isHovered && !disabled && !isLoading ? hoverStyles[variant] : {};

  return (
    <button
      style={{ ...baseStyle, ...hoverStyle, ...style }}
      disabled={disabled || isLoading}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...buttonProps}
    >
      {isLoading && (
        <span aria-label="Loading" style={{ animation: 'spin 1s linear infinite' }}>
          ⏳
        </span>
      )}
      {!isLoading && leftIcon}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
};

export default Button;
