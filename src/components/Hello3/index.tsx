import styles from './index.module.scss';

export type Hello3Type = {
  mapWidth: number
  mapHeight: number
}

export default function Hello3({ mapWidth, mapHeight }: Hello3Type ) {
  return (
    <div className={styles.main}>
      hello world
    </div>
  );
}