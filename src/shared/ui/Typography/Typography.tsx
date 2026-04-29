import clsx from 'clsx';
import type { ElementType, ReactNode } from 'react';
import styles from './Typography.module.scss';

type TypographyVariant =
  | 'h1'
  | 'h2'
  | 'h3'
  | 'body'
  | 'bodySmall'
  | 'caption';

type TypographyProps<T extends ElementType = 'p'> = {
  as?: T;
  variant?: TypographyVariant;
  children: ReactNode;
  className?: string;
};

export const Typography = <T extends ElementType = 'p'>({
  as,
  variant = 'body',
  children,
  className,
}: TypographyProps<T>) => {
  const Component = as || getDefaultTag(variant);

  return (
    <Component className={clsx(styles.typography, styles[variant], className)}>
      {children}
    </Component>
  );
};

function getDefaultTag(variant: TypographyVariant): ElementType {
  switch (variant) {
    case 'h1':
      return 'h1';
    case 'h2':
      return 'h2';
    case 'h3':
      return 'h3';
    case 'caption':
      return 'span';
    default:
      return 'p';
  }
}