"use client"
import styles from './index.module.scss';
import HourDisplay from '@/components/apiComponents/HourDisplay';
import DisplayName from '@/components/apiComponents/DisplayName';
import LanguageManager from '@/components/apiComponents/LanguageManager';

function Header() {
  return (
    <header className={styles.header}>   
      <HourDisplay />
      <DisplayName />
      <LanguageManager />
    </header>
  );
}

export default Header;