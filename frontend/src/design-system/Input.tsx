import React from 'react';
import { theme } from './tokens';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  style,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing.xs,
    width: '100%',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: theme.typography.fontWeight.medium,
    color: hasError ? theme.colors.error.main : theme.colors.neutral[700],
  };

  const inputWrapperStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing.sm,
    padding: `0 ${theme.spacing.sm}`,
    backgroundColor: 'white',
    border: `1px solid ${hasError ? theme.colors.error.main : theme.colors.neutral[300]}`,
    borderRadius: theme.borderRadius.md,
    transition: theme.transitions.fast,
  };

  const inputStyle: React.CSSProperties = {
    flex: 1,
    padding: `${theme.spacing.sm} 0`,
    border: 'none',
    outline: 'none',
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.neutral[900],
    backgroundColor: 'transparent',
  };

  const helperStyle: React.CSSProperties = {
    fontSize: theme.typography.fontSize.sm,
    color: hasError ? theme.colors.error.main : theme.colors.neutral[500],
  };

  return (
    <div style={containerStyle}>
      {label && <label style={labelStyle} htmlFor={inputId}>{label}</label>}
      <div style={inputWrapperStyle}>
        {leftIcon && <span style={{ color: theme.colors.neutral[400] }}>{leftIcon}</span>}
        <input
          id={inputId}
          style={inputStyle}
          {...props}
        />
        {rightIcon && <span style={{ color: theme.colors.neutral[400] }}>{rightIcon}</span>}
      </div>
      {(error || helperText) && (
        <span style={helperStyle}>{error || helperText}</span>
      )}
    </div>
  );
};

export default Input;
