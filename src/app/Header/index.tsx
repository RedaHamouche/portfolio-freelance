"use client"
import styles from './index.module.scss';
import PlayPauseButton from './PlayPauseButton';
import DotIcon from './DotIcon'

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
      <div className={styles.announce}>
        <div className={styles.scrollContainer}>
          {announcements.map((announce) => {
            const {color, text} = announce;
            return (
                <div key={text} className={styles.freelance}>
                  <DotIcon color={color} />
                    <p className={styles.text}>
                      {text}
                    </p>
                    <DotIcon color={color} />
                </div>
            );
          })}
        </div>
      </div>

      <PlayPauseButton />
    </header>
  );
}

export default Header;