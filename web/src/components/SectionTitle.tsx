import type { LucideIcon } from 'lucide-react';
import styles from './SectionTitle.module.css';

export function SectionTitle({ Icon, children }: { Icon: LucideIcon; children: string }) {
  return (
    <h2 className={styles.title}>
      <Icon size="2.5rem" strokeWidth={1.75} />
      <span>{children}</span>
    </h2>
  );
}
