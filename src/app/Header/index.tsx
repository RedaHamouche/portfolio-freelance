"use client"
import styles from './index.module.scss';
import HourDisplay from '@/components/HourDisplay';
import DisplayName from '@/components/DisplayName';
import LanguageManager from '@/components/LanguageManager';

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