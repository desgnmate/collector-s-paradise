import styles from './EditorialPageHero.module.css';

interface EditorialPageHeroProps {
  title: string;
  description: string;
}

export default function EditorialPageHero({ title, description }: EditorialPageHeroProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}
