---
to: src/components/<%= h.changeCase.pascal(name) %>/index.tsx
---
import styles from './index.module.scss';

export type <%= h.changeCase.pascal(name) %>Type = {
  
}

export default function <%= h.changeCase.pascal(name) %>({}: <%= h.changeCase.pascal(name) %>Type ) {
  return (
    <div className={styles.main}>
      Generated by Hygen script in src/components/<%= h.changeCase.pascal(name) %>/index.tsx
    </div>
  );
}