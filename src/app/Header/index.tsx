"use client"
import {useEffect, useState} from 'react';
import styles from './index.module.scss';
import classnames from 'classnames';
import PlayPauseButton from './PlayPauseButton';

type announcementsType = {
  color: string
  text: string
}

export type HeaderType = {
  announcements?: announcementsType[]
}

function Header({announcements = []}: HeaderType) {
  // useEffect(() => {
  //   const rootStyle = document.documentElement?.style;
  //   rootStyle.setProperty(
  //     '--header-width',
  //     `${headerSize}px`
  //   );
  // }, [headerOpen, headerSize]);

  return (
    <header className={styles.header}>   
      <div className={styles.announce}>
        <div className={styles.scrollContainer}>
          {announcements.map((announce) => {
            const {color, text} = announce;
            return (
                <div key={text} className={styles.freelance}>
                  <span className={classnames(styles.dot, styles[color])} />
                    <p className={styles.text}>
                      {text}
                    </p>
                </div>
            );
          })}
        </div>
      </div>

      <PlayPauseButton />

      {/* <nav>
        <a href="#">Hamouche Reda</a>
        <div>Banniere ici</div>
        <ul>
          <li>projects</li>
          <li>about</li>
          <li>contact</li>
        </ul>
      </nav> */}

    </header>
  );
}

export default Header;