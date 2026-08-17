import Link from 'next/link';
import styles from './ResourcePageNav.module.css';

interface ResourcePageNavItem {
  href: string;
  label: string;
}

interface ResourcePageNavProps {
  items: ResourcePageNavItem[];
}

export default function ResourcePageNav({ items }: ResourcePageNavProps) {
  return (
    <nav className={styles.wrap} aria-label="On this page">
      <div className={styles.inner}>
        <span className={styles.label}>On this page</span>
        <div className={styles.links}>
          {items.map((item, index) => (
            <Link key={item.href} href={item.href} className={index === 0 ? styles.primary : undefined}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
