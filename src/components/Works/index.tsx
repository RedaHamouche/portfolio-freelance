'use client';

import React from 'react';
import { useModal } from '@/contexts/ModalContext';
import styles from './index.module.scss';

interface Project {
  id: string;
  title: string;
  description: string;
  image?: string;
  tags?: string[];
  fullDescription?: string;
  link?: string;
}

// Données de test - à remplacer par tes vraies données
const projects: Project[] = [
  {
    id: '1',
    title: 'Project 1',
    description: 'Une brève description du projet...',
    tags: ['React', 'Next.js'],
    fullDescription: 'Description complète du projet avec plus de détails...',
  },
  {
    id: '2',
    title: 'Project 2',
    description: 'Une autre description...',
    tags: ['TypeScript', 'GSAP'],
    fullDescription: 'Description complète...',
  },
];

const Works: React.FC = () => {
  const { openModal } = useModal();

  const handleProjectClick = (project: Project) => {
    openModal(
      <div className={styles.modalContent}>
        <h2 id="modal-title">{project.title}</h2>
        {project.fullDescription && (
          <p>{project.fullDescription}</p>
        )}
        {project.tags && (
          <div className={styles.tags}>
            {project.tags.map((tag) => (
              <span key={tag} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
        {project.link && (
          <a href={project.link} target="_blank" rel="noopener noreferrer">
            Voir le projet
          </a>
        )}
      </div>,
      { size: 'large', className: styles.projectModal }
    );
  };

  return (
    <section className={styles.works}>
      <h2 className={styles.title}>Works</h2>
      <div className={styles.projectsGrid}>
        {projects.map((project) => (
          <div key={project.id} className={styles.projectCard}>
            <h3>{project.title}</h3>
            <p>{project.description}</p>
            <button
              type="button"
              onClick={() => handleProjectClick(project)}
              className={styles.cta}
            >
              En savoir plus
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Works;

