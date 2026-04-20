import React from 'react';
import { usePhoneValidation } from '../../hooks/usePhoneValidation';

const PhoneInput = ({ 
  label, 
  name, 
  value, 
  onChange, 
  placeholder, 
  required = false, 
  error: externalError,
  className = "modern-input"
}) => {
  const { validatePhone } = usePhoneValidation();
  
  // Combine internal validation with any external error passed from parent
  const internalError = validatePhone(value);
  const displayError = externalError || internalError;

  const handleChange = (e) => {
    onChange(e);
  };

  return (
    <div className="form-group">
      {label && <label className="field-label">{label}</label>}
      <input
        type="tel"
        name={name}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`${className} ${displayError ? 'invalid' : ''}`}
      />
      {displayError && <span className="form-error">{displayError}</span>}
    </div>
  );
};

export default PhoneInput;
