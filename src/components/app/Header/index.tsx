"use client"
import styles from './index.module.scss';
import HourDisplay from '@/components/templatingComponents/page/HourDisplay';
import DisplayName from '@/components/templatingComponents/page/DisplayName';
import LanguageManager from '@/components/templatingComponents/page/LanguageManager';

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