import React from 'react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  onChange?: (value: any, event?: React.ChangeEvent<HTMLInputElement>) => void;
}

export function DateInput({ onChange, value, ...props }: DateInputProps) {
  let formattedValue = "";
  if (typeof value === "string") {
    if (value.includes("T")) {
      formattedValue = value.split("T")[0];
    } else {
      formattedValue = value;
    }
  } else if (value) {
    formattedValue = String(value);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      const val = e.target.value;
      const valWrapper: any = new String(val);
      valWrapper.target = e.target;
      valWrapper.currentTarget = e.currentTarget;
      onChange(valWrapper, e);
    }
  };

  return (
    <input
      type="date"
      {...props}
      value={formattedValue}
      onChange={handleChange}
      className={props.className || "w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white cursor-pointer"}
    />
  );
}
