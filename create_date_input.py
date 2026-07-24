import os

os.makedirs('src/components', exist_ok=True)

content = '''import React, { useState, useEffect } from 'react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string; // Expected in YYYY-MM-DD format or empty
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DateInput({ value, onChange, className, name, required }: DateInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  // Sync external YYYY-MM-DD to internal DD/MM/YYYY
  useEffect(() => {
    if (!value) {
      setDisplayValue('');
      return;
    }
    // value is YYYY-MM-DD
    const parts = value.split('-');
    if (parts.length === 3) {
      const [year, month, day] = parts;
      if (year.length === 4) {
        setDisplayValue(${day}//);
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove non-digits
    
    // Auto-format as DD/MM/YYYY
    if (input.length > 8) input = input.slice(0, 8);
    
    let formatted = input;
    if (input.length >= 3 && input.length <= 4) {
      formatted = ${input.slice(0, 2)}/;
    } else if (input.length >= 5) {
      formatted = ${input.slice(0, 2)}//;
    }
    
    setDisplayValue(formatted);

    // If fully typed (8 digits), emit the YYYY-MM-DD format
    if (input.length === 8) {
      const day = input.slice(0, 2);
      const month = input.slice(2, 4);
      const year = input.slice(4, 8);
      
      const isoDate = ${year}--;
      
      // Create synthetic event
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || '',
          value: isoDate,
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(syntheticEvent);
    } else if (input.length === 0) {
      // Allow clearing
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: name || '',
          value: '',
        }
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <input
      type="text"
      name={name}
      required={required}
      value={displayValue}
      onChange={handleChange}
      className={className}
      placeholder="DD/MM/AAAA"
      maxLength={10}
    />
  );
}
'''

with open('src/components/DateInput.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
