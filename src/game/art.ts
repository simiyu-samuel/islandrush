import type { BuildingId, StyleId } from '../model/types';

export const BUILDING_ART: Record<StyleId, string> = {
  cottage: '/assets/buildings/home-cottage-v1.png',
  bungalow: '/assets/buildings/home-bungalow-v1.png',
  forge: '/assets/buildings/workshop-forge-v1.png',
  studio: '/assets/buildings/workshop-studio-v1.png',
  lighthouse: '/assets/buildings/lookout-lighthouse-v1.png',
  watchtower: '/assets/buildings/lookout-watchtower-v1.png',
};
export const buildingWidth = (id: BuildingId, style: StyleId) =>
  id === 'home' ? (style === 'bungalow' ? 0.235 : 0.22) : id === 'workshop' ? 0.20 : 0.115;
