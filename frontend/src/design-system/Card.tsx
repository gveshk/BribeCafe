import React from 'react';
import { theme } from './tokens';

export interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  style?: React.CSSProperties;
  onClick?: () => void;
}

const variantStyles: Record<'default' | 'elevated' | 'outlined', React.CSSProperties> = {
  default: {
    backgroundColor: 'white',
    border: `1px solid ${theme.colors.neutral[200]}`,
    borderRadius: theme.borderRadius.lg,
  },
  elevated: {
    backgroundColor: 'white',
    boxShadow: theme.shadows.lg,
    borderRadius: theme.borderRadius.lg,
  },
  outlined: {
    backgroundColor: 'white',
    border: `2px solid ${theme.colors.neutral[200]}`,
    borderRadius: theme.borderRadius.lg,
  },
};

const paddingStyles: Record<'none' | 'sm' | 'md' | 'lg', string> = {
  none: '0',
  sm: theme.spacing.sm,
  md: theme.spacing.md,
  lg: theme.spacing.lg,
};

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  style,
  onClick,
}) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const baseStyle: React.CSSProperties = {
    ...variantStyles[variant],
    padding: paddingStyles[padding],
    transition: theme.transitions.fast,
    cursor: onClick ? 'pointer' : 'default',
    ...(onClick && isHovered ? { borderColor: theme.colors.primary[300] } : {}),
    ...style,
  };

  return (
    <div
      style={baseStyle}
      onClick={onClick}
      onMouseEnter={() => onClick && setIsHovered(true)}
      onMouseLeave={() => onClick && setIsHovered(false)}
    >
      {children}
    </div>
  );
};

export default Card;
