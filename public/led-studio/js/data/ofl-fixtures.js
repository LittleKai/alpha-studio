/* Curated Open Fixture Library (OFL schema-12.6.0) offline stage fixture pack for ALPHA Creative LED Studio V16.
   Source: https://github.com/OpenLightingProject/open-fixture-library (MIT License).
   Zero-network browser global: window.OFL_FIXTURES */
(function () {
  'use strict';
  const OFL_FIXTURES = [
    {
      id: 'robe/pointe',
      manufacturer: 'Robe',
      name: 'Pointe',
      category: 'hybrid',
      physical: { beamAngleMin: 2.5, beamAngleMax: 20, lumens: 9870, powerW: 470, weightKg: 15.0, panMaxDeg: 540, tiltMaxDeg: 270 },
      modes: [
        {
          name: 'Mode 1 (16ch 16-bit)',
          channelCount: 16,
          channels: [
            { offset: 1, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 5, name: 'Pan/Tilt Speed', type: 'Speed', resolution: 8, defaultValue: 0 },
            { offset: 6, name: 'Color Wheel', type: 'ColorWheel', resolution: 8, defaultValue: 0 },
            { offset: 7, name: 'Static Gobo', type: 'Gobo', resolution: 8, defaultValue: 0 },
            { offset: 8, name: 'Rotating Gobo', type: 'Gobo', resolution: 8, defaultValue: 0 },
            { offset: 10, name: 'Prism', type: 'Prism', resolution: 8, defaultValue: 0 },
            { offset: 12, name: 'Zoom', type: 'Zoom', resolution: 16, fineOffset: 13, defaultValue: 64 },
            { offset: 14, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 15, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 16, defaultValue: 255 }
          ]
        },
        {
          name: 'Mode 2 (24ch Extended)',
          channelCount: 24,
          channels: [
            { offset: 1, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 19, name: 'Zoom', type: 'Zoom', resolution: 16, fineOffset: 20, defaultValue: 64 },
            { offset: 22, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 23, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 24, defaultValue: 255 }
          ]
        }
      ]
    },
    {
      id: 'robe/robin-megapointe',
      manufacturer: 'Robe',
      name: 'Robin MegaPointe',
      category: 'hybrid',
      physical: { beamAngleMin: 1.8, beamAngleMax: 42, lumens: 20375, powerW: 670, weightKg: 22.0, panMaxDeg: 540, tiltMaxDeg: 270 },
      modes: [
        {
          name: 'Mode 1 (39ch Standard)',
          channelCount: 39,
          channels: [
            { offset: 1, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 8, name: 'Cyan', type: 'ColorIntensity', color: 'Cyan', resolution: 16, fineOffset: 9, defaultValue: 0 },
            { offset: 10, name: 'Magenta', type: 'ColorIntensity', color: 'Magenta', resolution: 16, fineOffset: 11, defaultValue: 0 },
            { offset: 12, name: 'Yellow', type: 'ColorIntensity', color: 'Yellow', resolution: 16, fineOffset: 13, defaultValue: 0 },
            { offset: 32, name: 'Zoom', type: 'Zoom', resolution: 16, fineOffset: 33, defaultValue: 64 },
            { offset: 37, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 38, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 39, defaultValue: 255 }
          ]
        }
      ]
    },
    {
      id: 'clay-paky/sharpy',
      manufacturer: 'Clay Paky',
      name: 'Sharpy',
      category: 'beam',
      physical: { beamAngleMin: 0.5, beamAngleMax: 3.8, lumens: 12500, powerW: 350, weightKg: 19.0, panMaxDeg: 540, tiltMaxDeg: 250 },
      modes: [
        {
          name: 'Standard (16ch)',
          channelCount: 16,
          channels: [
            { offset: 1, name: 'Color Wheel', type: 'ColorWheel', resolution: 8, defaultValue: 0 },
            { offset: 2, name: 'Stop / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 252 },
            { offset: 3, name: 'Dimmer', type: 'Intensity', resolution: 8, defaultValue: 255 },
            { offset: 4, name: 'Static Gobo', type: 'Gobo', resolution: 8, defaultValue: 0 },
            { offset: 5, name: 'Prism Insertion', type: 'Prism', resolution: 8, defaultValue: 0 },
            { offset: 9, name: 'Focus', type: 'Focus', resolution: 8, defaultValue: 128 },
            { offset: 10, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 11, defaultValue: 128 },
            { offset: 12, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 13, defaultValue: 128 }
          ]
        },
        {
          name: 'Vector (20ch)',
          channelCount: 20,
          channels: [
            { offset: 2, name: 'Stop / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 252 },
            { offset: 3, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 17, defaultValue: 255 },
            { offset: 10, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 11, defaultValue: 128 },
            { offset: 12, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 13, defaultValue: 128 }
          ]
        }
      ]
    },
    {
      id: 'clay-paky/mythos-2',
      manufacturer: 'Clay Paky',
      name: 'Mythos 2',
      category: 'hybrid',
      physical: { beamAngleMin: 2.5, beamAngleMax: 50, lumens: 18500, powerW: 700, weightKg: 31.0, panMaxDeg: 540, tiltMaxDeg: 244 },
      modes: [
        {
          name: 'Standard (30ch)',
          channelCount: 30,
          channels: [
            { offset: 1, name: 'Cyan', type: 'ColorIntensity', color: 'Cyan', resolution: 8, defaultValue: 0 },
            { offset: 2, name: 'Magenta', type: 'ColorIntensity', color: 'Magenta', resolution: 8, defaultValue: 0 },
            { offset: 3, name: 'Yellow', type: 'ColorIntensity', color: 'Yellow', resolution: 8, defaultValue: 0 },
            { offset: 8, name: 'Stop / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 252 },
            { offset: 9, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 10, defaultValue: 255 },
            { offset: 22, name: 'Zoom', type: 'Zoom', resolution: 16, fineOffset: 23, defaultValue: 64 },
            { offset: 24, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 25, defaultValue: 128 },
            { offset: 26, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 27, defaultValue: 128 }
          ]
        }
      ]
    },
    {
      id: 'martin/mac-aura-xb',
      manufacturer: 'Martin',
      name: 'MAC Aura XB',
      category: 'wash',
      physical: { beamAngleMin: 10, beamAngleMax: 60, lumens: 6000, powerW: 260, weightKg: 6.5, panMaxDeg: 540, tiltMaxDeg: 232 },
      modes: [
        {
          name: 'Standard (14ch)',
          channelCount: 14,
          channels: [
            { offset: 1, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 2, name: 'Dimmer', type: 'Intensity', resolution: 8, defaultValue: 255 },
            { offset: 3, name: 'Zoom', type: 'Zoom', resolution: 8, defaultValue: 128 },
            { offset: 4, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 5, defaultValue: 128 },
            { offset: 6, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 7, defaultValue: 128 },
            { offset: 9, name: 'Red', type: 'ColorIntensity', color: 'Red', resolution: 8, defaultValue: 255 },
            { offset: 10, name: 'Green', type: 'ColorIntensity', color: 'Green', resolution: 8, defaultValue: 255 },
            { offset: 11, name: 'Blue', type: 'ColorIntensity', color: 'Blue', resolution: 8, defaultValue: 255 },
            { offset: 12, name: 'White', type: 'ColorIntensity', color: 'White', resolution: 8, defaultValue: 0 }
          ]
        },
        {
          name: 'Extended (25ch Aura Backlight)',
          channelCount: 25,
          channels: [
            { offset: 1, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 2, name: 'Dimmer', type: 'Intensity', resolution: 8, defaultValue: 255 },
            { offset: 4, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 5, defaultValue: 128 },
            { offset: 6, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 7, defaultValue: 128 }
          ]
        }
      ]
    },
    {
      id: 'martin/mac-viper-profile',
      manufacturer: 'Martin',
      name: 'MAC Viper Profile',
      category: 'spot',
      physical: { beamAngleMin: 10, beamAngleMax: 44, lumens: 26000, powerW: 1225, weightKg: 37.2, panMaxDeg: 540, tiltMaxDeg: 268 },
      modes: [
        {
          name: '16-bit (26ch)',
          channelCount: 26,
          channels: [
            { offset: 1, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 2, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 3, defaultValue: 255 },
            { offset: 4, name: 'Cyan', type: 'ColorIntensity', color: 'Cyan', resolution: 8, defaultValue: 0 },
            { offset: 5, name: 'Magenta', type: 'ColorIntensity', color: 'Magenta', resolution: 8, defaultValue: 0 },
            { offset: 6, name: 'Yellow', type: 'ColorIntensity', color: 'Yellow', resolution: 8, defaultValue: 0 },
            { offset: 19, name: 'Zoom', type: 'Zoom', resolution: 8, defaultValue: 128 },
            { offset: 22, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 23, defaultValue: 128 },
            { offset: 24, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 25, defaultValue: 128 }
          ]
        }
      ]
    },
    {
      id: 'chauvet-professional/rogue-r2-wash',
      manufacturer: 'Chauvet Professional',
      name: 'Rogue R2 Wash',
      category: 'wash',
      physical: { beamAngleMin: 12, beamAngleMax: 49, lumens: 7900, powerW: 330, weightKg: 9.2, panMaxDeg: 540, tiltMaxDeg: 230 },
      modes: [
        {
          name: '15ch Tour',
          channelCount: 15,
          channels: [
            { offset: 1, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 6, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 7, defaultValue: 255 },
            { offset: 8, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 0 },
            { offset: 9, name: 'Red', type: 'ColorIntensity', color: 'Red', resolution: 8, defaultValue: 255 },
            { offset: 10, name: 'Green', type: 'ColorIntensity', color: 'Green', resolution: 8, defaultValue: 255 },
            { offset: 11, name: 'Blue', type: 'ColorIntensity', color: 'Blue', resolution: 8, defaultValue: 255 },
            { offset: 12, name: 'White', type: 'ColorIntensity', color: 'White', resolution: 8, defaultValue: 0 },
            { offset: 14, name: 'Zoom', type: 'Zoom', resolution: 8, defaultValue: 128 }
          ]
        }
      ]
    },
    {
      id: 'chauvet-professional/colorado-pxl-bar-16',
      manufacturer: 'Chauvet Professional',
      name: 'COLORado PXL Bar 16',
      category: 'pixel',
      physical: { beamAngleMin: 5.8, beamAngleMax: 42, lumens: 9200, powerW: 615, weightKg: 21.8, panMaxDeg: 180, tiltMaxDeg: 200 },
      modes: [
        {
          name: '19ch Basic Motorized Bar',
          channelCount: 19,
          channels: [
            { offset: 1, name: 'Tilt 1', type: 'Tilt', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt 2', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 6, name: 'Zoom 1', type: 'Zoom', resolution: 8, defaultValue: 128 },
            { offset: 8, name: 'Red', type: 'ColorIntensity', color: 'Red', resolution: 8, defaultValue: 255 },
            { offset: 9, name: 'Green', type: 'ColorIntensity', color: 'Green', resolution: 8, defaultValue: 255 },
            { offset: 10, name: 'Blue', type: 'ColorIntensity', color: 'Blue', resolution: 8, defaultValue: 255 },
            { offset: 11, name: 'White', type: 'ColorIntensity', color: 'White', resolution: 8, defaultValue: 0 },
            { offset: 17, name: 'Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 0 },
            { offset: 18, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 19, defaultValue: 255 }
          ]
        }
      ]
    },
    {
      id: 'adj/jolt-300',
      manufacturer: 'ADJ',
      name: 'Jolt 300',
      category: 'strobe',
      physical: { beamAngleMin: 45, beamAngleMax: 120, lumens: 11500, powerW: 230, weightKg: 3.8, panMaxDeg: 180, tiltMaxDeg: 180 },
      modes: [
        {
          name: '10ch Zone Strobe',
          channelCount: 10,
          channels: [
            { offset: 1, name: 'Zone Dimmer', type: 'Intensity', resolution: 16, fineOffset: 2, defaultValue: 255 },
            { offset: 3, name: 'Zone Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 0 },
            { offset: 4, name: 'Red', type: 'ColorIntensity', color: 'Red', resolution: 8, defaultValue: 255 },
            { offset: 5, name: 'Green', type: 'ColorIntensity', color: 'Green', resolution: 8, defaultValue: 255 },
            { offset: 6, name: 'Blue', type: 'ColorIntensity', color: 'Blue', resolution: 8, defaultValue: 255 },
            { offset: 7, name: 'White Strobe Strip', type: 'Intensity', resolution: 8, defaultValue: 255 }
          ]
        }
      ]
    },
    {
      id: 'ayrton/magicblade-r',
      manufacturer: 'Ayrton',
      name: 'MagicBlade-R',
      category: 'pixel',
      physical: { beamAngleMin: 4.5, beamAngleMax: 4.5, lumens: 2500, powerW: 180, weightKg: 12.6, panMaxDeg: 540, tiltMaxDeg: 270 },
      modes: [
        {
          name: '18ch Standard Continuous',
          channelCount: 18,
          channels: [
            { offset: 1, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 8, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 255 },
            { offset: 9, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 10, defaultValue: 255 },
            { offset: 11, name: 'Red', type: 'ColorIntensity', color: 'Red', resolution: 8, defaultValue: 255 },
            { offset: 12, name: 'Green', type: 'ColorIntensity', color: 'Green', resolution: 8, defaultValue: 255 },
            { offset: 13, name: 'Blue', type: 'ColorIntensity', color: 'Blue', resolution: 8, defaultValue: 255 },
            { offset: 14, name: 'White', type: 'ColorIntensity', color: 'White', resolution: 8, defaultValue: 0 }
          ]
        }
      ]
    },
    {
      id: 'elation/proteus-maximus',
      manufacturer: 'Elation',
      name: 'Proteus Maximus',
      category: 'spot',
      physical: { beamAngleMin: 5.5, beamAngleMax: 55, lumens: 50000, powerW: 1350, weightKg: 53.0, panMaxDeg: 540, tiltMaxDeg: 260 },
      modes: [
        {
          name: '37ch Standard IP65 Profile',
          channelCount: 37,
          channels: [
            { offset: 1, name: 'Pan', type: 'Pan', resolution: 16, fineOffset: 2, defaultValue: 128 },
            { offset: 3, name: 'Tilt', type: 'Tilt', resolution: 16, fineOffset: 4, defaultValue: 128 },
            { offset: 5, name: 'Cyan', type: 'ColorIntensity', color: 'Cyan', resolution: 16, fineOffset: 6, defaultValue: 0 },
            { offset: 7, name: 'Magenta', type: 'ColorIntensity', color: 'Magenta', resolution: 16, fineOffset: 8, defaultValue: 0 },
            { offset: 9, name: 'Yellow', type: 'ColorIntensity', color: 'Yellow', resolution: 16, fineOffset: 10, defaultValue: 0 },
            { offset: 25, name: 'Zoom', type: 'Zoom', resolution: 16, fineOffset: 26, defaultValue: 64 },
            { offset: 31, name: 'Shutter / Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 32 },
            { offset: 32, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 33, defaultValue: 255 }
          ]
        }
      ]
    },
    {
      id: 'generic/rgbwauv-par-64',
      manufacturer: 'Generic',
      name: 'RGBWA+UV LED Par 64',
      category: 'par',
      physical: { beamAngleMin: 25, beamAngleMax: 40, lumens: 4200, powerW: 180, weightKg: 3.2, panMaxDeg: 180, tiltMaxDeg: 180 },
      modes: [
        {
          name: '10ch 16-bit Dimmer + 6-in-1',
          channelCount: 10,
          channels: [
            { offset: 1, name: 'Dimmer', type: 'Intensity', resolution: 16, fineOffset: 2, defaultValue: 255 },
            { offset: 3, name: 'Red', type: 'ColorIntensity', color: 'Red', resolution: 8, defaultValue: 255 },
            { offset: 4, name: 'Green', type: 'ColorIntensity', color: 'Green', resolution: 8, defaultValue: 255 },
            { offset: 5, name: 'Blue', type: 'ColorIntensity', color: 'Blue', resolution: 8, defaultValue: 255 },
            { offset: 6, name: 'White', type: 'ColorIntensity', color: 'White', resolution: 8, defaultValue: 0 },
            { offset: 7, name: 'Amber', type: 'ColorIntensity', color: 'Amber', resolution: 8, defaultValue: 0 },
            { offset: 8, name: 'UV', type: 'ColorIntensity', color: 'UV', resolution: 8, defaultValue: 0 },
            { offset: 9, name: 'Strobe', type: 'ShutterStrobe', resolution: 8, defaultValue: 0 },
            { offset: 10, name: 'Macro', type: 'Effect', resolution: 8, defaultValue: 0 }
          ]
        }
      ]
    }
  ];

  Object.freeze(OFL_FIXTURES);
  if (typeof window !== 'undefined') {
    window.OFL_FIXTURES = OFL_FIXTURES;
  }
  if (typeof globalThis !== 'undefined') {
    globalThis.OFL_FIXTURES = OFL_FIXTURES;
  }
})();
