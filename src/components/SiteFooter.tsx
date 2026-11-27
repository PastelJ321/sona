import { CLUB_INFO } from '../data/club';
import { PROJECTS } from '../data/projects';
import { useMagneticSignal } from '../motion/SignalMotion';
import { SonaBrandMark } from './SonaBrandMark';

interface SiteFooterProps {
  onNavigate: (to: string, options?: { hash?: string }) => void;
}

/**
 * Movement 08 — Monumental Architectural Colophon Footer.
 * Grounds the entire site in SONA's dark obsidian basalt & lamella graphic grammar.
 */
export function SiteFooter({ onNavigate }: SiteFooterProps) {
  const topBtnRef = useMagneticSignal<HTMLButtonElement>(6);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  };

  return (
    <footer className="site-footer">
      {/* 5-Lamella Architectural Divider Ribbon */}
      <div className="site-footer__lamella-rule" aria-hidden="true">
        <span />
        <span />
        <span className="is-accent" />
        <span />
        <span />
      </div>

      <div className="container site-footer__inner">
        <div className="site-footer__top">
          <div className="site-footer__brand">
            <div className="site-footer__logo-row">
              <SonaBrandMark size={30} />
              <div>
                <strong className="site-footer__title">{CLUB_INFO.name}</strong>
                <span className="site-footer__affil">{CLUB_INFO.affiliation}</span>
              </div>
            </div>
            <p className="site-footer__desc">{CLUB_INFO.shortLine}</p>
            <p className="site-footer__notice">{CLUB_INFO.integrityNotice}</p>
          </div>

          <div className="site-footer__columns">
            <div className="site-footer__col">
              <h2 className="site-footer__heading mono">INDEX</h2>
              <ul>
                <li>
                  <a
                    href="/"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/');
                    }}
                  >
                    홈
                  </a>
                </li>
                <li>
                  <a
                    href="/archive"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/archive');
                    }}
                  >
                    프로젝트 기록
                  </a>
                </li>
                <li>
                  <a
                    href="/about"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('/about');
                    }}
                  >
                    소나 소개
                  </a>
                </li>
              </ul>
            </div>

            <div className="site-footer__col">
              <h2 className="site-footer__heading mono">WORKS</h2>
              <ul>
                {PROJECTS.map((project) => (
                  <li key={project.id}>
                    <a
                      href={project.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <span>{project.title}</span>
                      <span aria-hidden="true"> ↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="site-footer__col">
              <h2 className="site-footer__heading mono">HOST</h2>
              <a
                href={CLUB_INFO.hostPartner.url}
                target="_blank"
                rel="noopener noreferrer"
                className="partner-link"
              >
                <img
                  src={CLUB_INFO.hostPartner.logoSrc}
                  alt="QuadraJ"
                  width={20}
                  height={21}
                  loading="lazy"
                />
                <span className="partner-link__text">
                  <strong>{CLUB_INFO.hostPartner.name} ↗</strong>
                  <small>{CLUB_INFO.hostPartner.note}</small>
                </span>
              </a>
              <p className="site-footer__domain mono">sona.quadraj.com</p>
            </div>
          </div>
        </div>

        {/* Monumental Bleed Wordmark Signature + Tactile Back-to-Top */}
        <div className="site-footer__monument">
          <span className="site-footer__wordmark" aria-hidden="true">
            SONA
          </span>
          <div className="site-footer__bottom-bar">
            <p className="mono">SONA · YANGIL HIGH SCHOOL CODING CLUB · 2026</p>
            <button
              ref={topBtnRef}
              type="button"
              className="site-footer__top-btn mono magnetic-target"
              onClick={scrollToTop}
            >
              <span>TOP ↑</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
