import { VisemeType } from '../../types';

export interface MouthShape {
  width: number;       // scale factor 0.8 to 1.4
  openHeight: number;  // open height 0 to 25px
  roundness: number;   // 0 (flat) to 1.0 (oval/circular)
  lipTension: number;  // -0.5 (frown) to 0.5 (smile)
}

export class LipSyncController {
  private currentViseme: VisemeType = 'REST';
  private targetMouth: MouthShape = { width: 1.0, openHeight: 0, roundness: 0.2, lipTension: 0.2 };
  private currentMouth: MouthShape = { width: 1.0, openHeight: 0, roundness: 0.2, lipTension: 0.2 };

  public setViseme(viseme: VisemeType, audioLevel: number = 0.5) {
    this.currentViseme = viseme;
    const boost = Math.min(1.0, Math.max(0.2, audioLevel * 1.5));

    switch (viseme) {
      case 'AA':
        this.targetMouth = { width: 1.15, openHeight: 22 * boost, roundness: 0.8, lipTension: 0.1 };
        break;
      case 'EE':
        this.targetMouth = { width: 1.35, openHeight: 10 * boost, roundness: 0.1, lipTension: 0.45 };
        break;
      case 'IH':
        this.targetMouth = { width: 1.2, openHeight: 12 * boost, roundness: 0.2, lipTension: 0.3 };
        break;
      case 'OH':
        this.targetMouth = { width: 0.85, openHeight: 20 * boost, roundness: 0.95, lipTension: 0.0 };
        break;
      case 'OU':
        this.targetMouth = { width: 0.75, openHeight: 14 * boost, roundness: 1.0, lipTension: 0.0 };
        break;
      case 'MBP':
        this.targetMouth = { width: 0.95, openHeight: 0, roundness: 0.0, lipTension: 0.1 };
        break;
      case 'FV':
        this.targetMouth = { width: 1.1, openHeight: 4 * boost, roundness: 0.1, lipTension: 0.15 };
        break;
      case 'TH':
        this.targetMouth = { width: 1.15, openHeight: 8 * boost, roundness: 0.3, lipTension: 0.2 };
        break;
      case 'CDGK':
        this.targetMouth = { width: 1.2, openHeight: 10 * boost, roundness: 0.2, lipTension: 0.25 };
        break;
      case 'REST':
      default:
        this.targetMouth = { width: 1.0, openHeight: 0, roundness: 0.2, lipTension: 0.2 };
        break;
    }
  }

  public update(delta: number = 0.16): MouthShape {
    // Smooth lerp interpolation for natural, fluid lip movement
    const lerpSpeed = 0.35;
    this.currentMouth.width += (this.targetMouth.width - this.currentMouth.width) * lerpSpeed;
    this.currentMouth.openHeight += (this.targetMouth.openHeight - this.currentMouth.openHeight) * lerpSpeed;
    this.currentMouth.roundness += (this.targetMouth.roundness - this.currentMouth.roundness) * lerpSpeed;
    this.currentMouth.lipTension += (this.targetMouth.lipTension - this.currentMouth.lipTension) * lerpSpeed;
    return this.currentMouth;
  }
}
