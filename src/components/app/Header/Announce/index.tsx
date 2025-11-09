"use client"
import styles from './index.module.scss';
import DotIcon from '../DotIcon';

type announcementsType = {
  color: string
  text: string
}

export type AnnounceType = {
  announcements?: announcementsType[]
}

function Announce({announcements = []}: AnnounceType) {
  return (
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
  );
}

export default Announce; 