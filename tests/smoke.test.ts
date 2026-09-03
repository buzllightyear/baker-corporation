import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createElement } from 'react';
import { App } from '../src/ui/App';
describe('app', () => { it('renders the title', () => { render(createElement(App)); expect(screen.getByText('The Baker Corporation')).toBeTruthy(); }); });
