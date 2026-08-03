import { useState } from 'react';
import Icon from './Icon';

export default function PasswordField({ label, id, name, value, onChange, placeholder = 'Enter password', required = false }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field-wrap">
      <label htmlFor={id}>{label}</label>
      <div className="input-with-action">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          placeholder={placeholder}
          required={required}
          value={value}
          onChange={onChange}
        />
        <button
          className="inline-action"
          type="button"
          onClick={() => setVisible(!visible)}
        >
          <Icon name={visible ? 'visibility_off' : 'visibility'} size={16} />
          {visible ? ' Hide' : ' Show'}
        </button>
      </div>
    </div>
  );
}
