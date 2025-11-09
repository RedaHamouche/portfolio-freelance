'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { openModal as openModalAction, closeModal as closeModalAction } from '@/store/modalSlice';
import { createPortal } from 'react-dom';
import Modal from '@/components/apiComponents/Modal';

interface ModalContextType {
  openModal: (content: ReactNode, options?: ModalOptions) => void;
  closeModal: () => void;
  isOpen: boolean;
}

interface ModalOptions {
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  className?: string;
  closeOnBackdropClick?: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.modal.isOpen);
  const [content, setContent] = useState<ReactNode>(null);
  const [options, setOptions] = useState<ModalOptions>({});

  const openModal = useCallback((modalContent: ReactNode, modalOptions: ModalOptions = {}) => {
    setContent(modalContent);
    setOptions({
      size: 'medium',
      closeOnBackdropClick: true,
      ...modalOptions,
    });
    dispatch(openModalAction());
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch(closeModalAction());
    // Clear content after animation
    setTimeout(() => {
      setContent(null);
      setOptions({});
    }, 300);
  }, [dispatch]);

  return (
    <ModalContext.Provider value={{ openModal, closeModal, isOpen }}>
      {children}
      {isOpen && typeof window !== 'undefined' && createPortal(
        <Modal
          onClose={closeModal}
          size={options.size || 'medium'}
          className={options.className}
          closeOnBackdropClick={options.closeOnBackdropClick ?? true}
        >
          {content}
        </Modal>,
        document.body
      )}
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};

