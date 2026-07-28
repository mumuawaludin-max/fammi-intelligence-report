import type { ComponentType } from "react";
import {
  Buildings,
  ChartLineUp,
  ClipboardText,
  Compass,
  Handshake,
  Lightbulb,
  Medal,
  Target,
  UsersThree
} from "@phosphor-icons/react";
import type { IconProps } from "@phosphor-icons/react";
import type { IconName } from "../types/report";

const iconMap: Record<IconName, ComponentType<IconProps>> = {
  family: UsersThree,
  innovation: Lightbulb,
  orientation: Compass,
  rules: ClipboardText,
  target: Target,
  award: Medal,
  institution: Buildings,
  collaboration: Handshake,
  quality: ChartLineUp
};

interface IconBadgeProps {
  icon: IconName;
  size?: "sm" | "md" | "lg";
  tone?: "purple" | "gold" | "plain";
  className?: string;
}

export function IconBadge({
  icon,
  size = "md",
  tone = "purple",
  className = ""
}: IconBadgeProps) {
  const Icon = iconMap[icon];

  return (
    <span
      className={`icon-badge icon-badge--${size} icon-badge--${tone} ${className}`}
      aria-hidden="true"
    >
      <Icon weight="duotone" />
    </span>
  );
}
