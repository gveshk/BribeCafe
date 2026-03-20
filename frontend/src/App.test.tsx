import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from './App';

// Basic component tests
describe('App', () => {
  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});

// Add more tests as needed
