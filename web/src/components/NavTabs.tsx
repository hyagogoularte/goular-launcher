import { useFocusable } from '@noriginmedia/norigin-spatial-navigation';
import { House, LayoutGrid, type LucideIcon } from 'lucide-react';
import { FocusGroup } from '../navigation/spatial';
import styles from './NavTabs.module.css';

export type TabId = 'home' | 'apps';

const TABS: { id: TabId; label: string; Icon: LucideIcon }[] = [
  { id: 'home', label: 'Início', Icon: House },
  { id: 'apps', label: 'Todos os aplicativos', Icon: LayoutGrid },
];

function Tab({ id, label, Icon, active, onSelect }: (typeof TABS)[number] & { active: boolean; onSelect: (id: TabId) => void }) {
  const { ref, focused } = useFocusable({ focusKey: `tab-${id}`, onEnterPress: () => onSelect(id) });
  const cls = [styles.tab, active && styles.active, focused && styles.focused].filter(Boolean).join(' ');
  return (
    <div ref={ref} className={cls} role="tab" aria-selected={active}>
      <Icon size="2.25rem" strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
}

export function NavTabs({ active, onSelect }: { active: TabId; onSelect: (id: TabId) => void }) {
  return (
    <FocusGroup focusKey="tabs" className={styles.tabs} preferredChildFocusKey={`tab-${active}`}>
      {TABS.map((t) => (
        <Tab key={t.id} {...t} active={t.id === active} onSelect={onSelect} />
      ))}
    </FocusGroup>
  );
}
