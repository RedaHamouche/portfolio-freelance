'use client';

import React, { useEffect, ReactNode } from 'react';
import { useDispatch } from 'react-redux';
import { closeModal } from '@/store/modalSlice';
import styles from './index.module.scss';
import classnames from 'classnames';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useOnClickOutside } from '@/hooks/useOnClickOutside';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  className?: string;
  closeOnBackdropClick?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  children,
  onClose,
  size = 'medium',
  className,
  closeOnBackdropClick = true,
}) => {
  const dispatch = useDispatch();
  const modalContentRef = useFocusTrap<HTMLDivElement>({
    enabled: true,
    onEscape: () => {
      dispatch(closeModal());
      onClose();
    },
  });

  // Hook pour fermer la modal en cliquant à l'extérieur
  useOnClickOutside({
    ref: modalContentRef,
    handler: () => {
      if (closeOnBackdropClick) {
        dispatch(closeModal());
        onClose();
      }
    },
    enabled: closeOnBackdropClick,
  });

  // Blocage du scroll en préservant la position
  useEffect(() => {
    // Sauvegarder la position actuelle du scroll
    const scrollY = window.scrollY;
    
    // Sauvegarder les styles originaux
    const originalOverflow = document.body.style.overflow;
    const originalPosition = document.body.style.position;
    const originalTop = document.body.style.top;
    const originalWidth = document.body.style.width;

    // Bloquer le scroll en utilisant position fixed pour préserver la position
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      // Restaurer les styles originaux
      document.body.style.overflow = originalOverflow;
      document.body.style.position = originalPosition;
      document.body.style.top = originalTop;
      document.body.style.width = originalWidth;
      
      // Restaurer la position du scroll avec un délai pour éviter les conflits
      // Utiliser requestAnimationFrame double pour s'assurer que le DOM est prêt
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo({
            top: scrollY,
            behavior: 'auto',
          });
        });
      });
    };
  }, []);

  return (
    <div
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalContentRef}
        className={classnames(
          styles.modal,
          styles[`modal--${size}`],
          className
        )}
        tabIndex={-1}
      >
        <button
          className={styles.closeButton}
          onClick={() => {
            dispatch(closeModal());
            onClose();
          }}
          aria-label="Close modal"
          type="button"
        >
          ✕
        </button>
        <div className={styles.content}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;

