"use client"
import styles from './index.module.scss';
import PlayPauseButton from './PlayPauseButton';
import Announce from './Announce';

type announcementsType = {
  color: string
  text: string
}

export type HeaderType = {
  announcements?: announcementsType[]
}

function Header({announcements = []}: HeaderType) {
  return (
    <header className={styles.header}>   
      <Announce announcements={announcements} />
      <PlayPauseButton />
    </header>
  );
}

export default Header;