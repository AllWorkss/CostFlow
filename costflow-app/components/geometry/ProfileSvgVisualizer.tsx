"use client";

import React from "react";
import type { GeometricProfile, GeometryDimensions } from "@/types/costing";

interface ProfileSvgVisualizerProps {
  profile: GeometricProfile;
  dimensions: GeometryDimensions;
  materialName?: string;
  linearMassKgPerM?: number;
}

export function ProfileSvgVisualizer({
  profile,
  dimensions,
  materialName = "Material",
  linearMassKgPerM = 0,
}: ProfileSvgVisualizerProps) {
  const primaryColor = "#3B82F6";
  const strokeColor = "#60A5FA";
  const dimColor = "#F59E0B";

  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-100 shadow-inner w-full">
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
        Live 2D Dimension Visualizer — {materialName}
      </div>

      <div className="w-full max-w-[260px] h-[180px] flex items-center justify-center relative">
        <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="profileGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.15" />
            </linearGradient>
            <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={dimColor} />
            </marker>
          </defs>

          {/* 1. Round Bar */}
          {profile === "round_bar" && (
            <g>
              <circle cx="100" cy="75" r="50" fill="url(#profileGradient)" stroke={strokeColor} strokeWidth="2.5" />
              {/* Diameter arrow line */}
              <line x1="50" y1="75" x2="150" y2="75" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3,3" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="100" y="65" textAnchor="middle" fill={dimColor} fontSize="11" fontWeight="bold">
                Ø {dimensions.diameter_mm || 0} mm
              </text>
            </g>
          )}

          {/* 2. Hollow Tube / Pipe */}
          {profile === "hollow_pipe" && (
            <g>
              {/* Outer circle */}
              <circle cx="100" cy="75" r="55" fill="url(#profileGradient)" stroke={strokeColor} strokeWidth="2.5" />
              {/* Inner circle (cutout) */}
              <circle
                cx="100"
                cy="75"
                r={Math.max(10, Math.min(50, 55 * ((dimensions.inner_dia_mm || 30) / (dimensions.outer_dia_mm || 60))))}
                fill="#0F172A"
                stroke={strokeColor}
                strokeWidth="2"
                strokeDasharray="2,2"
              />
              {/* OD Dimension line */}
              <line x1="45" y1="75" x2="155" y2="75" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3,3" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="100" y="60" textAnchor="middle" fill={dimColor} fontSize="10" fontWeight="bold">
                OD Ø{dimensions.outer_dia_mm || 0} mm
              </text>
              <text x="100" y="92" textAnchor="middle" fill="#94A3B8" fontSize="9">
                ID Ø{dimensions.inner_dia_mm || 0} mm (Wall: {Math.max(0, ((dimensions.outer_dia_mm || 0) - (dimensions.inner_dia_mm || 0)) / 2).toFixed(1)}mm)
              </text>
            </g>
          )}

          {/* 3. Square / Flat Bar */}
          {profile === "flat_bar" && (
            <g>
              <rect x="40" y="45" width="120" height="60" rx="4" fill="url(#profileGradient)" stroke={strokeColor} strokeWidth="2.5" />
              {/* Width arrow top */}
              <line x1="40" y1="35" x2="160" y2="35" stroke={dimColor} strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="100" y="28" textAnchor="middle" fill={dimColor} fontSize="11" fontWeight="bold">
                Width: {dimensions.width_mm || 0} mm
              </text>
              {/* Thickness arrow right */}
              <line x1="170" y1="45" x2="170" y2="105" stroke={dimColor} strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="175" y="78" textAnchor="start" fill={dimColor} fontSize="10" fontWeight="bold">
                T: {dimensions.thickness_mm || 0}mm
              </text>
            </g>
          )}

          {/* 4. Sheet Metal / Plate */}
          {profile === "sheet_metal" && (
            <g>
              {/* Perspective sheet plate */}
              <polygon points="30,85 150,85 170,55 50,55" fill="url(#profileGradient)" stroke={strokeColor} strokeWidth="2" />
              <polygon points="30,85 150,85 150,105 30,105" fill="url(#profileGradient)" stroke={strokeColor} strokeWidth="2" />
              <polygon points="150,85 170,55 170,75 150,105" fill="url(#profileGradient)" stroke={strokeColor} strokeWidth="2" />
              {/* Thickness arrow */}
              <line x1="20" y1="85" x2="20" y2="105" stroke={dimColor} strokeWidth="1.5" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="15" y="98" textAnchor="end" fill={dimColor} fontSize="10" fontWeight="bold">
                {dimensions.thickness_mm || 0} mm
              </text>
              <text x="100" y="75" textAnchor="middle" fill="#E2E8F0" fontSize="10" fontWeight="semibold">
                Sheet Plate
              </text>
            </g>
          )}

          {/* 5. Hexagonal Rod */}
          {profile === "hex_rod" && (
            <g>
              {/* Hexagon points around (100,75) radius 50 */}
              <polygon
                points="100,25 143.3,50 143.3,100 100,125 56.7,100 56.7,50"
                fill="url(#profileGradient)"
                stroke={strokeColor}
                strokeWidth="2.5"
              />
              {/* Across flats arrow */}
              <line x1="56.7" y1="75" x2="143.3" y2="75" stroke={dimColor} strokeWidth="1.5" strokeDasharray="3,3" markerStart="url(#arrow)" markerEnd="url(#arrow)" />
              <text x="100" y="65" textAnchor="middle" fill={dimColor} fontSize="11" fontWeight="bold">
                A/F: {dimensions.across_flats_mm || 0} mm
              </text>
            </g>
          )}
        </svg>
      </div>

      <div className="mt-1 text-xs text-slate-300 font-mono flex items-center justify-between w-full border-t border-slate-800/80 pt-2 px-1">
        <span>Linear Mass:</span>
        <span className="font-bold text-cyan-400">{linearMassKgPerM.toFixed(3)} kg/m</span>
      </div>
    </div>
  );
}
