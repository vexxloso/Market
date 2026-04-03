import type { ReactNode, SVGProps } from "react";
import type { ProfilePromptKey } from "@/lib/profile-shared";

type IconProps = SVGProps<SVGSVGElement> & { className?: string };

function strokeProps(props: IconProps) {
  const { className, ...rest } = props;
  return {
    className: className ?? "shrink-0 text-neutral-800",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    viewBox: "0 0 24 24",
    ...rest,
  } as SVGProps<SVGSVGElement>;
}

export function IconBriefcase(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M9 8V6a2 2 0 012-2h2a2 2 0 012 2v2M5 8h14v10a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function IconMessages(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.77 9.77 0 01-4-.8L3 20l1.8-3.6A7.95 7.95 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M3 9h3l2-2h8l2 2h3v9H3V9z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function IconGlobePin(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconPaw(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <ellipse cx="9" cy="9" rx="2" ry="2.5" />
      <ellipse cx="15" cy="9" rx="2" ry="2.5" />
      <ellipse cx="7" cy="15" rx="2" ry="2.5" />
      <ellipse cx="17" cy="15" rx="2" ry="2.5" />
      <ellipse cx="12" cy="17" rx="2.2" ry="2.8" />
    </svg>
  );
}

export function IconGradCap(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M4.5 10.5L12 7l7.5 3.5L12 14 4.5 10.5z" />
      <path d="M9 12.5V16c0 1 1.5 2 3 2s3-1 3-2v-3.5" />
    </svg>
  );
}

export function IconClock(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l3 2" strokeLinecap="round" />
    </svg>
  );
}

export function IconSpeechGlobe(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M5 18l-1 3 3-1 4-2" />
      <path d="M21 12a8 8 0 01-12 7l-3 1 1-3a8 8 0 1114-5z" />
    </svg>
  );
}

export function IconBook(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M6 4h10a2 2 0 012 2v14l-8-3-8 3V6a2 2 0 012-2z" />
      <path d="M6 4v16" />
    </svg>
  );
}

export function IconWand(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M15 4l5 5-9 9-4-4 9-9z" strokeLinejoin="round" />
      <path d="M4 20l3-3M6 16l2 2" strokeLinecap="round" />
    </svg>
  );
}

export function IconFemale(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M12 12v5M9 18h6M12 17v3" strokeLinecap="round" />
    </svg>
  );
}

export function IconBulb(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M9 18h6M9 15h6M10 14a4.5 4.5 0 108 0c0-1-1-2-1-3H11c0 1-1 2-1 3z" />
      <path d="M12 3v1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconMusic(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M9 18a3 3 0 100-6V8l9-2v9a3 3 0 11-3-3" />
    </svg>
  );
}

export function IconHeart(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M12 21s-7-4.9-7-10a4 4 0 017-2 4 4 0 017 2c0 5.1-7 10-7 10z" />
    </svg>
  );
}

export function IconGlobe(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 3 4 5.5 4 9s-1.5 6-4 9M12 3c-2.5 3-4 5.5-4 9s1.5 6 4 9" />
    </svg>
  );
}

export function IconGlobeStamp(props: IconProps) {
  return (
    <svg {...strokeProps({ ...props, className: props.className })}>
      <rect x="5" y="5" width="14" height="14" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IconSunStamp(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <ellipse cx="12" cy="13" rx="7" ry="5" />
      <path d="M12 4v2M12 20v2M4 12h2M18 12h2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function IconPlaneStamp(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M10.5 18L21 12 10.5 6 3 9v6l7.5-3z" strokeLinejoin="round" />
      <path d="M3 15h18" />
    </svg>
  );
}

export function IconBagStamp(props: IconProps) {
  return (
    <svg {...strokeProps(props)}>
      <path d="M8 9V7a4 4 0 018 0v2" />
      <path d="M6 9h12v10a2 2 0 01-2 2H8a2 2 0 01-2-2V9z" />
      <path d="M9 12h6" />
    </svg>
  );
}

/** Map grid row keys to icons */
export const PROMPT_ICONS: Record<ProfilePromptKey, (p: IconProps) => ReactNode> =
  {
  uselessSkill: (p) => <IconWand {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  decadeBorn: (p) => <IconFemale {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  funFact: (p) => <IconBulb {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  favoriteSong: (p) => <IconMusic {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  obsessedWith: (p) => <IconHeart {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  whereILive: (p) => <IconGlobe {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  whereIveWantedToGo: (p) => (
    <IconGlobePin {...p} className={`${p.className ?? ""} h-6 w-6`} />
  ),
  pets: (p) => <IconPaw {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  school: (p) => <IconGradCap {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  spendTooMuchTime: (p) => <IconClock {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  languages: (p) => <IconSpeechGlobe {...p} className={`${p.className ?? ""} h-6 w-6`} />,
  biographyTitle: (p) => <IconBook {...p} className={`${p.className ?? ""} h-6 w-6`} />,
};
