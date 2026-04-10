export const authStyles = `
  .auth-page {
    min-height: 100vh;
    background: #0D0A07;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px 16px;
    font-family: 'DM Mono', monospace;
    box-sizing: border-box;
  }

  .auth-card {
    width: 100%;
    max-width: 400px;
    background: #1A1208;
    border: 1px solid #3D2B10;
    border-radius: 14px;
    padding: 40px 32px;
    box-sizing: border-box;
  }

  .auth-logo {
    font-family: 'Playfair Display', serif;
    font-size: 26px;
    font-weight: 700;
    color: #E8A020;
    margin: 0 0 4px;
    letter-spacing: -0.5px;
  }

  .auth-tagline {
    font-size: 10px;
    color: #8A7660;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin: 0 0 36px;
  }

  .auth-title {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #F2E8D5;
    margin: 0 0 24px;
  }

  .auth-field {
    margin-bottom: 16px;
  }

  .auth-field label {
    display: block;
    font-size: 10px;
    color: #8A7660;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .auth-field input {
    width: 100%;
    background: #2E2214;
    border: 1px solid #3D2B10;
    border-radius: 8px;
    padding: 12px 14px;
    color: #F2E8D5;
    font-family: 'DM Mono', monospace;
    font-size: 13px;
    box-sizing: border-box;
    transition: border-color 0.2s;
    outline: none;
  }

  .auth-field input:focus {
    border-color: #C8820A;
  }

  .auth-field input::placeholder {
    color: #5a4a38;
  }

  .auth-btn {
    width: 100%;
    padding: 13px;
    background: linear-gradient(135deg, #E8A020, #C8820A);
    border: none;
    border-radius: 8px;
    color: #0D0A07;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
    font-weight: 500;
    letter-spacing: 2px;
    text-transform: uppercase;
    cursor: pointer;
    margin-top: 8px;
    transition: opacity 0.2s, transform 0.1s;
    display: block;
    text-align: center;
    text-decoration: none;
    box-sizing: border-box;
  }

  .auth-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .auth-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .auth-error {
    background: rgba(139, 46, 46, 0.15);
    border: 1px solid #8B2E2E;
    border-radius: 8px;
    padding: 12px 14px;
    color: #e07070;
    font-size: 12px;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .auth-success {
    background: rgba(45, 90, 39, 0.2);
    border: 1px solid #5cb85c;
    border-radius: 8px;
    padding: 12px 14px;
    color: #5cb85c;
    font-size: 12px;
    margin-bottom: 16px;
    line-height: 1.5;
  }

  .auth-footer {
    text-align: center;
    margin-top: 24px;
    font-size: 12px;
    color: #8A7660;
  }

  .auth-footer a {
    color: #E8A020;
    text-decoration: none;
  }

  .auth-footer a:hover {
    text-decoration: underline;
  }

  .auth-link {
    color: #E8A020;
    text-decoration: none;
    font-family: 'DM Mono', monospace;
    font-size: 12px;
  }

  .auth-link:hover {
    text-decoration: underline;
  }

  .auth-muted {
    color: #8A7660;
    font-size: 12px;
    line-height: 1.6;
  }
`
