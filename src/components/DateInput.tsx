import React from 'react';

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
}

export function DateInput(props: DateInputProps) {
  return (
    <input
      type="date"
      {...props}
      className={props.className || "w-full text-sm p-2 border border-slate-300 rounded focus:border-[#2980b9] outline-none text-slate-700 bg-white"}
    />
  );
}
