import { useState, useRef, useEffect } from 'react';
import { RiLockPasswordFill } from "react-icons/ri";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";
import '/src/styles/components/auth/register/RegisterPasswordInput.css';

const RegisterPasswordInput = ({
  formData,
  touched,
  showPass,
  showConfirm,
  showPasswordPanel,
  passwordChecks,
  passwordValid,
  confirmMatches,
  isLoading,
  onPasswordChange,
  onPasswordBlur,
  onToggleShowPass,
  onToggleShowConfirm
}) => {
  const [showRules, setShowRules] = useState(false);
  const rulesRef = useRef(null);
  const passwordInputRef = useRef(null);

  const showValid = (valueLen, isValid) => valueLen > 0 && isValid;

  // Cerrar el popover al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (rulesRef.current && !rulesRef.current.contains(event.target) &&
          passwordInputRef.current && !passwordInputRef.current.contains(event.target)) {
        setShowRules(false);
      }
    };

    if (showRules) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showRules]);

  const handlePasswordFocus = () => {
    setShowRules(true);
    onPasswordBlur('password');
  };

  const handlePasswordChange = (e) => {
    onPasswordChange('password', e.target.value);
  };

  return (
    <>
      {/* CONTRASEÑA */}
      <div className="register-form-group register-password-group">
        <label htmlFor="password" className="register-form-label">
          Contraseña *
        </label>
        <div className="register-input-container" ref={passwordInputRef}>
          <RiLockPasswordFill className="register-input-icon" />
          <input
            ref={passwordInputRef}
            type={showPass ? 'text' : 'password'}
            id="password"
            name="password"
            className={`register-input ${touched.password && formData.password.length > 0 && !passwordValid ? 'register-input-invalid' : ''}`}
            placeholder="Crea una contraseña segura"
            value={formData.password}
            onChange={handlePasswordChange}
            onBlur={() => onPasswordBlur('password')}
            onFocus={handlePasswordFocus}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {formData.password.length > 0 && (
            <button
              type="button"
              className="register-toggle-icon"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onToggleShowPass}
              aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPass ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
            </button>
          )}
          {touched.password && formData.password.length > 0 && !passwordValid && (
            <span className="register-status-icon">!</span>
          )}
        </div>
        {touched.password && formData.password.length > 0 && !passwordValid && (
          <span className="register-field-hint register-error">La contraseña no cumple con los requisitos.</span>
        )}
        {showValid(formData.password.length, passwordValid) && (
          <span className="register-valid-badge">✓ Válido</span>
        )}

        {/* Panel de reglas */}
        {showRules && (
          <div className="register-password-rules-popover" ref={rulesRef}>
            <div className="register-arrow" />
            <p className="register-rules-title">La contraseña debe tener:</p>
            <ul className="register-rules-list">
              <li className={passwordChecks.len ? 'register-ok' : ''}>
                {passwordChecks.len ? '✓ ' : '• '}Mínimo 6 caracteres
              </li>
              <li className={passwordChecks.upper ? 'register-ok' : ''}>
                {passwordChecks.upper ? '✓ ' : '• '}Al menos una mayúscula
              </li>
              <li className={passwordChecks.digit ? 'register-ok' : ''}>
                {passwordChecks.digit ? '✓ ' : '• '}Al menos un número
              </li>
              <li className={passwordChecks.special ? 'register-ok' : ''}>
                {passwordChecks.special ? '✓ ' : '• '}Un carácter especial (@#$%^&*)
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* CONFIRMAR CONTRASEÑA */}
      <div className="register-form-group">
        <label htmlFor="confirmPassword" className="register-form-label">
          Confirmar Contraseña *
        </label>
        <div className="register-input-container">
          <RiLockPasswordFill className="register-input-icon" />
          <input
            type={showConfirm ? 'text' : 'password'}
            id="confirmPassword"
            name="confirmPassword"
            className={`register-input ${touched.confirmPassword && formData.confirmPassword.length > 0 && !confirmMatches ? 'register-input-invalid' : ''}`}
            placeholder="Repite tu contraseña"
            value={formData.confirmPassword}
            onChange={(e) => onPasswordChange('confirmPassword', e.target.value)}
            onBlur={() => onPasswordBlur('confirmPassword')}
            onFocus={() => setShowRules(false)}
            disabled={isLoading}
            autoComplete="new-password"
          />
          {formData.confirmPassword.length > 0 && (
            <button
              type="button"
              className="register-toggle-icon"
              onMouseDown={(e) => e.preventDefault()}
              onClick={onToggleShowConfirm}
              aria-label={showConfirm ? 'Ocultar confirmación' : 'Mostrar confirmación'}
            >
              {showConfirm ? <AiOutlineEyeInvisible size={18} /> : <AiOutlineEye size={18} />}
            </button>
          )}
        </div>
        {touched.confirmPassword && formData.confirmPassword.length > 0 && !confirmMatches && (
          <span className="register-field-hint register-error">Las contraseñas no coinciden.</span>
        )}
        {showValid(formData.confirmPassword.length, confirmMatches) && (
          <span className="register-valid-badge">✓ Válido</span>
        )}
      </div>
    </>
  );
};

export default RegisterPasswordInput;