/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

let dom;

beforeEach(() => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  document.documentElement.innerHTML = html;

  // The calculator script is inline in the HTML. We need to evaluate it
  // so that the global functions and variables are available for testing.
  const scriptContent = document.querySelector('script').textContent;
  eval(scriptContent);
});

// ── Helper: simulate pressing a sequence of buttons ──
function pressButton(label) {
  const buttons = document.querySelectorAll('button');
  for (const btn of buttons) {
    if (btn.textContent.trim() === label) {
      btn.click();
      return;
    }
  }
  // Try data-operation attribute for operation buttons
  const opBtn = document.querySelector(`[data-operation="${label}"]`);
  if (opBtn) {
    opBtn.click();
    return;
  }
  throw new Error(`Button "${label}" not found`);
}

function getDisplay() {
  return document.querySelector('.current-operand').textContent;
}

function getPreviousDisplay() {
  return document.querySelector('.previous-operand').textContent;
}

// ── Basic Operations ──

describe('Addition (+)', () => {
  test('2 + 3 = 5', () => {
    pressButton('2');
    pressButton('+');
    pressButton('3');
    pressButton('=');
    expect(getDisplay()).toBe('5');
  });

  test('0 + 0 = 0', () => {
    pressButton('0');
    pressButton('+');
    pressButton('0');
    pressButton('=');
    expect(getDisplay()).toBe('0');
  });

  test('large numbers: 999 + 1 = 1000', () => {
    pressButton('9');
    pressButton('9');
    pressButton('9');
    pressButton('+');
    pressButton('1');
    pressButton('=');
    expect(getDisplay()).toBe('1000');
  });

  test('decimal addition: 1.5 + 2.3 = 3.8', () => {
    pressButton('1');
    pressButton('.');
    pressButton('5');
    pressButton('+');
    pressButton('2');
    pressButton('.');
    pressButton('3');
    pressButton('=');
    expect(getDisplay()).toBe('3.8');
  });
});

describe('Subtraction (-)', () => {
  test('5 - 3 = 2', () => {
    pressButton('5');
    pressButton('-');
    pressButton('3');
    pressButton('=');
    expect(getDisplay()).toBe('2');
  });

  test('3 - 5 = -2 (negative result)', () => {
    pressButton('3');
    pressButton('-');
    pressButton('5');
    pressButton('=');
    expect(getDisplay()).toBe('-2');
  });

  test('0 - 0 = 0', () => {
    pressButton('0');
    pressButton('-');
    pressButton('0');
    pressButton('=');
    expect(getDisplay()).toBe('0');
  });

  test('decimal subtraction: 5.5 - 2.2 = 3.3', () => {
    pressButton('5');
    pressButton('.');
    pressButton('5');
    pressButton('-');
    pressButton('2');
    pressButton('.');
    pressButton('2');
    pressButton('=');
    expect(getDisplay()).toBe('3.3');
  });
});

describe('Multiplication (×)', () => {
  test('4 × 3 = 12', () => {
    pressButton('4');
    pressButton('×');
    pressButton('3');
    pressButton('=');
    expect(getDisplay()).toBe('12');
  });

  test('anything × 0 = 0', () => {
    pressButton('9');
    pressButton('×');
    pressButton('0');
    pressButton('=');
    expect(getDisplay()).toBe('0');
  });

  test('anything × 1 = itself', () => {
    pressButton('7');
    pressButton('×');
    pressButton('1');
    pressButton('=');
    expect(getDisplay()).toBe('7');
  });

  test('decimal multiplication: 2.5 × 4 = 10', () => {
    pressButton('2');
    pressButton('.');
    pressButton('5');
    pressButton('×');
    pressButton('4');
    pressButton('=');
    expect(getDisplay()).toBe('10');
  });
});

describe('Division (÷)', () => {
  test('8 ÷ 2 = 4', () => {
    pressButton('8');
    pressButton('÷');
    pressButton('2');
    pressButton('=');
    expect(getDisplay()).toBe('4');
  });

  test('7 ÷ 2 = 3.5', () => {
    pressButton('7');
    pressButton('÷');
    pressButton('2');
    pressButton('=');
    expect(getDisplay()).toBe('3.5');
  });

  test('0 ÷ 5 = 0', () => {
    pressButton('0');
    pressButton('÷');
    pressButton('5');
    pressButton('=');
    expect(getDisplay()).toBe('0');
  });

  test('division by zero shows alert and resets', () => {
    // jsdom's alert is a no-op by default; spy on it
    const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

    pressButton('5');
    pressButton('÷');
    pressButton('0');
    pressButton('=');

    expect(alertSpy).toHaveBeenCalledWith('Erro: Divisão por zero!');
    // After division by zero the calculator should reset
    expect(getDisplay()).toBe('0');

    alertSpy.mockRestore();
  });

  test('decimal division: 9.9 ÷ 3 = 3.3', () => {
    pressButton('9');
    pressButton('.');
    pressButton('9');
    pressButton('÷');
    pressButton('3');
    pressButton('=');
    expect(getDisplay()).toBe('3.3');
  });
});

// ── Chained operations ──

describe('Chained operations', () => {
  test('2 + 3 + 4 = 9 (chain additions)', () => {
    pressButton('2');
    pressButton('+');
    pressButton('3');
    pressButton('+'); // should compute 2+3=5 first
    pressButton('4');
    pressButton('=');
    expect(getDisplay()).toBe('9');
  });

  test('10 - 3 × 2 = 14 (left-to-right, no precedence)', () => {
    pressButton('1');
    pressButton('0');
    pressButton('-');
    pressButton('3');
    pressButton('×'); // computes 10-3=7
    pressButton('2');
    pressButton('=');
    expect(getDisplay()).toBe('14');
  });
});

// ── Clear and Delete ──

describe('Clear (AC) and Delete (DEL)', () => {
  test('AC resets to 0', () => {
    pressButton('5');
    pressButton('+');
    pressButton('3');
    pressButton('AC');
    expect(getDisplay()).toBe('0');
    expect(getPreviousDisplay()).toBe('');
  });

  test('DEL removes last digit', () => {
    pressButton('1');
    pressButton('2');
    pressButton('3');
    pressButton('DEL');
    expect(getDisplay()).toBe('12');
  });

  test('DEL on single digit resets to 0', () => {
    pressButton('5');
    pressButton('DEL');
    expect(getDisplay()).toBe('0');
  });
});

// ── Decimal handling ──

describe('Decimal handling', () => {
  test('only one decimal point allowed', () => {
    pressButton('1');
    pressButton('.');
    pressButton('.');
    pressButton('2');
    expect(getDisplay()).toBe('1.2');
  });
});

// ── Result formatting ──

describe('Result formatting', () => {
  test('integer results have no decimal point', () => {
    pressButton('6');
    pressButton('+');
    pressButton('4');
    pressButton('=');
    expect(getDisplay()).toBe('10');
    expect(getDisplay()).not.toContain('.');
  });

  test('long decimal results are limited to 10 decimal places', () => {
    // 1 ÷ 3 = 0.3333333333 (10 decimal places max)
    pressButton('1');
    pressButton('÷');
    pressButton('3');
    pressButton('=');
    const result = getDisplay();
    const decimalPart = result.split('.')[1] || '';
    expect(decimalPart.length).toBeLessThanOrEqual(10);
  });
});

// ── Regression: consecutive equals ──

describe('Regression: pressing equals without operation', () => {
  test('pressing = with no operation does nothing', () => {
    pressButton('5');
    pressButton('=');
    expect(getDisplay()).toBe('5');
  });
});

// ── Regression: operation after result ──

describe('Regression: operation after result', () => {
  test('can chain a new operation after getting a result', () => {
    pressButton('2');
    pressButton('+');
    pressButton('3');
    pressButton('=');
    expect(getDisplay()).toBe('5');

    // Now use result in a new operation
    pressButton('+');
    pressButton('7');
    pressButton('=');
    expect(getDisplay()).toBe('12');
  });
});
