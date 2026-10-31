import { describe, expect, it } from 'vitest';
import {
  DARK_TEXT,
  DEFAULT_LOOK,
  LIGHT_TEXT,
  hexColor,
  isHeaderFont,
  isStyled,
  textColour,
} from './header-style';

describe('organisation header look', () => {
  it('accepts only #rrggbb colours', () => {
    expect(hexColor('#1F6FEB')).toBe('#1f6feb');
    expect(hexColor('#fff')).toBe(null);
    expect(hexColor('red')).toBe(null);
    expect(hexColor('#12345g')).toBe(null);
  });

  it('knows its fonts and nothing else', () => {
    expect(isHeaderFont('serif')).toBe(true);
    expect(isHeaderFont('toString')).toBe(false);
    expect(isHeaderFont('comic')).toBe(false);
  });

  it('picks a readable text colour', () => {
    expect(textColour({ ...DEFAULT_LOOK, bg: '#0b3d91' })).toBe(LIGHT_TEXT);
    expect(textColour({ ...DEFAULT_LOOK, bg: '#ffe680' })).toBe(DARK_TEXT);
    expect(textColour({ ...DEFAULT_LOOK, imageVersion: '1' })).toBe(LIGHT_TEXT);
    expect(textColour({ ...DEFAULT_LOOK, bg: '#0b3d91', text: 'dark' })).toBe(DARK_TEXT);
    expect(textColour(DEFAULT_LOOK)).toBe(null);
    expect(textColour({ ...DEFAULT_LOOK, text: 'dark' })).toBe(null);
  });

  it('draws a card only when something was chosen', () => {
    expect(isStyled(DEFAULT_LOOK)).toBe(false);
    expect(isStyled({ ...DEFAULT_LOOK, font: 'serif' })).toBe(false);
    expect(isStyled({ ...DEFAULT_LOOK, bg: '#000000' })).toBe(true);
  });
});
