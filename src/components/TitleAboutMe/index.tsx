import React from 'react';
import styles from './index.module.scss';

export type TitleAboutMeType = {
  title: string;
  description: string;
}

export default function TitleAboutMe({ 
  title,
  description
}: TitleAboutMeType) {
  return (
    <div className={styles.titleAboutMe}>
      {title && <h1 className={styles.title}>{title}</h1>}
      {description && <p className={styles.description}>{description}</p>}
    </div>
  );
}